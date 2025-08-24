import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, {
    type Node,
    type Edge,
    addEdge,
    useNodesState,
    useEdgesState,
    type Connection,
    ConnectionMode,
    Controls,
    Background,
    BackgroundVariant,
    MiniMap,
    ReactFlowProvider,
    type ReactFlowInstance,
    type OnConnect,
    type OnNodesChange,
    type OnEdgesChange,
    Panel,
    MarkerType,
    type XYPosition,
} from 'reactflow';
import { cn } from '@/core/utils/utils';
import { useI18n } from '@/hooks/use-i18n';
import {
    useComposerActions,
    useActiveTool,
    useSelectedNodes,
    useSnapToGrid,
    useBehaviorTreeData
} from '@/core/store/behavior-tree-store';
import { ComposerTool } from '@/core/store/composerModeState';
import { Button } from '@/components/ui/button';
import { Grid3X3, Map, ZoomIn, ZoomOut, Maximize, RotateCcw, Info, Undo2, Redo2 } from 'lucide-react';

// 引入ReactFlow样式
import 'reactflow/dist/style.css';

// 自定义节点类型
import { BehaviorTreeNode } from '../nodes/behavior-tree-node';
import ControlSequenceNode from '../nodes/control-sequence-node';

// 自定义节点类型映射
const nodeTypes = {
    behaviorTreeNode: BehaviorTreeNode,
    'control-sequence': ControlSequenceNode,
    default: BehaviorTreeNode, // 默认回退
};

// 默认边样式
const defaultEdgeOptions = {
    animated: false,
    type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed },
    style: { stroke: '#64748b', strokeWidth: 2 },
};

// 画布控制面板
function CanvasControls({
    reactFlowInstance,
    showGrid,
    onToggleGrid,
    showMiniMap,
    onToggleMiniMap,
}: {
    reactFlowInstance: ReactFlowInstance | null;
    showGrid: boolean;
    onToggleGrid: () => void;
    showMiniMap: boolean;
    onToggleMiniMap: () => void;
}) {
    const { t } = useI18n();
    const composerActions = useComposerActions();

    const handleFitView = useCallback(() => {
        reactFlowInstance?.fitView({ padding: 0.1 });
    }, [reactFlowInstance]);

    const handleZoomIn = useCallback(() => {
        reactFlowInstance?.zoomIn();
    }, [reactFlowInstance]);

    const handleZoomOut = useCallback(() => {
        reactFlowInstance?.zoomOut();
    }, [reactFlowInstance]);

    const handleResetZoom = useCallback(() => {
        reactFlowInstance?.setViewport({ x: 0, y: 0, zoom: 1 });
    }, [reactFlowInstance]);

    return (
        <Panel position="top-right" className="flex flex-col gap-2">
            {/* 撤销/重做按钮 */}
            <div className="flex items-center gap-1 bg-background/80 backdrop-blur-sm border rounded-md p-1">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={composerActions.undo}
                    disabled={!composerActions.canUndo()}
                    className="h-8 w-8 p-0"
                    title={t('composer:actions.undo')}
                >
                    <Undo2 className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={composerActions.redo}
                    disabled={!composerActions.canRedo()}
                    className="h-8 w-8 p-0"
                    title={t('composer:actions.redo')}
                >
                    <Redo2 className="h-4 w-4" />
                </Button>
            </div>

            {/* 视图控制按钮 */}
            <div className="flex items-center gap-1 bg-background/80 backdrop-blur-sm border rounded-md p-1">
                <Button variant="ghost" size="sm" onClick={handleZoomIn} className="h-8 w-8 p-0" title={t('composer:canvas.zoomIn')}>
                    <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={handleZoomOut} className="h-8 w-8 p-0" title={t('composer:canvas.zoomOut')}>
                    <ZoomOut className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={handleFitView} className="h-8 w-8 p-0" title={t('composer:canvas.fitView')}>
                    <Maximize className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={handleResetZoom} className="h-8 w-8 p-0" title={t('composer:canvas.resetZoom')}>
                    <RotateCcw className="h-4 w-4" />
                </Button>
            </div>

            <div className="flex items-center gap-1 bg-background/80 backdrop-blur-sm border rounded-md p-1">
                <Button variant={showGrid ? "default" : "ghost"} size="sm" onClick={onToggleGrid} className="h-8 w-8 p-0" title={t('composer:canvas.toggleGrid')}>
                    <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button variant={showMiniMap ? "default" : "ghost"} size="sm" onClick={onToggleMiniMap} className="h-8 w-8 p-0" title={t('composer:canvas.toggleMiniMap')}>
                    <Map className="h-4 w-4" />
                </Button>
            </div>
        </Panel>
    );
}

// 画布信息面板
function CanvasInfo({
    nodeCount,
    selectedNodeCount,
    zoomLevel
}: {
    nodeCount: number;
    selectedNodeCount: number;
    zoomLevel: number;
}) {
    const { t } = useI18n();

    return (
        <Panel position="bottom-left" className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm border rounded-md px-3 py-1.5 text-sm">
                <Info className="h-4 w-4 text-muted-foreground" />
                <span>{t('composer:canvas.nodeCount', { count: nodeCount })}</span>
                {selectedNodeCount > 0 && (
                    <>
                        <span className="text-muted-foreground">|</span>
                        <span>{t('composer:canvas.selectedNodes', { count: selectedNodeCount })}</span>
                    </>
                )}
                <span className="text-muted-foreground">|</span>
                <span>{t('composer:canvas.zoom', { level: Math.round(zoomLevel * 100) })}</span>
            </div>
        </Panel>
    );
}

interface ComposerCanvasProps {
    children?: React.ReactNode;
    className?: string;
}

// ReactFlow画布组件
function ReactFlowCanvas({
    className,
    children
}: ComposerCanvasProps) {
    const { t } = useI18n();
    const composerActions = useComposerActions();
    const activeTool = useActiveTool();
    const selectedNodes = useSelectedNodes();
    const snapToGrid = useSnapToGrid();
    const behaviorTreeData = useBehaviorTreeData();

    const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

    const [showGrid, setShowGrid] = useState(true);
    const [showMiniMap, setShowMiniMap] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(1);

    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    useEffect(() => {
        if (behaviorTreeData && behaviorTreeData.nodes) {
            setNodes(behaviorTreeData.nodes);
        }
    }, [behaviorTreeData?.nodes, setNodes]);

    useEffect(() => {
        if (behaviorTreeData && behaviorTreeData.edges) {
            setEdges(behaviorTreeData.edges);
        }
    }, [behaviorTreeData?.edges, setEdges]);

    // 连接处理
    const onConnect: OnConnect = useCallback((connection: Connection) => {
        const edge = {
            ...connection,
            ...defaultEdgeOptions,
        };
        setEdges((eds) => addEdge(edge, eds));
        composerActions.saveCurrentState();
    }, [setEdges, composerActions]);

    // 拖拽处理
    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback((event: React.DragEvent) => {
        event.preventDefault();

        const reactFlowBounds = event.currentTarget.getBoundingClientRect();
        const position: XYPosition = reactFlowInstance?.screenToFlowPosition({
            x: event.clientX - reactFlowBounds.left,
            y: event.clientY - reactFlowBounds.top,
        }) || { x: 0, y: 0 };

        const data = event.dataTransfer.getData('application/reactflow');

        if (data) {
            try {
                const { type, nodeData } = JSON.parse(data);
                if (type === 'node') {
                    const newNode: Node = {
                        id: `node-${Date.now()}`,
                        type: nodeData.type || 'behaviorTreeNode',
                        position: snapToGrid ? {
                            x: Math.round(position.x / 20) * 20,
                            y: Math.round(position.y / 20) * 20,
                        } : position,
                        data: {
                            ...nodeData,
                            label: nodeData.name,
                        },
                    };

                    setNodes((nds) => nds.concat(newNode));
                    composerActions.saveCurrentState();
                }
            } catch (error) {
                console.error('Failed to parse drop data:', error);
            }
        }
    }, [reactFlowInstance, snapToGrid, setNodes, composerActions]);

    // 选择变化处理
    const onSelectionChange = useCallback(({ nodes: selectedNodes }: { nodes: Node[] }) => {
        composerActions.setSelectedNodes(selectedNodes.map(node => node.id));
    }, [composerActions]);

    // 键盘事件处理
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.target instanceof HTMLInputElement ||
                event.target instanceof HTMLTextAreaElement) {
                return;
            }

            switch (event.key) {
                case 'Delete':
                case 'Backspace':
                    if (selectedNodes.length > 0) {
                        composerActions.deleteSelectedNodes();
                    }
                    break;
                case 'z':
                    if (event.ctrlKey || event.metaKey) {
                        if (event.shiftKey) {
                            composerActions.redo();
                        } else {
                            composerActions.undo();
                        }
                        event.preventDefault();
                    }
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedNodes, composerActions]);

    // 移动和缩放处理
    const onMove = useCallback((_: React.MouseEvent, viewport: { x: number; y: number; zoom: number }) => {
        setZoomLevel(viewport.zoom);
    }, []);

    return (
        <div className={cn('flex-1 relative', className)}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onInit={setReactFlowInstance}
                onSelectionChange={onSelectionChange}
                onMove={onMove}
                nodeTypes={nodeTypes}
                defaultEdgeOptions={defaultEdgeOptions}
                connectionMode={ConnectionMode.Loose}
                snapToGrid={snapToGrid}
                snapGrid={[20, 20]}
                fitView
                attributionPosition="bottom-right"
                panOnDrag={activeTool === ComposerTool.PAN}
                selectionOnDrag={activeTool === ComposerTool.SELECT}
                className="bg-background"
            >
                {/* 背景网格 */}
                {showGrid && (
                    <Background
                        variant={BackgroundVariant.Dots}
                        gap={20}
                        size={1}
                        color="hsl(var(--muted-foreground) / 0.15)"
                    />
                )}

                {/* 小地图 */}
                {showMiniMap && (
                    <MiniMap
                        nodeStrokeColor="hsl(var(--border))"
                        nodeColor="hsl(var(--muted))"
                        nodeBorderRadius={4}
                        pannable
                        zoomable
                        style={{
                            backgroundColor: 'hsl(var(--background))',
                        }}
                    />
                )}

                {/* 控制面板 */}
                <CanvasControls
                    reactFlowInstance={reactFlowInstance}
                    showGrid={showGrid}
                    onToggleGrid={() => setShowGrid(!showGrid)}
                    showMiniMap={showMiniMap}
                    onToggleMiniMap={() => setShowMiniMap(!showMiniMap)}
                />

                {/* 画布信息 */}
                <CanvasInfo nodeCount={nodes.length} selectedNodeCount={selectedNodes.length} zoomLevel={zoomLevel} />

                {/* 空状态提示 */}
                {nodes.length === 0 && (
                    <Panel position="top-center" className="pointer-events-none">
                        <div className="text-center p-8 bg-background/80 backdrop-blur-sm border rounded-lg shadow-sm">
                            <h3 className="text-lg font-medium mb-2">{t('composer:canvas.emptyTitle')}</h3>
                            <p className="text-sm text-muted-foreground max-w-md">
                                {t('composer:canvas.emptyDescription')}
                            </p>
                        </div>
                    </Panel>
                )}
            </ReactFlow>
            {children}
        </div>
    );
}

// 默认导出组件
export default function ComposerCanvas({ children, className }: ComposerCanvasProps) {
    return (
        <ReactFlowProvider>
            <ReactFlowCanvas className={className}>{children}</ReactFlowCanvas>
        </ReactFlowProvider>
    );
}