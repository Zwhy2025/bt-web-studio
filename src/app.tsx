import React, { useCallback, useEffect, useMemo, useState, useRef } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import {
    Menubar,
    MenubarMenu,
    MenubarTrigger,
    MenubarContent,
    MenubarItem,
    MenubarSeparator,
} from "@/components/ui/menubar"
import { Button } from "@/components/ui/button"
import { ImportDialog, ExportDialog } from "@/components/xml-dialog"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    ResizablePanelGroup,
    ResizablePanel,
    ResizableHandle,
} from "@/components/ui/resizable"
import { CollapsibleLayout, PanelStatusIndicator } from '@/components/layout/collapsible-layout'
import {
    Play,
    Pause,
    ChevronRight,
    ChevronDown,
    RefreshCcw,
    Save,
    Import,
    Download,
    Search,
    Bug,
    Plus,
    GitBranch,
    CheckCircle2,
    XCircle,
    Brain,
    Signal,
    RotateCcw,
    RotateCw,
    Copy,
    ClipboardPaste,
    Trash2,
    Info,
    Grid3X3,
    AlignLeft,
    Zap,
    HelpCircle,
    Wrench,
    Layers,
    Plug,
    StepForward,
    Square,
} from "lucide-react"
import { RightInspector } from "@/components/right-inspector"
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

import "reactflow/dist/style.css"
import { nodeTypes } from "@/components/canvas/custom-nodes"
import { useToast } from "@/hooks/use-toast"
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
import {
    TooltipProvider,
    Tooltip,
    TooltipTrigger,
    TooltipContent,
} from "@/components/ui/tooltip"
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
import { BlackboardPanel } from "@/components/blackboard-panel"
import { TabBar } from "@/components/tab-bar"
import { useBehaviorTreeStore } from "@/core/store/behavior-tree-store"
import { TimelinePanel, createSampleTimelineState } from "@/components/layout/timeline-panel"

// ---------- Node Category Section Component ----------
function NodeCategorySection({
    category,
    onDragStart
}: {
    category: {
        name: string;
        icon: React.ReactNode;
        items: Array<{ label: string; type: string; desc: string }>;
    };
    onDragStart: (e: React.DragEvent, type: string) => void;
}) {
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <div className="space-y-1">
            {/* 分类标题 */}
            <div
                className="flex items-center gap-2 p-2 rounded-md hover:bg-accent/30 cursor-pointer select-none"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                {category.icon}
                <span className="text-sm font-medium">{category.name}</span>
                <span className="text-xs text-muted-foreground ml-auto">
                    {category.items.length}
                </span>
            </div>

            {/* 节点列表 */}
            {isExpanded && (
                <div className="ml-6 space-y-1">
                    {category.items.map((item, index) => (
                        <div
                            key={`${category.name}-${item.label}-${index}`}
                            draggable
                            onDragStart={(e) => onDragStart(e, item.type)}
                            role="button"
                            aria-label={`拖拽以创建 ${item.label}`}
                            className="rounded-md border bg-card/60 backdrop-blur hover:bg-accent/50 transition-colors p-2 cursor-grab active:cursor-grabbing"
                        >
                            <div className="flex items-center justify-between">
                                <div className="text-sm font-medium">{item.label}</div>
                                <GitBranch className="h-3 w-3 text-muted-foreground" />
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">{item.desc}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ---------- Left Palette ----------
function LeftPalette() {
    // 分层分组的节点库，像Groot一样的二级目录结构
    const nodeCategories = useMemo(
        () => [
            {
                name: "Action",
                icon: <Zap className="h-4 w-4" />,
                items: [
                    { label: "AlwaysFailure", type: "ForceFailure", desc: "始终失败" },
                    { label: "AlwaysSuccess", type: "ForceSuccess", desc: "始终成功" },
                    { label: "Script", type: "Script", desc: "脚本执行" },
                    { label: "SetBlackboard", type: "SetBlackboard", desc: "设置黑板" },
                    { label: "Sleep", type: "Sleep", desc: "休眠等待" },
                    { label: "Log", type: "Log", desc: "日志输出" },
                    { label: "Action", type: "action", desc: "通用动作节点" },
                ]
            },
            {
                name: "Condition",
                icon: <HelpCircle className="h-4 w-4" />,
                items: [
                    { label: "ScriptCondition", type: "CheckBlackboard", desc: "脚本条件" },
                    { label: "CheckBlackboard", type: "CheckBlackboard", desc: "检查黑板" },
                    { label: "CompareBlackboard", type: "CompareBlackboard", desc: "比较黑板" },
                    { label: "Condition", type: "condition", desc: "通用条件节点" },
                ]
            },
            {
                name: "Control",
                icon: <GitBranch className="h-4 w-4" />,
                items: [
                    { label: "AsyncFallback", type: "ReactiveFallback", desc: "异步回退" },
                    { label: "AsyncSequence", type: "ReactiveSequence", desc: "异步顺序" },
                    { label: "Fallback", type: "Fallback", desc: "回退选择" },
                    { label: "IfThenElse", type: "IfThenElse", desc: "条件分支" },
                    { label: "Parallel", type: "Parallel", desc: "并行执行" },
                    { label: "ParallelAll", type: "Parallel", desc: "并行全部" },
                    { label: "ReactiveFallback", type: "ReactiveFallback", desc: "响应式回退" },
                    { label: "ReactiveSequence", type: "ReactiveSequence", desc: "响应式顺序" },
                    { label: "Sequence", type: "Sequence", desc: "顺序执行" },
                    { label: "SequenceWithMemory", type: "Sequence*", desc: "带记忆顺序" },
                    { label: "Switch", type: "Switch", desc: "开关选择" },
                ]
            },
            {
                name: "Decorator",
                icon: <Wrench className="h-4 w-4" />,
                items: [
                    { label: "Delay", type: "Delay", desc: "延迟执行" },
                    { label: "ForceFailure", type: "ForceFailure", desc: "强制失败" },
                    { label: "ForceSuccess", type: "ForceSuccess", desc: "强制成功" },
                    { label: "Inverter", type: "Inverter", desc: "结果取反" },
                    { label: "KeepRunningUntilFailure", type: "Repeat", desc: "运行直到失败" },
                    { label: "LoopDouble", type: "Repeat", desc: "循环(数字)" },
                    { label: "LoopString", type: "Repeat", desc: "循环(字符串)" },
                    { label: "Precondition", type: "decorator", desc: "前置条件" },
                    { label: "Repeat", type: "Repeat", desc: "重复执行" },
                    { label: "RetryUntilSuccessful", type: "Retry", desc: "重试直到成功" },
                    { label: "RunOnce", type: "decorator", desc: "只运行一次" },
                    { label: "Timeout", type: "Timeout", desc: "超时控制" },
                ]
            },
            {
                name: "SubTree",
                icon: <Layers className="h-4 w-4" />,
                items: [
                    { label: "Untitled", type: "subtree", desc: "未命名子树" },
                    { label: "SubTree", type: "subtree", desc: "子树引用" },
                ]
            }
        ],
        []
    )

    const onDragStart = (event: React.DragEvent, nodeType: string) => {
        event.dataTransfer.setData("application/reactflow", nodeType)
        event.dataTransfer.effectAllowed = "move"
    }

    return (
        <aside className="h-full flex flex-col">
            <div className="p-3">
                <div className="font-medium mb-2">节点库</div>
                <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input className="pl-8" placeholder="搜索节点/模板..." />
                </div>
            </div>
            <Separator />
            <ScrollArea className="flex-1">
                <div className="p-3 space-y-2">
                    {nodeCategories.map((category) => (
                        <NodeCategorySection
                            key={category.name}
                            category={category}
                            onDragStart={onDragStart}
                        />
                    ))}
                </div>
            </ScrollArea>
        </aside>
    )
}

// ---------- Top Bar ----------
function TopBar({ onImportClick, onExportClick, onNewProject }: {
    onImportClick: () => void;
    onExportClick: () => void;
    onNewProject: () => void;
}) {
    return (
        <header className="w-full border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center gap-3 px-3 py-2">
                <Brain className="h-5 w-5 text-primary" aria-hidden />
                <div className="font-semibold tracking-tight">BT Web Studio</div>
                <Menubar className="ml-2">
                    <MenubarMenu>
                        <MenubarTrigger>文件</MenubarTrigger>
                        <MenubarContent>
                            <MenubarItem onSelect={onNewProject}>
                                <Plus className="mr-2 h-4 w-4" /> 新建项目
                            </MenubarItem>
                            <MenubarSeparator />
                            <MenubarItem onSelect={onImportClick}>
                                <Import className="mr-2 h-4 w-4" /> 导入 XML
                            </MenubarItem>
                            <MenubarItem onSelect={onExportClick}>
                                <Download className="mr-2 h-4 w-4" /> 导出 XML
                            </MenubarItem>
                            <MenubarSeparator />
                            <MenubarItem>
                                <Save className="mr-2 h-4 w-4" /> 保存
                            </MenubarItem>
                        </MenubarContent>
                    </MenubarMenu>
                    <MenubarMenu>
                        <MenubarTrigger>编辑</MenubarTrigger>
                        <MenubarContent>
                            <MenubarItem>撤销</MenubarItem>
                            <MenubarItem>重做</MenubarItem>
                        </MenubarContent>
                    </MenubarMenu>
                    <MenubarMenu>
                        <MenubarTrigger>视图</MenubarTrigger>
                        <MenubarContent>
                            <MenubarItem>缩放至适配</MenubarItem>
                            <MenubarItem>显示最小地图</MenubarItem>
                        </MenubarContent>
                    </MenubarMenu>
                    <MenubarMenu>
                        <MenubarTrigger>调试</MenubarTrigger>
                        <MenubarContent>
                            <MenubarItem>
                                <Bug className="mr-2 h-4 w-4" /> 打开断点面板
                            </MenubarItem>
                        </MenubarContent>
                    </MenubarMenu>
                    <MenubarMenu>
                        <MenubarTrigger>帮助</MenubarTrigger>
                        <MenubarContent>
                            <MenubarItem>快捷键</MenubarItem>
                            <MenubarItem>关于</MenubarItem>
                        </MenubarContent>
                    </MenubarMenu>
                </Menubar>
                {/* 调试工具栏已移至 DebugPanel
                <DebugToolbar />
                */}
                <div className="ml-auto flex items-center gap-2">
                    <div className="relative w-64 max-w-[40vw]">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input className="pl-8" placeholder="搜索节点、模板或命令..." aria-label="全局搜索" />
                    </div>
                    <Button variant="outline" size="sm" onClick={onImportClick}>
                        <Import className="mr-2 h-4 w-4" />
                        导入
                    </Button>
                    <Button size="sm" onClick={onExportClick}>
                        <Download className="mr-2 h-4 w-4" />
                        导出
                    </Button>
                </div>
            </div>
        </header>
    )
}

// ---------- Bottom Timeline ----------
function BottomTimeline() {
    const {
        timelinePosition,
        totalDuration,
        isReplaying,
        playbackSpeed,
        executionEvents,
        actions
    } = useBehaviorTreeStore()

    // 如果没有执行事件，创建一些示例数据用于显示
    const hasEvents = executionEvents.length > 0
    const sampleTimelineState = createSampleTimelineState()

    // 构建 TimelinePanel 需要的 timelineState 对象
    const timelineState = hasEvents ? {
        currentTime: timelinePosition,
        totalDuration: totalDuration || 10000,
        isPlaying: isReplaying,
        playbackSpeed: playbackSpeed,
        events: executionEvents.map(event => ({
            id: event.id,
            timestamp: event.timestamp,
            nodeId: event.nodeId,
            nodeName: event.nodeId, // 使用 nodeId 作为 nodeName
            type: event.type === 'tick' ? (
                event.status === 'success' ? 'success' as const :
                    event.status === 'failure' ? 'failure' as const :
                        event.status === 'running' ? 'running' as const :
                            'start' as const
            ) : 'start' as const,
            duration: event.duration,
            data: event
        })),
        filteredEvents: executionEvents.map(event => ({
            id: event.id,
            timestamp: event.timestamp,
            nodeId: event.nodeId,
            nodeName: event.nodeId,
            type: event.type === 'tick' ? (
                event.status === 'success' ? 'success' as const :
                    event.status === 'failure' ? 'failure' as const :
                        event.status === 'running' ? 'running' as const :
                            'start' as const
            ) : 'start' as const,
            duration: event.duration,
            data: event
        }))
    } : sampleTimelineState

    return (
        <div className="h-full min-h-[200px] bg-gray-800">
            <div className="p-2 border-b border-gray-700">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-300">时间轴回放</h3>
                    {!hasEvents && (
                        <span className="text-xs text-gray-500">
                            (示例数据 - 连接调试器后显示真实数据)
                        </span>
                    )}
                </div>
            </div>
            <div className="h-[calc(100%-3rem)]">
                <TimelinePanel
                    timelineState={timelineState}
                    onPlay={hasEvents ? actions.startReplay : () => console.log('示例播放')}
                    onPause={hasEvents ? actions.pauseReplay : () => console.log('示例暂停')}
                    onStop={hasEvents ? actions.stopReplay : () => console.log('示例停止')}
                    onSeek={hasEvents ? actions.seekToTime : (time) => console.log('示例跳转到:', time)}
                    onSpeedChange={hasEvents ? actions.setPlaybackSpeed : (speed) => console.log('示例速度:', speed)}
                    className="h-full"
                />
            </div>
        </div>
    )
}

// ---------- Canvas with React Flow ----------
type PaletteType =
    | "action"
    | "condition"
    | "control-sequence"
    | "control-selector"
    | "decorator"
    | "subtree"

const initialNodes: Node[] = [
    {
        id: "root",
        position: { x: 100, y: 80 },
        data: { label: "Root (Sequence)" },
        type: "control-sequence",
    },
]

const initialEdges: Edge[] = []

function CanvasInner({
    onNodesExport,
    onEdgesExport,
    onSelectionChange
}: {
    onNodesExport?: (nodes: Node[]) => void;
    onEdgesExport?: (edges: Edge[]) => void;
    onSelectionChange?: (selectedNodeId?: string) => void;
}) {
    // 从状态管理系统获取当前会话的节点和边
    const storeNodes = useBehaviorTreeStore(state => state.nodes)
    const storeEdges = useBehaviorTreeStore(state => state.edges)
    const expandedSubTrees = useBehaviorTreeStore(state => state.expandedSubTrees)
    const currentSession = useBehaviorTreeStore(state => state.currentSession)
    const actions = useBehaviorTreeStore(state => state.actions)

    const [nodes, setNodes] = useNodesState(storeNodes)
    const [edges, setEdges] = useEdgesState(storeEdges)

    const onNodesChange: OnNodesChange = useCallback(
        (changes) => {
            const newNodes = applyNodeChanges(changes, nodes);
            setNodes(newNodes); // 先更新本地状态
            actions.importData(newNodes, edges, { merge: true }); // 再同步到全局状态
        },
        [nodes, edges, actions, setNodes]
    );

    const onEdgesChange: OnEdgesChange = useCallback(
        (changes) => {
            const newEdges = applyEdgeChanges(changes, edges);
            setEdges(newEdges); // 先更新本地状态
            actions.importData(nodes, newEdges, { merge: true }); // 再同步到全局状态
        },
        [nodes, edges, actions, setEdges]
    );

    // 当 Zustand store 中的节点或边发生变化时，更新 React Flow 的状态
    useEffect(() => {
        setNodes(storeNodes)
        setEdges(storeEdges)
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

    // 橡皮框选择状态
    const [isSelecting, setIsSelecting] = useState(false)
    const [selectionStart, setSelectionStart] = useState({ x: 0, y: 0 })
    const [selectionCurrent, setSelectionCurrent] = useState({ x: 0, y: 0 })

    // 画布尺寸
    const canvasRef = useRef<HTMLDivElement>(null)
    const [canvasSize, setCanvasSize] = useState({ width: 1000, height: 800 })

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

    // 历史记录管理器
    const historyManagerRef = useRef<HistoryManager | null>(null)
    const [canUndo, setCanUndo] = useState(false)
    const [canRedo, setCanRedo] = useState(false)

    // 初始化历史记录管理器
    useEffect(() => {
        historyManagerRef.current = new HistoryManager({
            nodes: initialNodes,
            edges: initialEdges
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

    // 根据节点ID查找节点
    const findNode = (id: string) => nodes.find(node => node.id === id)

    // 节点拖拽处理 - 吸附和对齐
    const onNodeDrag: NodeDragHandler = useCallback((event, node, nodes) => {
        setIsDragging(true);
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
        setAlignmentGuides([]);
        // 先创建更新后的节点数组
        const updatedNodes = nodes.map(n => n.id === node.id ? { ...n, position: node.position } : n);
        // 更新本地状态
        setNodes(updatedNodes);
        // 使用更新后的节点数组同步到全局状态
        actions.importData(updatedNodes, edges, { merge: true });
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
                selectedNodes.some(id => !selectedNodeSet.has(id))) {
                // 更新节点的选中状态
                setNodes(ns => ns.map(n => ({ ...n, selected: selectedNodes.includes(n.id) })));
                // 更新选中节点ID列表
                setSelectedNodeIds(selectedNodes);
            }
        }
    }, [isSelecting, selectionStart, nodes, selectedNodeIds, screenToFlowPosition, setNodes]);

    // 鼠标释放事件 - 结束橡皮框选择
    const handleMouseUp = useCallback(() => {
        setIsSelecting(false);
    }, []);

    // 对齐选中节点
    const alignSelectedNodes = useCallback((alignment: 'left' | 'right' | 'center' | 'top' | 'bottom' | 'middle' | 'distribute-horizontal' | 'distribute-vertical') => {
        // 获取选中的节点
        const selectedNodes = nodes.filter(node => selectedNodeIds.includes(node.id));

        // 至少需要2个节点才能对齐
        if (selectedNodes.length < 2) {
            toast({
                title: "对齐失败",
                description: "请选择至少2个节点进行对齐",
                variant: "destructive"
            });
            return;
        }

        // 执行对齐操作
        const alignedNodes = alignNodes(selectedNodes, alignment);

        // 创建一个映射来快速查找对齐后的节点
        const alignedNodeMap = new Map(alignedNodes.map(node => [node.id, node]));

        // 更新所有节点的位置
        const updatedNodes = nodes.map(node =>
            alignedNodeMap.get(node.id) || node
        );

        // 更新状态
        setNodes(updatedNodes);
        // 同步到全局状态
        actions.importData(updatedNodes, edges, { merge: true });
        // 记录历史状态
        recordHistory();

        // 显示成功消息
        const alignmentNames: Record<string, string> = {
            'left': '左对齐',
            'right': '右对齐',
            'center': '水平居中',
            'top': '顶部对齐',
            'bottom': '底部对齐',
            'middle': '垂直居中',
            'distribute-horizontal': '水平分布',
            'distribute-vertical': '垂直分布'
        };

        toast({
            title: "对齐完成",
            description: `已对 ${selectedNodes.length} 个节点执行${alignmentNames[alignment]}`
        });
    }, [nodes, selectedNodeIds, setNodes, actions, edges, recordHistory, toast]);

    // 撤销操作
    const handleUndo = useCallback(() => {
        if (historyManagerRef.current && historyManagerRef.current.canUndo()) {
            const prevState = historyManagerRef.current.undo();
            if (prevState) {
                setNodes(prevState.nodes);
                setEdges(prevState.edges);
                setCanUndo(historyManagerRef.current.canUndo());
                setCanRedo(historyManagerRef.current.canRedo());
                toast({
                    title: "撤销成功",
                    description: "已恢复到上一个状态"
                });
            }
        }
    }, [setNodes, setEdges, toast]);

    // 重做操作
    const handleRedo = useCallback(() => {
        if (historyManagerRef.current && historyManagerRef.current.canRedo()) {
            const nextState = historyManagerRef.current.redo();
            if (nextState) {
                setNodes(nextState.nodes);
                setEdges(nextState.edges);
                setCanUndo(historyManagerRef.current.canUndo());
                setCanRedo(historyManagerRef.current.canRedo());
                toast({
                    title: "重做成功",
                    description: "已前进到下一个状态"
                });
            }
        }
    }, [setNodes, setEdges, toast]);

    // 自动布局
    const handleAutoLayout = useCallback(() => {
        const layoutedNodes = autoLayoutTree(nodes, edges);
        setNodes(layoutedNodes);
        // 同步到全局状态
        actions.importData(layoutedNodes, edges, { merge: true });
        // 记录历史状态
        recordHistory();
        toast({
            title: "自动布局完成",
            description: "已将节点排列成清晰的树形结构"
        });
    }, [nodes, edges, setNodes, actions, recordHistory, toast]);

    // 散乱分布节点
    const handleScatterNodes = useCallback(() => {
        const scatteredNodes = scatterNodes(nodes);
        setNodes(scatteredNodes);
        // 同步到全局状态
        actions.importData(scatteredNodes, edges, { merge: true });
        // 记录历史状态
        recordHistory();
        toast({
            title: "散乱分布完成",
            description: "已将节点随机分布到画布上"
        });
    }, [nodes, setNodes, actions, edges, recordHistory, toast]);

    // 验证连接是否有效
    function isValidConnection(connection: Connection) {
        // 确保不连接到自身且不向上连接
        if (!connection.source || !connection.target ||
            connection.source === connection.target ||
            connection.sourceHandle !== "out" ||
            connection.targetHandle !== "in") {
            return false;
        }

        // 获取源节点和目标节点
        const sourceNode = findNode(connection.source);
        const targetNode = findNode(connection.target);

        // 确保两个节点都存在
        if (!sourceNode || !targetNode) {
            return false;
        }

        // 确保目标节点在源节点下方（Y轴坐标更大）
        if (sourceNode.position.y >= targetNode.position.y) {
            return false;
        }

        return true;
    }

    // 检查是否会产生回路
    function wouldCreateCycle(source: string, target: string) {
        // 构建当前连接的邻接表
        const adjacencyList = new Map<string, string[]>();
        for (const edge of edges) {
            if (!adjacencyList.has(edge.source)) {
                adjacencyList.set(edge.source, []);
            }
            adjacencyList.get(edge.source)!.push(edge.target);
        }

        // 添加新的连接
        if (!adjacencyList.has(source)) {
            adjacencyList.set(source, []);
        }
        adjacencyList.get(source)!.push(target);

        // 检查是否存在从target到source的路径（即是否存在回路）
        const visited = new Set<string>();
        function hasPathTo(node: string, target: string): boolean {
            if (node === target) return true;
            if (visited.has(node)) return false;
            visited.add(node);

            const neighbors = adjacencyList.get(node) || [];
            for (const neighbor of neighbors) {
                if (hasPathTo(neighbor, target)) {
                    return true;
                }
            }
            return false;
        }

        return hasPathTo(target, source);
    }

    // 处理连接事件
    const onConnect = useCallback((params: Connection) => {
        // 验证连接是否有效
        if (!isValidConnection(params)) {
            toast({
                title: "无法连接",
                description: "仅允许从底部 out 连接到下方节点顶部 in，且不允许自连/向上连接。",
                variant: "destructive"
            });
            return;
        }

        // 检查是否会形成回路
        if (wouldCreateCycle(params.source!, params.target!)) {
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
        const nodeType = event.dataTransfer.getData("application/reactflow");
        if (!nodeType) return;

        // 计算放置位置
        const canvasRect = event.currentTarget.getBoundingClientRect();
        const position = project({
            x: event.clientX - canvasRect.left,
            y: event.clientY - canvasRect.top
        });

        // 创建新节点
        const newNode: Node = {
            id: `${nodeType}-${Date.now()}`,
            position,
            data: {
                label: {
                    "action": "Action",
                    "condition": "Condition",
                    "subtree": "SubTree",
                    "Sequence": "Sequence",
                    "Sequence*": "Sequence*",
                    "Fallback": "Fallback",
                    "Fallback*": "Fallback*",
                    "Parallel": "Parallel",
                    "ReactiveSequence": "ReactiveSequence",
                    "ReactiveFallback": "ReactiveFallback",
                    "Switch": "Switch",
                    "IfThenElse": "IfThenElse",
                    "WhileDoElse": "WhileDoElse",
                    "ManualSelector": "ManualSelector",
                    "Inverter": "Inverter",
                    "Retry": "Retry",
                    "Repeat": "Repeat",
                    "Timeout": "Timeout",
                    "Delay": "Delay",
                    "ForceSuccess": "ForceSuccess",
                    "ForceFailure": "ForceFailure",
                    "Script": "Script",
                    "SetBlackboard": "SetBlackboard",
                    "Sleep": "Sleep",
                    "Log": "Log",
                    "CheckBlackboard": "CheckBlackboard",
                    "CompareBlackboard": "CompareBlackboard",
                    "control-sequence": "Sequence",
                    "control-selector": "Fallback",
                    "decorator": "Decorator"
                }[nodeType]
            },
            type: nodeType,
        };

        // 添加新节点到节点列表
        const updatedNodes = [...nodes, newNode];
        setNodes(updatedNodes);
        // 同步到全局状态
        actions.importData(updatedNodes, edges, { merge: true });
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
        actions.importData(remainingNodes, remainingEdges, { merge: false });
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
        actions.importData(updatedNodes, updatedEdges, { merge: true });
        // 记录历史状态
        recordHistory();

        // 显示成功消息
        toast({
            title: "已克隆",
            description: `节点 ${clonedNodes.length} 个，连线 ${clonedEdges.length} 条`
        });
    }, [nodes, edges, selectedNodeIds, setNodes, setEdges, actions, recordHistory, toast]);

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

    // 注册键盘快捷键
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // 检查是否有输入框获得焦点
            const activeElement = document.activeElement;
            if (activeElement &&
                (activeElement.tagName === "INPUT" ||
                    activeElement.tagName === "TEXTAREA" ||
                    (activeElement as HTMLElement).contentEditable === "true")) {
                // 在输入框中只处理特定的快捷键组合
                const isCtrlOrCmd = event.ctrlKey || event.metaKey;
                const key = event.key.toLowerCase();

                // 允许 Ctrl/Cmd+Z 和 Ctrl/Cmd+Shift+Z 在输入框中使用
                if (isCtrlOrCmd && key === "z" && !event.shiftKey) {
                    // 允许默认行为（撤销）
                    return;
                }
                if (isCtrlOrCmd && ((key === "y") || (key === "z" && event.shiftKey))) {
                    // 允许默认行为（重做）
                    return;
                }

                // 其他快捷键在输入框中不处理
                return;
            }

            // 处理全局快捷键
            const isCtrlOrCmd = event.ctrlKey || event.metaKey;
            const key = event.key.toLowerCase();

            // Delete/Backspace - 删除
            if (key === "delete" || key === "backspace") {
                event.preventDefault();
                handleDelete();
            }
            // Ctrl/Cmd+D - 克隆
            else if (isCtrlOrCmd && key === "d") {
                event.preventDefault();
                handleClone();
            }
            // Ctrl/Cmd+A - 全选
            else if (isCtrlOrCmd && key === "a") {
                event.preventDefault();
                handleSelectAll();
            }
            // Ctrl/Cmd+Z - 撤销
            else if (isCtrlOrCmd && key === "z" && !event.shiftKey) {
                event.preventDefault();
                handleUndo();
            }
            // Ctrl/Cmd+Y or Ctrl/Cmd+Shift+Z - 重做
            else if (isCtrlOrCmd && (key === "y" || (key === "z" && event.shiftKey))) {
                event.preventDefault();
                handleRedo();
            }
            // Ctrl/Cmd+C - 复制（占位）
            else if (isCtrlOrCmd && key === "c") {
                toast({
                    title: "复制（Mock）",
                    description: "剪贴板功能稍后提供"
                });
            }
            // Ctrl/Cmd+V - 粘贴（占位）
            else if (isCtrlOrCmd && key === "v") {
                toast({
                    title: "粘贴（Mock）",
                    description: "剪贴板功能稍后提供"
                });
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleDelete, handleClone, handleSelectAll, handleUndo, handleRedo, toast]);

    return (
        <ContextMenu>
            <ContextMenuTrigger asChild>
                <div
                    ref={canvasRef}
                    className="h-full relative"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                >
                    {/* 工具栏 */}
                    <div className="absolute left-2 top-2 z-10 flex gap-1">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={handleUndo}
                                        disabled={!canUndo}
                                        aria-label="撤销"
                                    >
                                        <RotateCcw className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    撤销 (Ctrl/Cmd+Z)
                                </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={handleRedo}
                                        disabled={!canRedo}
                                        aria-label="重做"
                                    >
                                        <RotateCw className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    重做 (Ctrl+Shift+Z / Ctrl+Y)
                                </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        size="sm"
                                        variant={snapToGridEnabled ? "default" : "ghost"}
                                        onClick={() => setSnapToGridEnabled(!snapToGridEnabled)}
                                        aria-label="网格吸附"
                                    >
                                        <Grid3X3 className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    网格吸附 {snapToGridEnabled ? "已启用" : "已禁用"}
                                </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        size="sm"
                                        variant={showGrid ? "default" : "ghost"}
                                        onClick={() => setShowGrid(!showGrid)}
                                        aria-label="显示网格"
                                    >
                                        <AlignLeft className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    显示网格 {showGrid ? "已启用" : "已禁用"}
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>

                    {/* 对齐工具栏 */}
                    <AlignmentToolbar
                        selectedCount={selectedNodeIds.length}
                        onAlign={alignSelectedNodes}
                        visible={selectedNodeIds.length >= 2}
                    />

                    {/* React Flow 画布 */}
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
                        onSelectionChange={(params: OnSelectionChangeParams) => {
                            const selectedNodeIds = params.nodes.map(n => n.id);
                            const selectedEdgeIds = params.edges.map(e => e.id);
                            setSelectedNodeIds(selectedNodeIds);
                            setSelectedEdgeIds(selectedEdgeIds);
                            // 如果有选中的节点，通知父组件
                            if (onSelectionChange && selectedNodeIds.length > 0) {
                                onSelectionChange(selectedNodeIds[0]);
                            }
                        }}
                        nodeTypes={nodeTypes}
                        connectionMode={ConnectionMode.Strict}
                        defaultEdgeOptions={{
                            style: { strokeWidth: 2, stroke: "hsl(var(--primary))" },
                            markerEnd: {
                                type: MarkerType.ArrowClosed,
                                width: 14,
                                height: 14,
                                color: "hsl(var(--primary))",
                            },
                        }}
                        connectionLineType={ConnectionLineType.SmoothStep}
                        connectionLineStyle={{
                            strokeWidth: 2,
                            stroke: "hsl(var(--muted-foreground))",
                            strokeDasharray: 6
                        }}
                        fitView
                        selectNodesOnDrag={false} // 禁用拖拽时选择节点
                    >
                        <GridBackground gridSize={GRID_SIZE} visible={showGrid} opacity={0.2} />
                        <Background
                            variant={BackgroundVariant.Dots}
                            gap={GRID_SIZE}
                            size={1}
                            style={{ opacity: showGrid ? 0.3 : 0.1 }}
                        />
                        <MiniMap pannable zoomable />
                        <Controls showInteractive={false} />
                    </ReactFlow>

                    {/* 对齐辅助线 */}
                    <AlignmentGuides
                        guides={alignmentGuides}
                        canvasWidth={canvasSize.width}
                        canvasHeight={canvasSize.height}
                    />

                    {/* 橡皮框选择区域 */}
                    <SelectionBox
                        startX={selectionStart.x}
                        startY={selectionStart.y}
                        currentX={selectionCurrent.x}
                        currentY={selectionCurrent.y}
                        visible={isSelecting}
                    />
                </div>
            </ContextMenuTrigger>

            {/* 右键菜单 */}
            <ContextMenuContent>
                <ContextMenuLabel>编辑</ContextMenuLabel>
                <ContextMenuItem onSelect={handleUndo} disabled={!canUndo}>
                    撤销
                    <ContextMenuShortcut>Ctrl/Cmd+Z</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuItem onSelect={handleRedo} disabled={!canRedo}>
                    重做
                    <ContextMenuShortcut>Ctrl+Shift+Z</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem onSelect={() => handleSelectAll()}>
                    全选
                    <ContextMenuShortcut>Ctrl/Cmd+A</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem
                    onSelect={() => toast({ title: "复制（Mock）", description: "剪贴板稍后提供" })}
                >
                    <Copy className="mr-2 h-4 w-4" />
                    复制
                    <ContextMenuShortcut>Ctrl/Cmd+C</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuItem
                    onSelect={() => toast({ title: "粘贴（Mock）", description: "剪贴板稍后提供" })}
                >
                    <ClipboardPaste className="mr-2 h-4 w-4" />
                    粘贴
                    <ContextMenuShortcut>Ctrl/Cmd+V</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuItem disabled={selectedNodeIds.length === 0} onSelect={() => handleClone()}>
                    克隆
                    <ContextMenuShortcut>Ctrl/Cmd+D</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuItem onSelect={() => handleDelete()} disabled={!selectedNodeIds.length && !selectedEdgeIds.length}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    删除
                    <ContextMenuShortcut>Del</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuSeparator />
                {selectedNodeIds.length === 1 && (
                    <ContextMenuItem
                        onSelect={() => {
                            const nodeId = selectedNodeIds[0];
                            actions.toggleBreakpoint(nodeId);
                        }}
                    >
                        <div className="mr-2 h-4 w-4 flex items-center justify-center">
                            {(() => {
                                const node = nodes.find(n => n.id === selectedNodeIds[0]);
                                return node?.data.breakpoint ?
                                    <div className="h-3 w-3 rounded-full bg-red-500" /> :
                                    <div className="h-3 w-3 rounded-full border border-muted-foreground" />;
                            })()}
                        </div>
                        {(() => {
                            const node = nodes.find(n => n.id === selectedNodeIds[0]);
                            return node?.data.breakpoint ? "清除断点" : "设置断点";
                        })()}
                    </ContextMenuItem>
                )}
                <ContextMenuSeparator />
                {selectedNodeIds.length >= 2 ? (
                    <ContextMenuSub>
                        <ContextMenuSubTrigger>
                            <AlignLeft className="mr-2 h-4 w-4" />
                            对齐
                        </ContextMenuSubTrigger>
                        <ContextMenuSubContent className="w-48">
                            <ContextMenuItem onSelect={() => alignSelectedNodes("left")}>
                                左对齐
                            </ContextMenuItem>
                            <ContextMenuItem onSelect={() => alignSelectedNodes("center")}>
                                水平居中
                            </ContextMenuItem>
                            <ContextMenuItem onSelect={() => alignSelectedNodes("right")}>
                                右对齐
                            </ContextMenuItem>
                            <ContextMenuSeparator />
                            <ContextMenuItem onSelect={() => alignSelectedNodes("top")}>
                                顶部对齐
                            </ContextMenuItem>
                            <ContextMenuItem onSelect={() => alignSelectedNodes("middle")}>
                                垂直居中
                            </ContextMenuItem>
                            <ContextMenuItem onSelect={() => alignSelectedNodes("bottom")}>
                                底部对齐
                            </ContextMenuItem>
                            <ContextMenuSeparator />
                            <ContextMenuItem
                                onSelect={() => alignSelectedNodes("distribute-horizontal")}
                                disabled={selectedNodeIds.length < 3}
                            >
                                水平分布
                            </ContextMenuItem>
                            <ContextMenuItem
                                onSelect={() => alignSelectedNodes("distribute-vertical")}
                                disabled={selectedNodeIds.length < 3}
                            >
                                垂直分布
                            </ContextMenuItem>
                        </ContextMenuSubContent>
                    </ContextMenuSub>
                ) : (
                    <ContextMenuItem disabled>
                        <AlignLeft className="mr-2 h-4 w-4" />
                        对齐
                    </ContextMenuItem>
                )}
                <ContextMenuSeparator />
                <ContextMenuLabel>布局</ContextMenuLabel>
                <ContextMenuItem onSelect={handleAutoLayout}>
                    <GitBranch className="mr-2 h-4 w-4" />
                    自动布局为树形结构
                </ContextMenuItem>
                <ContextMenuItem onSelect={handleScatterNodes}>
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    散乱分布节点
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem onSelect={() => setSnapToGridEnabled(!snapToGridEnabled)}>
                    <Grid3X3 className="mr-2 h-4 w-4" />
                    {snapToGridEnabled ? "禁用" : "启用"}网格吸附
                </ContextMenuItem>
                <ContextMenuItem onSelect={() => setShowGrid(!showGrid)}>
                    显示网格 {showGrid ? "✓" : ""}
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem onSelect={() => toast({ title: "折叠子树（Mock）" })}>
                    折叠子树
                </ContextMenuItem>
                <ContextMenuItem onSelect={() => toast({ title: "展开子树（Mock）" })}>
                    展开子树
                </ContextMenuItem>
                <ContextMenuSeparator />
            </ContextMenuContent>
        </ContextMenu>
    );
}

function BtCanvas({ onNodesExport, onEdgesExport, onSelectionChange }: {
    onNodesExport?: (nodes: Node[]) => void;
    onEdgesExport?: (edges: Edge[]) => void;
    onSelectionChange?: (selectedNodeId?: string) => void;
}) {
    const sessionId = useBehaviorTreeStore(state => state.currentSession?.id);

    return (
        <ReactFlowProvider>
            <CanvasInner
                onNodesExport={onNodesExport}
                onEdgesExport={onEdgesExport}
                onSelectionChange={onSelectionChange}
            />
        </ReactFlowProvider>
    );
}

function AppContent() {
    const actions = useBehaviorTreeStore(state => state.actions);
    const { toast } = useToast();

    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
    const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
    const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>(undefined);
    const [exportNodes, setExportNodes] = useState<Node[]>([]);
    const [exportEdges, setExportEdges] = useState<Edge[]>([]);

    // 创建新项目
    const handleNewProject = () => {
        const projectName = `新项目 ${new Date().toLocaleTimeString()}`;
        actions.createSession(projectName);
        toast({
            title: "项目创建成功",
            description: `已创建新项目：${projectName}`
        });
    };

    // 导入数据
    const handleImport = (nodes: Node[], edges: Edge[]) => {
        actions.importData(nodes, edges);
        setIsImportDialogOpen(false);
        toast({
            title: "导入成功",
            description: `已导入 ${nodes.length} 个节点和 ${edges.length} 条连线到当前项目`
        });
    };

    return (
        <div className="h-screen w-screen bg-background text-foreground flex flex-col overflow-hidden">
            <TopBar
                onImportClick={() => setIsImportDialogOpen(true)}
                onExportClick={() => setIsExportDialogOpen(true)}
                onNewProject={handleNewProject}
            />
            <TabBar />
            <main className="flex-1 min-h-0">
                <CollapsibleLayout
                    leftPanel={<LeftPalette />}
                    centerPanel={
                        <BtCanvas
                            onNodesExport={setExportNodes}
                            onEdgesExport={setExportEdges}
                            onSelectionChange={setSelectedNodeId}
                        />
                    }
                    rightPanel={<RightInspector selectedNodeId={selectedNodeId} />}
                    bottomPanel={<BottomTimeline />}
                />
            </main>
            <PanelStatusIndicator />
            <ImportDialog
                open={isImportDialogOpen}
                onOpenChange={setIsImportDialogOpen}
                onImport={handleImport}
            />
            <ExportDialog
                open={isExportDialogOpen}
                onOpenChange={setIsExportDialogOpen}
                nodes={exportNodes}
                edges={exportEdges}
            />
        </div>
    );
}

function App() {
    return (
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={true} disableTransitionOnChange={true}>
            <AppContent />
        </ThemeProvider>
    );
}

export default App;