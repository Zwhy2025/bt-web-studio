import React, { useCallback, useEffect, useState, useRef } from "react"
import { useToast } from "@/hooks/use-toast"
import ReactFlow, {
    Background,
    BackgroundVariant,
    Controls,
    MiniMap,
    Node,
    Edge,
    addEdge,
    Connection,
    useEdgesState,
    useNodesState,
    ReactFlowProvider,
    useReactFlow,
    MarkerType,
    ConnectionLineType,
    ConnectionMode,
    NodeDragHandler,
    OnSelectionChangeParams,
    OnNodesChange,
    OnEdgesChange,
    applyNodeChanges,
    applyEdgeChanges,
} from "reactflow"
import { nodeTypes } from "@/components/canvas/custom-nodes"
import { useBehaviorTreeStore } from "@/core/store/behavior-tree-store"
import { HistoryManager } from "@/core/utils/history-utils"
import { autoLayoutTree, scatterNodes } from "@/core/layout/auto-layout-utils"
import {
    calculateAlignmentGuides,
    alignNodes,
    GRID_SIZE,
    AlignmentGuide,
    getNodesInSelectionBox,
} from "@/core/layout/alignment-utils"
import {
    AlignmentGuides,
    GridSnapIndicator,
    SelectionBox,
    GridBackground,
    AlignmentToolbar
} from "@/components/canvas/alignment-guides"
import {
    ContextMenu,
    ContextMenuTrigger,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuLabel,
    ContextMenuShortcut,
    ContextMenuSub,
    ContextMenuSubTrigger,
    ContextMenuSubContent,
} from "@/components/ui/context-menu"
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { RotateCcw, RotateCw, Copy, ClipboardPaste, Trash2, Info, Grid3X3, AlignLeft, GitBranch, RefreshCcw, Bug } from "lucide-react"

// 检查是否会形成回路
function wouldCreateCycle(sourceId: string, targetId: string, edges: Edge[], nodes: Node[]): boolean {
    // 如果目标节点是根节点，则不允许连接
    if (targetId === "root") {
        return true;
    }

    // 检查是否直接连接到自己的父节点（形成双向连接）
    const isDirectParent = edges.some(edge => edge.source === targetId && edge.target === sourceId);
    if (isDirectParent) {
        return true;
    }

    // 检查是否会形成间接回路
    const visited = new Set<string>();
    const stack: string[] = [sourceId];

    while (stack.length > 0) {
        const currentId = stack.pop()!;
        if (currentId === targetId) {
            return true; // 发现回路
        }
        if (visited.has(currentId)) {
            continue;
        }
        visited.add(currentId);

        // 将当前节点的所有子节点添加到栈中
        edges
            .filter(edge => edge.source === currentId)
            .forEach(edge => stack.push(edge.target));
    }

    return false; // 没有发现回路
}

function CanvasInner({
    onNodesExport,
    onEdgesExport,
    onSelectionChange
}: {
    onNodesExport?: (nodes: Node[]) => void;
    onEdgesExport?: (edges: Edge[]) => void;
    onSelectionChange?: (params: OnSelectionChangeParams) => void;
}) {
    // 从状态管理系统获取当前会话的节点和边
    const storeNodes = useBehaviorTreeStore(state => state.nodes)
    const storeEdges = useBehaviorTreeStore(state => state.edges)
    const expandedSubTrees = useBehaviorTreeStore(state => state.expandedSubTrees)
    const currentSession = useBehaviorTreeStore(state => state.currentSession)
    const actions = useBehaviorTreeStore(state => state.actions)

    const [nodes, setNodes] = useNodesState(storeNodes)
    const [edges, setEdges] = useEdgesState<Edge>(storeEdges as Edge[])

    const onNodesChange: OnNodesChange = useCallback(
        (changes) => {
            const newNodes = applyNodeChanges(changes, nodes);
            setNodes(newNodes); // 先更新本地状态
            actions.importData(newNodes, edges as any, { merge: true }); // 再同步到全局状态
        },
        [nodes, edges, actions, setNodes]
    );

    const onEdgesChange: OnEdgesChange = useCallback(
        (changes) => {
            const newEdges = applyEdgeChanges(changes, edges);
            setEdges(newEdges); // 先更新本地状态
            actions.importData(nodes, newEdges as any, { merge: true }); // 再同步到全局状态
        },
        [nodes, edges, actions, setEdges]
    );

    // 当 Zustand store 中的节点或边发生变化时，更新 React Flow 的状态
    useEffect(() => {
        setNodes(storeNodes)
        setEdges(storeEdges as Edge[])
    }, [storeNodes, storeEdges, setNodes, setEdges])

    // 当需要导出数据时提供当前画布数据
    useEffect(() => {
        if (onNodesExport) onNodesExport(nodes);
        if (onEdgesExport) onEdgesExport(edges);
    }, [nodes, edges, onNodesExport, onEdgesExport]);
    const { project, screenToFlowPosition } = useReactFlow()
    const { toast } = useToast()

    // selection state
    const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([])
    const [selectedEdgeIds, setSelectedEdgeIds] = useState<string[]>([])

    // 对齐与吸附状态
    const [alignmentGuides, setAlignmentGuides] = useState<AlignmentGuide[]>([])
    const [snapToGridEnabled, setSnapToGridEnabled] = useState(true)
    const [showGrid, setShowGrid] = useState(true)
    const [isDragging, setIsDragging] = useState(false)
    const [draggingNodePosition, setDraggingNodePosition] = useState<{ x: number; y: number } | null>(null)

    // 历史记录管理器
    const historyManagerRef = useRef<HistoryManager | null>(null)
    const [canUndo, setCanUndo] = useState(false)
    const [canRedo, setCanRedo] = useState(false)

    // 初始化历史记录管理器
    useEffect(() => {
        historyManagerRef.current = new HistoryManager({
            nodes: [],
            edges: []
        });
        setCanUndo(false)
        setCanRedo(false)
    }, []);

    // 记录历史状态
    const recordHistory = useCallback(() => {
        if (historyManagerRef.current) {
            historyManagerRef.current.push({ nodes, edges });
            setCanUndo(historyManagerRef.current.canUndo());
            setCanRedo(historyManagerRef.current.canRedo());
        }
    }, [nodes, edges]);

    // 对齐选中的节点
    const alignSelectedNodes = useCallback((alignment: 'left' | 'right' | 'center' | 'top' | 'bottom' | 'middle' | 'distribute-horizontal' | 'distribute-vertical') => {
        // 获取选中的节点
        const selectedNodes = nodes.filter(node => selectedNodeIds.includes(node.id));

        // 如果选中的节点少于2个，提示用户
        if (selectedNodes.length < 2) {
            toast({
                title: "无法对齐",
                description: "请至少选择2个节点进行对齐操作",
                variant: "destructive"
            });
            return;
        }

        // 执行对齐操作
        const alignedNodes = alignNodes(selectedNodes, alignment);
        // 更新节点状态
        setNodes(ns => ns.map(node => {
            const alignedNode = alignedNodes.find(n => n.id === node.id);
            return alignedNode ? alignedNode : node;
        }));
        // 同步到全局状态
        actions.importData(nodes, edges as any, { merge: true });
        // 记录历史状态
        recordHistory();

        // 显示成功消息
        toast({
            title: "对齐完成",
            description: `已对齐 ${selectedNodes.length} 个节点`
        });
    }, [nodes, edges, selectedNodeIds, setNodes, actions, recordHistory, toast]);



    // 全选
    const handleSelectAll = useCallback(() => {
        // 选择所有节点
        setNodes(ns => ns.map(n => ({ ...n, selected: true })));
        // 更新选中节点ID列表
        setSelectedNodeIds(nodes.map(n => n.id));
        // 显示成功消息
        toast({
            title: "全选完成",
            description: `已选择 ${nodes.length} 个节点`
        });
    }, [nodes, setNodes, toast]);

    // 橡皮框选择状态
    const [isSelecting, setIsSelecting] = useState(false)
    const [selectionStart, setSelectionStart] = useState({ x: 0, y: 0 })
    const [selectionCurrent, setSelectionCurrent] = useState({ x: 0, y: 0 })

    // 画布引用和尺寸
    const canvasRef = useRef<HTMLDivElement>(null);
    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

    // 更新画布尺寸
    useEffect(() => {
        const updateCanvasSize = () => {
            if (canvasRef.current) {
                const rect = canvasRef.current.getBoundingClientRect();
                setCanvasSize({ width: rect.width, height: rect.height });
            }
        };

        updateCanvasSize();
        const resizeObserver = new ResizeObserver(updateCanvasSize);
        if (canvasRef.current) {
            resizeObserver.observe(canvasRef.current);
        }

        return () => {
            resizeObserver.disconnect();
        };
    }, []);

    
    // 根据节点ID查找节点
    const findNode = (id: string) => nodes.find(node => node.id === id)

    // 节点拖拽处理 - 吸附和对齐
    const onNodeDrag: NodeDragHandler = useCallback((event, node, nodes) => {
        setIsDragging(true);
        setDraggingNodePosition(node.position);
        // 获取除当前节点外的所有节点
        const otherNodes = nodes.filter(n => n.id !== node.id);
        // 计算吸附和对齐辅助线
        const guides = calculateAlignmentGuides(node, otherNodes, snapToGridEnabled);
        setAlignmentGuides(guides.guides);
        // ReactFlow handles the visual update during drag, no need to call setNodes here
        // setNodes(ns => ns.map(n => n.id === node.id ? { ...n, position: { x: guides.x, y: guides.y } } : n));
    }, [nodes, snapToGridEnabled]); // Removed setNodes from dependencies as it's not called

    // 节点拖拽结束处理
    const onNodeDragStop: NodeDragHandler = useCallback((event, node, nodes) => {
        setIsDragging(false);
        setDraggingNodePosition(null);
        setAlignmentGuides([]);
        // 先创建更新后的节点数组
        const updatedNodes = nodes.map(n => n.id === node.id ? { ...n, position: node.position } : n);
        // 更新本地状态
        setNodes(updatedNodes);
        // 使用更新后的节点数组同步到全局状态
        actions.importData(updatedNodes, edges as any, { merge: true });
        // 记录历史状态
        recordHistory();
    }, [actions, edges, recordHistory, setNodes]); // Added setNodes to dependencies

    // 鼠标按下事件 - 开始橡皮框选择
    const handleMouseDown = useCallback((event: React.MouseEvent) => {
        // 只有在画布空白处点击时才开始选择
        if (event.target === event.currentTarget) {
            const canvasRect = canvasRef.current?.getBoundingClientRect();
            if (canvasRect) {
                const position = screenToFlowPosition({
                    x: event.clientX - canvasRect.left,
                    y: event.clientY - canvasRect.top
                });
                setSelectionStart(position);
                setSelectionCurrent(position);
                setIsSelecting(true);
            }
        }
    }, [screenToFlowPosition]);

    // 鼠标移动事件 - 更新橡皮框选择
    const handleMouseMove = useCallback((event: React.MouseEvent) => {
        if (isSelecting && canvasRef.current) {
            const canvasRect = canvasRef.current.getBoundingClientRect();
            const position = screenToFlowPosition({
                x: event.clientX - canvasRect.left,
                y: event.clientY - canvasRect.top
            });
            setSelectionCurrent(position);

            // 计算选择框
            const selectionBox = {
                x: Math.min(selectionStart.x, position.x),
                y: Math.min(selectionStart.y, position.y),
                width: Math.abs(position.x - selectionStart.x),
                height: Math.abs(position.y - selectionStart.y)
            };

            // 获取选择框内的节点
            const selectedNodes = getNodesInSelectionBox(nodes, selectionBox).map(n => n.id);
            const selectedNodeSet = new Set(selectedNodeIds);
            const newSelectedNodeSet = new Set(selectedNodes);

            // 如果选择的节点有变化，则更新选择状态
            if (selectedNodeSet.size !== newSelectedNodeSet.size ||
                ![...selectedNodeSet].every(id => newSelectedNodeSet.has(id))) {
                setSelectedNodeIds(selectedNodes);
                // 同时更新节点的 selected 状态
                setNodes(ns => ns.map(n => ({
                    ...n,
                    selected: selectedNodes.includes(n.id)
                })));
            }
        }
    }, [isSelecting, nodes, screenToFlowPosition, selectionStart, selectedNodeIds, setNodes]);

    // 鼠标抬起事件 - 结束橡皮框选择
    const handleMouseUp = useCallback(() => {
        if (isSelecting) {
            setIsSelecting(false);
        }
    }, [isSelecting]);

    // 处理连接事件
    const onConnect = useCallback((params: Connection) => {
        // 检查参数有效性
        if (!params.source || !params.target) {
            toast({
                title: "连接无效",
                description: "无法创建无效的连接",
                variant: "destructive"
            });
            return;
        }

        // 检查是否会形成回路
        if (wouldCreateCycle(params.source!, params.target!, edges, nodes)) {
            toast({
                title: "禁止回路",
                description: "该连接将产生闭环，请调整结构。",
                variant: "destructive"
            });
            return;
        }

        // 添加连接
        const newEdges = addEdge({ ...params, animated: false }, edges);
        setEdges(newEdges);
        // 同步到全局状态
        actions.importData(nodes, newEdges, { merge: true });
    }, [setEdges, edges, nodes, actions, toast]);

    // 处理拖拽放置事件
    const onDrop = useCallback((event: React.DragEvent) => {
        event.preventDefault();

        // 获取拖拽的节点类型
        let nodeType = event.dataTransfer.getData("application/reactflow");

        // 如果没有从 application/reactflow 获取到数据，尝试从 application/json 获取
        if (!nodeType) {
            const nodeData = event.dataTransfer.getData("application/json");
            if (nodeData) {
                try {
                    const node = JSON.parse(nodeData);
                    nodeType = node.id;
                } catch (e) {
                    console.error("Failed to parse node data:", e);
                    return;
                }
            }
        }

        if (!nodeType) return;

        // 计算放置位置
        const canvasRect = event.currentTarget.getBoundingClientRect();
        const position = project({
            x: event.clientX - canvasRect.left,
            y: event.clientY - canvasRect.top
        });

        // 根据节点类别设置正确的type
        let nodeTypeForReactFlow = nodeType;
        let nodeData: Record<string, any> = {
            label: nodeType,
            status: "idle",
            breakpoint: false
        };
        
        // 动作节点
        if (['AlwaysFailure', 'AlwaysSuccess', 'Script', 'SetBlackboard', 'Sleep'].includes(nodeType)) {
            nodeTypeForReactFlow = 'action';
        }
        // 条件节点
        else if (nodeType === 'ScriptCondition') {
            nodeTypeForReactFlow = 'condition';
        }
        // 控制节点
        else if ([
            'AsyncFallback', 'AsyncSequence', 'Fallback', 'IfThenElse', 'Parallel', 
            'ParallelAll', 'ReactiveFallback', 'ReactiveSequence', 'Sequence', 
            'SequenceWithMemory', 'Switch2', 'Switch3', 'Switch4', 'Switch5', 
            'Switch6', 'WhileDoElse'
        ].includes(nodeType)) {
            nodeTypeForReactFlow = nodeType;
        }
        // 装饰器节点
        else if ([
            'Delay', 'ForceFailure', 'ForceSuccess', 'Inverter', 'KeepRunningUntilFailure',
            'LoopDouble', 'LoopString', 'Precondition', 'Repeat', 'RetryUntilSuccessful',
            'RunOnce', 'Timeout'
        ].includes(nodeType)) {
            nodeTypeForReactFlow = 'decorator';
        }
        // 子树节点
        else if (nodeType === 'SubTree' || nodeType === 'subtree') {
            nodeTypeForReactFlow = 'subtree';
            // 为子树节点添加特殊数据
            nodeData = {
                ...nodeData,
                subtreeId: `${nodeType}-${Date.now()}`,
                isSubtreeReference: true
            };
        }
        // 兼容旧的控制节点类型
        else if (['sequence', 'selector', 'parallel', 'fallback'].includes(nodeType)) {
            nodeTypeForReactFlow = `control-${nodeType}`;
        }

        // 创建新节点
        const newNode: Node = {
            id: `${nodeType}-${Date.now()}`,
            position,
            data: nodeData,
            type: nodeTypeForReactFlow,
        };

        // 添加新节点到节点列表
        const updatedNodes = [...nodes, newNode];
        setNodes(updatedNodes);
        // 同步到全局状态
        actions.importData(updatedNodes, edges as any, { merge: true });
    }, [project, nodes, edges, setNodes, actions]);

    // 处理拖拽悬停事件
    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
    }, []);

    // 删除选中的节点和边
    const handleDelete = useCallback(() => {
        // 如果没有选中的节点和边，提示用户
        if (selectedNodeIds.length === 0 && selectedEdgeIds.length === 0) {
            toast({
                title: "无选择",
                description: "请选择要删除的节点或连线"
            });
            return;
        }

        // 删除选中的节点（同时删除与之相关的边）
        const remainingNodes = nodes.filter(node => !selectedNodeIds.includes(node.id));
        const remainingEdges = edges.filter(edge =>
            !selectedEdgeIds.includes(edge.id) &&
            !selectedNodeIds.includes(edge.source) &&
            !selectedNodeIds.includes(edge.target)
        );

        // 计算被删除的连线数量
        const deletedEdgesCount = edges.length - remainingEdges.length;

        // 更新状态
        setNodes(remainingNodes);
        setEdges(remainingEdges);
        // 清除选中状态
        setSelectedNodeIds([]);
        setSelectedEdgeIds([]);
        // 同步到全局状态，使用merge: false确保删除的节点不会重新出现
        actions.importData(remainingNodes, remainingEdges as any, { merge: false });
        // 记录历史状态
        recordHistory();

        // 显示成功消息
        toast({
            title: "已删除",
            description: `节点 ${selectedNodeIds.length} 个，连线 ${deletedEdgesCount} 条`
        });
    }, [nodes, edges, selectedNodeIds, selectedEdgeIds, setNodes, setEdges, setSelectedNodeIds, setSelectedEdgeIds, actions, recordHistory, toast]);

    // 克隆选中的节点
    const handleClone = useCallback(() => {
        // 获取选中的节点
        const selectedNodes = nodes.filter(node => selectedNodeIds.includes(node.id));

        // 如果没有选中的节点，提示用户
        if (selectedNodes.length === 0) {
            toast({
                title: "无法克隆",
                description: "请先选择要克隆的节点",
                variant: "destructive"
            });
            return;
        }

        // 创建时间戳用于生成唯一的ID
        const timestamp = Date.now();
        const offset = 40; // 克隆节点的偏移量

        // 创建一个映射来跟踪原始节点ID到新节点ID的映射
        const idMap: Record<string, string> = {};

        // 克隆选中的节点
        const clonedNodes = selectedNodes.map((node, index) => {
            const newId = `${node.id}-copy-${timestamp}-${index}`;
            idMap[node.id] = newId;
            return {
                ...node,
                id: newId,
                position: {
                    x: node.position.x + offset,
                    y: node.position.y + offset
                },
                // 设置为选中状态，方便用户操作
                selected: true
            };
        });

        // 克隆选中节点之间的连接
        const clonedEdges = edges
            .filter(edge =>
                selectedNodeIds.includes(edge.source) &&
                selectedNodeIds.includes(edge.target)
            )
            .map((edge, index) => ({
                ...edge,
                id: `${edge.id ?? "e"}-copy-${timestamp}-${index}`,
                source: idMap[edge.source],
                target: idMap[edge.target],
                // 设置为选中状态
                selected: true
            }));

        // 更新所有节点和边
        const updatedNodes = [
            ...nodes.map(node => ({ ...node, selected: false })), // 取消原节点的选中状态
            ...clonedNodes
        ];
        const updatedEdges = [...edges, ...clonedEdges];

        // 更新状态
        setNodes(updatedNodes);
        setEdges(updatedEdges);
        // 同步到全局状态
        actions.importData(updatedNodes, updatedEdges as any, { merge: true });
        // 记录历史状态
        recordHistory();

        // 显示成功消息
        toast({
            title: "已克隆",
            description: `节点 ${clonedNodes.length} 个，连线 ${clonedEdges.length} 条`
        });
    }, [nodes, edges, selectedNodeIds, setNodes, setEdges, actions, recordHistory, toast]);

    // 自动布局为树形结构
    const handleAutoLayout = useCallback(() => {
        // 获取所有节点
        const allNodes = [...nodes];
        // 执行自动布局
        const layoutedNodes = autoLayoutTree(allNodes, edges);
        // 更新节点状态
        setNodes(layoutedNodes);
        // 同步到全局状态
        actions.importData(layoutedNodes, edges as any, { merge: true });
        // 记录历史状态
        recordHistory();

        // 显示成功消息
        toast({
            title: "布局完成",
            description: "已自动布局为树形结构"
        });
    }, [nodes, edges, setNodes, actions, recordHistory, toast]);

    // 散乱分布节点
    const handleScatterNodes = useCallback(() => {
        // 获取所有节点
        const allNodes = [...nodes];
        // 执行散乱分布
        const scatteredNodes = scatterNodes(allNodes);
        // 更新节点状态
        setNodes(scatteredNodes);
        // 同步到全局状态
        actions.importData(scatteredNodes, edges as any, { merge: true });
        // 记录历史状态
        recordHistory();

        // 显示成功消息
        toast({
            title: "分布完成",
            description: "已散乱分布所有节点"
        });
    }, [nodes, edges, setNodes, actions, recordHistory, toast]);

    // 处理选择变化事件
    const handleSelectionChange = useCallback(({ nodes, edges }: OnSelectionChangeParams) => {
        // 安全检查nodes和edges参数
        if (!nodes || !edges) {
            console.warn('handleSelectionChange received undefined nodes or edges');
            return;
        }

        // 更新选中节点ID列表
        const newSelectedNodeIds = nodes.map(n => n.id);
        setSelectedNodeIds(newSelectedNodeIds);

        // 更新选中边ID列表
        const newSelectedEdgeIds = edges.map(e => e.id);
        setSelectedEdgeIds(newSelectedEdgeIds);

        // 如果只有一个节点被选中，通知父组件
        if (newSelectedNodeIds.length === 1 && onSelectionChange) {
            onSelectionChange({ nodes: [{ id: newSelectedNodeIds[0] } as Node], edges: [] });
        } else if (newSelectedNodeIds.length !== 1 && onSelectionChange) {
            onSelectionChange({ nodes: [], edges: [] });
        }
    }, [onSelectionChange]);



    return (
        <div
            ref={canvasRef}
            className="w-full h-full relative overflow-hidden bg-background"
        >
            <ContextMenu>
                <ContextMenuTrigger asChild>
                    <div className="w-full h-full">
                        <ReactFlow
                            nodes={nodes}
                            edges={edges}
                            onNodesChange={onNodesChange}
                            onEdgesChange={onEdgesChange}
                            onConnect={onConnect}
                            onDrop={onDrop}
                            onDragOver={onDragOver}
                            onNodeDrag={onNodeDrag}
                            onNodeDragStop={onNodeDragStop}
                            onSelectionChange={handleSelectionChange}
                            nodeTypes={nodeTypes}
                            connectionLineType={ConnectionLineType.Bezier}
                            connectionMode={ConnectionMode.Loose}
                            fitView
                            fitViewOptions={{ padding: 0.5 }}
                            attributionPosition="bottom-left"
                            className="w-full h-full"
                            deleteKeyCode="Delete"
                            multiSelectionKeyCode="Shift"
                            panActivationKeyCode="Space"
                            zoomActivationKeyCode="Meta"
                            panOnScroll={false}
                            panOnDrag={[0, 1]} // 只允许左键和中键拖拽，右键用于菜单 (0=左键, 1=中键)
                            zoomOnScroll={true}
                            zoomOnPinch={true}
                            elevateNodesOnSelect
                            elevateEdgesOnSelect
                            selectNodesOnDrag={false}
                        >
                            <Controls className="bg-background/80 backdrop-blur" />
                            <MiniMap className="bg-background/80 backdrop-blur" />
                            <GridBackground
                                visible={showGrid}
                                gridSize={GRID_SIZE}
                                opacity={0.1}
                            />
                            <AlignmentGuides
                                guides={alignmentGuides}
                                canvasWidth={canvasSize.width}
                                canvasHeight={canvasSize.height}
                            />
                            <GridSnapIndicator visible={snapToGridEnabled && isDragging} x={draggingNodePosition?.x ?? 0} y={draggingNodePosition?.y ?? 0} />
                            {isSelecting && (
                                <SelectionBox
                                    startX={selectionStart.x}
                                    startY={selectionStart.y}
                                    currentX={selectionCurrent.x}
                                    currentY={selectionCurrent.y}
                                    visible={true}
                                />
                            )}
                            <Background
                                variant={showGrid ? BackgroundVariant.Lines : BackgroundVariant.Dots}
                                gap={GRID_SIZE}
                                color="#333"
                                className="transition-opacity duration-300"
                            />
                        </ReactFlow>
                    </div>
                </ContextMenuTrigger>
                <ContextMenuContent className="w-48">
                    <ContextMenuItem onSelect={handleSelectAll}>
                        <span>全选</span>
                        <ContextMenuShortcut>⌘A</ContextMenuShortcut>
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem 
                        onSelect={handleClone} 
                        disabled={selectedNodeIds.length === 0}
                    >
                        <Copy className="mr-2 h-4 w-4" />
                        <span>克隆</span>
                        <ContextMenuShortcut>⌘D</ContextMenuShortcut>
                    </ContextMenuItem>
                    <ContextMenuItem 
                        onSelect={handleDelete} 
                        disabled={selectedNodeIds.length === 0 && selectedEdgeIds.length === 0}
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>删除</span>
                        <ContextMenuShortcut>Del</ContextMenuShortcut>
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuLabel>布局</ContextMenuLabel>
                    <ContextMenuItem onSelect={handleAutoLayout}>
                        <GitBranch className="mr-2 h-4 w-4" />
                        <span>自动布局为树形结构</span>
                    </ContextMenuItem>
                    <ContextMenuItem onSelect={handleScatterNodes}>
                        <RefreshCcw className="mr-2 h-4 w-4" />
                        <span>散乱分布节点</span>
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem onSelect={() => setSnapToGridEnabled(!snapToGridEnabled)}>
                        <Grid3X3 className="mr-2 h-4 w-4" />
                        <span>{snapToGridEnabled ? "禁用" : "启用"}网格吸附</span>
                    </ContextMenuItem>
                    <ContextMenuItem onSelect={() => setShowGrid(!showGrid)}>
                        <span>显示网格 {showGrid ? "✓" : ""}</span>
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuLabel>调试</ContextMenuLabel>
                    <ContextMenuItem 
                        onSelect={() => {
                            const selectedNodes = nodes.filter(node => selectedNodeIds.includes(node.id));
                            if (selectedNodes.length === 1) {
                                // 为选中的单个节点添加断点
                                // 这里可以调用断点管理器
                                toast({ 
                                    title: "添加断点", 
                                    description: `为节点 ${selectedNodes[0].data?.label || selectedNodes[0].id} 添加断点` 
                                });
                            } else {
                                toast({ 
                                    title: "无法添加断点", 
                                    description: "请选择一个节点添加断点" 
                                });
                            }
                        }}
                        disabled={selectedNodeIds.length !== 1}
                    >
                        <Bug className="mr-2 h-4 w-4" />
                        <span>添加断点</span>
                    </ContextMenuItem>
                    <ContextMenuItem onSelect={() => toast({ title: "折叠子树（Mock）" })}>
                        <span>折叠子树</span>
                    </ContextMenuItem>
                    <ContextMenuItem onSelect={() => toast({ title: "展开子树（Mock）" })}>
                        <span>展开子树</span>
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                </ContextMenuContent>
            </ContextMenu>
        </div>
    );
}

export function BtCanvas({ onNodesExport, onEdgesExport, onSelectionChange: onSelectionChangeProp }: {
    onNodesExport?: (nodes: Node[]) => void;
    onEdgesExport?: (edges: Edge[]) => void;
    onSelectionChange?: (selectedNodeId?: string) => void;
}) {
    const sessionId = useBehaviorTreeStore(state => state.currentSession?.id);

    // 转换onSelectionChangeProp函数，使其能够接收OnSelectionChangeParams参数
    const handleSelectionChange = useCallback((params: OnSelectionChangeParams) => {
        // 安全检查params参数
        if (!params || !params.nodes) {
            console.warn('BtCanvas handleSelectionChange received undefined params or nodes');
            return;
        }

        // 如果只有一个节点被选中，调用onSelectionChangeProp并传递节点ID
        if (params.nodes.length === 1 && onSelectionChangeProp) {
            onSelectionChangeProp(params.nodes[0].id);
        } else if (params.nodes.length !== 1 && onSelectionChangeProp) {
            // 如果选中的节点数量不是1，传递undefined
            onSelectionChangeProp(undefined);
        }
    }, [onSelectionChangeProp]);

    return (
        <ReactFlowProvider>
            <CanvasInner
                onNodesExport={onNodesExport}
                onEdgesExport={onEdgesExport}
                onSelectionChange={handleSelectionChange}
            />
        </ReactFlowProvider>
    );
}