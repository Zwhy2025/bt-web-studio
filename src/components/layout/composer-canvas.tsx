import React, { useState, useCallback, useEffect, useRef } from 'react';
import { createNode } from '@/core/store/sessionState';
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
  applyNodeChanges,
  applyEdgeChanges,
} from 'reactflow';
import { cn } from '@/core/utils/utils';
import { useI18n } from '@/hooks/use-i18n';
import { useToast } from '@/hooks/use-toast';
import { wouldCreateCycle } from '@/core/graph/cycle-detector';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  useComposerActions,
  useSelectedNodes,
  useSnapToGrid,
  useBehaviorTreeData,
  useActions,
} from '@/core/store/behavior-tree-store';
import { useBehaviorTreeStore } from '@/core/store/behavior-tree-store';
import { Button } from '@/components/ui/button';
import { Grid3X3, Map, ZoomIn, ZoomOut, Maximize, RotateCcw, Info, Undo2, Redo2, Copy, Trash2, GitBranch } from 'lucide-react';
import { autoLayoutTree } from '@/core/layout/auto-layout-utils';

// 引入ReactFlow样式
import 'reactflow/dist/style.css';

// 自定义节点类型
import { BehaviorTreeNode } from '../nodes/behavior-tree-node';
import ControlSequenceNode from '../nodes/control-sequence-node';

// 自定义节点类型映射（包含 XML 导入产生的类型，避免 React Flow 回退警告）
const nodeTypes = {
  behaviorTreeNode: BehaviorTreeNode,
  'control-sequence': ControlSequenceNode,
  'control-selector': BehaviorTreeNode,
  action: BehaviorTreeNode,
  condition: BehaviorTreeNode,
  decorator: BehaviorTreeNode,
  subtree: BehaviorTreeNode,
  default: BehaviorTreeNode,
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
  const { toast } = useToast();
  const composerActions = useComposerActions();
  const actions = useActions();
  const selectedNodes = useSelectedNodes();
  const snapToGrid = useSnapToGrid();
  const behaviorTreeData = useBehaviorTreeData();

  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  const [showGrid, setShowGrid] = useState(true);
  const [showMiniMap, setShowMiniMap] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  const [nodes, setNodes] = useNodesState([]);
  const [edges, setEdges] = useEdgesState([]);
  const skipStoreSyncRef = useRef(false);
  const nodesRef = useRef<Node[]>([]);
  const edgesRef = useRef<Edge[]>([]);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    edgesRef.current = edges;
  }, [edges]);

  useEffect(() => {
    if (skipStoreSyncRef.current) {
      skipStoreSyncRef.current = false;
      return;
    }
    if (behaviorTreeData && behaviorTreeData.nodes) {
      // 清除所有节点的 selected，避免 store 中残留多选导致拖动时联动
      const normalizedNodes = behaviorTreeData.nodes.map((n) => ({ ...n, selected: false }));
      nodesRef.current = normalizedNodes;
      setNodes(normalizedNodes);
    }
  }, [behaviorTreeData?.nodes, setNodes]);

  useEffect(() => {
    if (skipStoreSyncRef.current) {
      skipStoreSyncRef.current = false;
      return;
    }
    if (behaviorTreeData && behaviorTreeData.edges) {
      edgesRef.current = behaviorTreeData.edges;
      setEdges(behaviorTreeData.edges);
    }
  }, [behaviorTreeData?.edges, setEdges]);

  // 以 store 的 selectedNodeIds 为准，强制同步 ReactFlow 节点选中态
  useEffect(() => {
    setNodes((currentNodes) => {
      const selectedSet = new Set(selectedNodes);
      let changed = false;
      const syncedNodes = currentNodes.map((node) => {
        const shouldSelected = selectedSet.has(node.id);
        if ((node.selected ?? false) !== shouldSelected) {
          changed = true;
          return { ...node, selected: shouldSelected };
        }
        return node;
      });
      if (!changed) return currentNodes;
      nodesRef.current = syncedNodes;
      return syncedNodes;
    });
  }, [selectedNodes, setNodes]);

  // 节点/边变更时同步到 store，避免添加节点时用旧数据覆盖拖拽后的位置
  const onNodesChangeWithSync: OnNodesChange = useCallback(
    (changes) => {
      const newNodes = applyNodeChanges(changes, nodesRef.current);
      nodesRef.current = newNodes;
      setNodes(newNodes);
      const hasPositionChange = changes.some((c) => c.type === 'position' && c.dragging === false);
      if (hasPositionChange) {
        skipStoreSyncRef.current = true;
        actions.importData(newNodes, edgesRef.current, { merge: false });
      }
    },
    [setNodes, actions]
  );

  const onEdgesChangeWithSync: OnEdgesChange = useCallback(
    (changes) => {
      const newEdges = applyEdgeChanges(changes, edgesRef.current);
      edgesRef.current = newEdges;
      setEdges(newEdges);
      const hasStructureChange = changes.some((c) => c.type === 'add' || c.type === 'remove');
      if (hasStructureChange) {
        skipStoreSyncRef.current = true;
        actions.importData(nodesRef.current, newEdges, { merge: false });
      }
    },
    [setEdges, actions]
  );

  // 拖拽开始时兜底收敛选中态，防止残留多选导致联动拖动
  const onNodeDragStart = useCallback((event: React.MouseEvent, draggingNode: Node) => {
    if (event.shiftKey || event.metaKey || event.ctrlKey) {
      return;
    }

    const currentNodes = nodesRef.current;
    const selectedCount = currentNodes.filter((n) => n.selected).length;
    if (selectedCount <= 1 && draggingNode.selected) {
      return;
    }

    const nextNodes = currentNodes.map((n) => ({ ...n, selected: n.id === draggingNode.id }));
    nodesRef.current = nextNodes;
    setNodes(nextNodes);
    composerActions.setSelectedNodes([draggingNode.id]);
  }, [setNodes, composerActions]);

  // 连接处理
  const onConnect: OnConnect = useCallback((connection: Connection) => {
    const currentNodes = nodesRef.current;
    const currentEdges = edgesRef.current;
    const source = connection.source!;
    const target = connection.target!;
    // 禁止把边连到 root（root 只能向下连接）
    const targetNode = currentNodes.find((n) => n.id === target);
    if (targetNode && (targetNode.data as any)?.instanceName === 'root') {
      return;
    }
    // 循环检测
    if (wouldCreateCycle(source, target, currentEdges, currentNodes)) {
      toast({ title: t('composer:validation.cycleForbidden', '禁止回路'), variant: 'destructive' });
      return;
    }
    const edge = { ...connection, ...defaultEdgeOptions };
    const newEdges = addEdge(edge, currentEdges);
    edgesRef.current = newEdges;
    setEdges(newEdges);
    const undoData = { nodes: JSON.parse(JSON.stringify(currentNodes)), edges: JSON.parse(JSON.stringify(currentEdges)) };
    const redoData = { nodes: JSON.parse(JSON.stringify(currentNodes)), edges: JSON.parse(JSON.stringify(newEdges)) };
    composerActions.addToHistory('addEdge', 'Added connection', undoData, redoData);
    skipStoreSyncRef.current = true;
    actions.importData(currentNodes, newEdges, { merge: false });
    composerActions.markDirty();
  }, [setEdges, composerActions, actions, toast, t]);

  // 拖拽处理
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();

    const position: XYPosition = reactFlowInstance?.screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    }) || { x: 0, y: 0 };

    // 获取拖拽数据 - 支持多种格式
    let nodeData = null;
    
    // 尝试从application/reactflow获取数据
    const reactflowData = event.dataTransfer.getData('application/reactflow');
    if (reactflowData) {
      try {
        const parsed = JSON.parse(reactflowData);
        if (parsed.type === 'node' && parsed.nodeData) {
          nodeData = parsed.nodeData;
        }
      } catch (error) {
        console.error('Failed to parse reactflow data:', error);
      }
    }

    // 如果没有获取到，尝试application/json
    if (!nodeData) {
      const jsonData = event.dataTransfer.getData('application/json');
      if (jsonData) {
        try {
          nodeData = JSON.parse(jsonData);
        } catch (error) {
          console.error('Failed to parse json data:', error);
        }
      }
    }

    // 如果仍然没有获取到，尝试text/plain
    if (!nodeData) {
      const plainData = event.dataTransfer.getData('text/plain');
      if (plainData) {
        nodeData = { id: plainData, name: plainData, category: 'action' };
      }
    }

    if (nodeData) {
      try {
        const currentNodes = nodesRef.current;
        const nextEdges = edgesRef.current;
        const isFirstNode = currentNodes.length === 0;

        // 使用共享函数创建节点
        const newNode = createNode(
          position,
          nodeData,
          isFirstNode,
          snapToGrid,
          'behaviorTreeNode'
        );

        // 统一模型/实例名的初始逻辑，确保属性面板可见到默认值
        if (isFirstNode) {
          // 第一个节点固定为 Sequence 控制节点
          newNode.data.modelName = 'Sequence';
          newNode.data.category = 'control';
          // root 的实例名在 createNode 中已设为 'root'
        } else {
          // 普通节点：若未提供，则用库中名称作为 modelName 与默认实例名
          newNode.data.modelName = newNode.data.modelName || nodeData.name || newNode.data.label;
          if (!newNode.data.instanceName) {
            newNode.data.instanceName = newNode.data.modelName;
          }
        }

        // 清除已有节点的 selected，只选中新节点，避免 ReactFlow 多选导致拖动时联动
        const clearedNodes = currentNodes.map((n) => ({ ...n, selected: false }));
        (newNode as any).selected = true;
        const nextNodes = [...clearedNodes, newNode as any];
        const undoData = {
          nodes: JSON.parse(JSON.stringify(currentNodes)),
          edges: JSON.parse(JSON.stringify(nextEdges)),
        };
        const redoData = {
          nodes: JSON.parse(JSON.stringify(nextNodes)),
          edges: JSON.parse(JSON.stringify(nextEdges)),
        };

        skipStoreSyncRef.current = true;
        nodesRef.current = nextNodes;
        setNodes(nextNodes);
        composerActions.setSelectedNodes([newNode.id]);
        composerActions.addToHistory('addNode', `Added node`, undoData, redoData);
        actions.importData(nextNodes as any, nextEdges as any, {
          merge: false,
        });

        // 标记变更，触发保存提示/状态
        composerActions.markDirty();

        // 立即选择并打开属性面板，确保可见
        // 稍作延迟，确保 ReactFlow 与 store 均完成更新
        setTimeout(() => composerActions.openNodeSettings(newNode.id), 0);
      } catch (error) {
        console.error('Failed to create node:', error);
      }
    }
  }, [reactFlowInstance, snapToGrid, setNodes, actions, composerActions]);

  // 选择变化处理
  const onSelectionChange = useCallback(({ nodes: selectedNodes }: { nodes: Node[] }) => {
    const selectedIds = selectedNodes.map(node => node.id);
    composerActions.setSelectedNodes(selectedIds);
  }, [composerActions]);

  // 双击节点聚焦属性面板
  const onNodeDoubleClick = useCallback((_: React.MouseEvent, node: Node) => {
    composerActions.openNodeSettings(node.id);
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

  // 右键菜单：全选
  const handleSelectAll = useCallback(() => {
    const allIds = nodes.map((n) => n.id);
    setNodes((nds) => nds.map((n) => ({ ...n, selected: true })));
    composerActions.setSelectedNodes(allIds);
  }, [nodes, setNodes, composerActions]);

  // 右键菜单：自动布局
  const handleAutoLayout = useCallback(() => {
    const layouted = autoLayoutTree(nodes, edges);
    const store = useBehaviorTreeStore.getState();
    store.actions.importData(layouted as any, edges as any, { merge: false });
    setNodes(layouted);
    reactFlowInstance?.fitView({ padding: 0.2 });
    composerActions.markDirty();
  }, [nodes, edges, setNodes, reactFlowInstance, composerActions]);

  return (
    <div className={cn('flex-1 relative', className)}>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div className="w-full h-full">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChangeWithSync}
              onEdgesChange={onEdgesChangeWithSync}
              onConnect={onConnect}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onInit={setReactFlowInstance}
              onNodeDragStart={onNodeDragStart}
              onSelectionChange={onSelectionChange}
              onNodeDoubleClick={onNodeDoubleClick}
              onMove={onMove}
              nodeTypes={nodeTypes}
              defaultEdgeOptions={defaultEdgeOptions}
              connectionMode={ConnectionMode.Loose}
              snapToGrid={snapToGrid}
              snapGrid={[20, 20]}
              fitView
              attributionPosition="bottom-right"
              panOnDrag={[0, 1]}
              selectionOnDrag
              selectionKeyCode="Shift"
              panOnScroll
              zoomOnScroll
              zoomOnPinch
              deleteKeyCode="Delete"
              multiSelectionKeyCode="Shift"
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
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          <ContextMenuItem onSelect={handleSelectAll}>
            <span>{t('composer:toolbar.selectAll')}</span>
            <ContextMenuShortcut>⌘A</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            onSelect={() => composerActions.copySelection()}
            disabled={selectedNodes.length === 0}
          >
            <Copy className="mr-2 h-4 w-4" />
            <span>{t('composer:actions.copy')}</span>
            <ContextMenuShortcut>⌘C</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem
            onSelect={() => composerActions.deleteSelectedNodes()}
            disabled={selectedNodes.length === 0}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            <span>{t('composer:toolbar.delete')}</span>
            <ContextMenuShortcut>Del</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuLabel>{t('composer:toolbar.layout')}</ContextMenuLabel>
          <ContextMenuItem onSelect={handleAutoLayout}>
            <GitBranch className="mr-2 h-4 w-4" />
            <span>{t('menu:autoLayoutTree')}</span>
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onSelect={() => composerActions.toggleSnapToGrid()}>
            <Grid3X3 className="mr-2 h-4 w-4" />
            <span>{snapToGrid ? t('common:disable', '禁用') : t('common:enable', '启用')} {t('menu:gridSnap')}</span>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
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
