import React, { useCallback, useRef, useEffect, useState, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  ReactFlowInstance,
  OnSelectionChange,
  XYPosition,
  Panel,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
} from 'reactflow';
import isEqual from 'lodash/isEqual';
import { cn } from '@/core/utils/utils';
import { useI18n } from '@/hooks/use-i18n';
import { 
  useDebugActions,
  useDebugSession,
  useExecutionStatus,
  useBreakpoints,
  useBehaviorTreeData
} from '@/core/store/behavior-tree-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play,
  Pause,
  Square,
  StepForward,
  Target,
  Zap,
  Bug,
  Activity,
  Eye,
  EyeOff
} from 'lucide-react';

// 引入ReactFlow样式
import 'reactflow/dist/style.css';

// 自定义调试节点类型
import { DebugBehaviorTreeNode } from '../nodes/debug-behavior-tree-node';

interface DebugCanvasProps {
  children?: React.ReactNode;
  className?: string;
}

// 自定义节点类型映射
const nodeTypes = {
  debugBehaviorTreeNode: DebugBehaviorTreeNode,
};

// 调试模式边样式
const debugEdgeOptions = {
  animated: false,
  type: 'smoothstep',
  style: { stroke: '#64748b', strokeWidth: 2 },
};

// 调试控制面板
function DebugCanvasControls({ 
  reactFlowInstance,
  showExecutionPath,
  onToggleExecutionPath,
  showBreakpoints,
  onToggleBreakpoints,
}: {
  reactFlowInstance: ReactFlowInstance | null;
  showExecutionPath: boolean;
  onToggleExecutionPath: () => void;
  showBreakpoints: boolean;
  onToggleBreakpoints: () => void;
}) {
  const { t } = useI18n();
  const executionStatus = useExecutionStatus();
  const debugActions = useDebugActions();

  const handleFitView = useCallback(() => {
    reactFlowInstance?.fitView({ padding: 0.1 });
  }, [reactFlowInstance]);

  const isRunning = executionStatus === 'running';

  return (
    <Panel position="top-right" className="flex flex-col gap-2">
      {/* 调试控制 */}
      <div className="flex items-center gap-1 bg-background/80 backdrop-blur-sm border rounded-md p-1">
        <Button
          variant={isRunning ? "default" : "outline"}
          size="sm"
          onClick={isRunning ? debugActions.pauseExecution : debugActions.startExecution}
          className="h-8 w-8 p-0"
          title={isRunning ? t('debug:controls.pause') : t('debug:controls.play')}
        >
          {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={debugActions.stopExecution}
          disabled={executionStatus === 'stopped'}
          className="h-8 w-8 p-0"
          title={t('debug:controls.stop')}
        >
          <Square className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={debugActions.stepOver}
          disabled={isRunning}
          className="h-8 w-8 p-0"
          title={t('debug:controls.stepOver')}
        >
          <StepForward className="h-4 w-4" />
        </Button>
      </div>

      {/* 可视化选项 */}
      <div className="flex items-center gap-1 bg-background/80 backdrop-blur-sm border rounded-md p-1">
        <Button
          variant={showExecutionPath ? "default" : "outline"}
          size="sm"
          onClick={onToggleExecutionPath}
          className="h-8 w-8 p-0"
          title={t('debug:visualization.executionPath')}
        >
          <Activity className="h-4 w-4" />
        </Button>
        
        <Button
          variant={showBreakpoints ? "default" : "outline"}
          size="sm"
          onClick={onToggleBreakpoints}
          className="h-8 w-8 p-0"
          title={t('debug:visualization.breakpoints')}
        >
          <Bug className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleFitView}
          className="h-8 w-8 p-0"
          title={t('debug:canvas.fitView')}
        >
          <Target className="h-4 w-4" />
        </Button>
      </div>
    </Panel>
  );
}

// 执行状态信息面板
function ExecutionInfo({ 
  currentNode,
  executionCount,
  executionTime 
}: { 
  currentNode: string | null;
  executionCount: number;
  executionTime: number;
}) {
  const { t } = useI18n();
  const executionStatus = useExecutionStatus();

  return (
    <Panel position="bottom-left" className="flex items-center gap-2">
      <div className="flex items-center gap-3 bg-background/80 backdrop-blur-sm border rounded-md px-3 py-1.5 text-sm">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-muted-foreground" />
          <span>{t(`debug:status.${executionStatus}`)}</span>
        </div>
        
        {currentNode && (
          <>
            <span className="text-muted-foreground">|</span>
            <div className="flex items-center gap-1">
              <Zap className="h-4 w-4 text-blue-500" />
              <span className="text-blue-600 font-medium">{currentNode}</span>
            </div>
          </>
        )}
        
        <span className="text-muted-foreground">|</span>
        <span>{t('debug:canvas.executions', { count: executionCount })}</span>
        
        <span className="text-muted-foreground">|</span>
        <span>{executionTime}ms</span>
      </div>
    </Panel>
  );
}

// ReactFlow调试画布组件
function ReactFlowDebugCanvas({ 
  className,
  children 
}: { 
  className?: string;
  children?: React.ReactNode;
}) {
  const { t } = useI18n();
  const debugActions = useDebugActions();
  const debugSession = useDebugSession();
  const executionStatus = useExecutionStatus();
  const breakpoints = useBreakpoints();
  const behaviorTreeData = useBehaviorTreeData();

  // ReactFlow实例
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  // 画布状态
  const [showExecutionPath, setShowExecutionPath] = useState(true);
  const [showBreakpoints, setShowBreakpoints] = useState(true);
  const [currentExecutingNode, setCurrentExecutingNode] = useState<string | null>(null);
  const [executionCount, setExecutionCount] = useState(0);
  const [executionTime, setExecutionTime] = useState(0);

  // 初始化调试专用的节点和边
  const [nodes, setNodes, onNodesChange] = useNodesState([]);

  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // 分别获取节点和边，避免对象引用变化导致的无限循环
  const treeNodes = useMemo(() => behaviorTreeData?.nodes || [], [behaviorTreeData?.nodes]);
  const treeEdges = useMemo(() => behaviorTreeData?.edges || [], [behaviorTreeData?.edges]);

  // 创建一个自定义的深度比较hook来避免无限循环
  const useDeepCompareMemo = (value: any, deps: any[]) => {
    const ref = useRef();
    
    if (!ref.current || !isEqual(ref.current, value)) {
      ref.current = value;
    }
    
    return useMemo(() => ref.current, deps);
  };

  // 使用自定义hook来处理节点和边的更新
  const stableTreeNodes = useDeepCompareMemo(treeNodes, [treeNodes]);
  const stableTreeEdges = useDeepCompareMemo(treeEdges, [treeEdges]);

  // 使用useMemo缓存计算结果，避免每次渲染都创建新对象
  const debugNodes = useMemo(() => {
    if (!stableTreeNodes) return [];
    return stableTreeNodes.map(node => ({
      ...node,
      type: 'debugBehaviorTreeNode',
      data: {
        ...node.data,
        // 添加调试特定的数据
        isBreakpoint: Object.values(breakpoints).some(bp => bp.nodeId === node.id),
        isExecuting: currentExecutingNode === node.id,
        executionStatus: executionStatus,
        debugMode: true,
      }
    }));
  }, [stableTreeNodes, breakpoints, currentExecutingNode, executionStatus]);

  const debugEdges = useMemo(() => {
    if (!stableTreeEdges) return [];
    return stableTreeEdges.map(edge => ({
      ...edge,
      ...debugEdgeOptions,
      // 根据执行路径添加动画
      animated: showExecutionPath && edge.source === currentExecutingNode,
      style: {
        ...debugEdgeOptions.style,
        stroke: showExecutionPath && edge.source === currentExecutingNode 
          ? '#10b981' 
          : '#64748b',
        strokeWidth: showExecutionPath && edge.source === currentExecutingNode 
          ? 3 
          : 2,
      }
    }));
  }, [stableTreeEdges, showExecutionPath, currentExecutingNode, debugEdgeOptions]);

  // 同步行为树数据到节点 - 修复无限循环问题
  useEffect(() => {
    if (debugNodes.length > 0 || (debugNodes.length === 0 && nodes.length > 0)) {
      setNodes((prevNodes) => {
        // 只有当节点实际发生变化时才更新
        if (!isEqual(prevNodes, debugNodes)) {
          return debugNodes;
        }
        return prevNodes;
      });
    }
  }, [debugNodes, setNodes]);

  // 同步行为树数据到边 - 修复无限循环问题
  useEffect(() => {
    if (debugEdges.length > 0 || (debugEdges.length === 0 && edges.length > 0)) {
      setEdges((prevEdges) => {
        // 只有当边实际发生变化时才更新
        if (!isEqual(prevEdges, debugEdges)) {
          return debugEdges;
        }
        return prevEdges;
      });
    }
  }, [debugEdges, setEdges]);

  // 模拟执行状态更新
  useEffect(() => {
    if (executionStatus === 'running') {
      const interval = setInterval(() => {
        // 模拟节点执行
        if (behaviorTreeData?.nodes && behaviorTreeData.nodes.length > 0) {
          const nodeIds = behaviorTreeData.nodes.map(n => n.id);
          const randomNode = nodeIds[Math.floor(Math.random() * nodeIds.length)];
          setCurrentExecutingNode(randomNode);
          setExecutionCount(prev => prev + 1);
          setExecutionTime(prev => prev + Math.floor(Math.random() * 50) + 10);
        }
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setCurrentExecutingNode(null);
    }
  }, [executionStatus, behaviorTreeData?.nodes]);



  // 节点选择处理
  const onSelectionChange: OnSelectionChange = useCallback(({ nodes: selectedNodes }) => {
    // 在调试模式下，可以通过选择节点来设置断点
    if (selectedNodes.length === 1) {
      const nodeId = selectedNodes[0].id;
      // 可以在这里添加快捷设置断点的逻辑
    }
  }, []);

  // 节点双击处理 - 切换断点
  const onNodeDoubleClick = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    const existingBreakpoint = Object.values(breakpoints).find(bp => bp.nodeId === node.id);
    
    if (existingBreakpoint) {
      debugActions.removeBreakpoint(existingBreakpoint.id);
    } else {
      debugActions.addBreakpoint(node.id);
    }
  }, [breakpoints, debugActions]);

  return (
    <div className={cn('flex-1 relative', className)}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onInit={setReactFlowInstance}
        onSelectionChange={onSelectionChange}
        onNodeDoubleClick={onNodeDoubleClick}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={debugEdgeOptions}
        panOnDrag
        selectionOnDrag
        panOnScroll
        zoomOnScroll
        zoomOnPinch
        zoomOnDoubleClick={false}
        fitView
        fitViewOptions={{ padding: 0.1 }}
        attributionPosition="bottom-right"
      >
        {/* 背景网格 */}
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={20} 
          size={1}
          color="#e2e8f0"
        />

        {/* 控制器 */}
        <Controls 
          showZoom={false}
          showFitView={false}
          showInteractive={false}
          position="bottom-right"
        />

        {/* 小地图 */}
        <MiniMap
          nodeColor={(node) => {
            if (node.data?.isExecuting) return '#10b981';
            if (node.data?.isBreakpoint) return '#ef4444';
            
            switch (node.data?.category) {
              case 'control': return '#3b82f6';
              case 'decorator': return '#8b5cf6';
              case 'action': return '#10b981';
              case 'condition': return '#f59e0b';
              case 'subtree': return '#14b8a6';
              default: return '#64748b';
            }
          }}
          position="bottom-left"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            border: '1px solid #e2e8f0',
            borderRadius: '4px',
          }}
        />

        {/* 调试控制面板 */}
        <DebugCanvasControls
          reactFlowInstance={reactFlowInstance}
          showExecutionPath={showExecutionPath}
          onToggleExecutionPath={() => setShowExecutionPath(!showExecutionPath)}
          showBreakpoints={showBreakpoints}
          onToggleBreakpoints={() => setShowBreakpoints(!showBreakpoints)}
        />

        {/* 执行信息面板 */}
        <ExecutionInfo
          currentNode={currentExecutingNode}
          executionCount={executionCount}
          executionTime={executionTime}
        />

        {/* 连接状态提示 */}
        {!debugSession && (
          <Panel position="center" className="pointer-events-none">
            <div className="text-center p-8 bg-background/80 backdrop-blur-sm border rounded-lg">
              <div className="text-muted-foreground mb-2">
                <Bug className="h-12 w-12 mx-auto mb-4 opacity-50" />
              </div>
              <h3 className="text-lg font-medium mb-2">
                {t('debug:canvas.notConnected')}
              </h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                {t('debug:canvas.notConnectedDesc')}
              </p>
            </div>
          </Panel>
        )}
      </ReactFlow>

      {children}
    </div>
  );
}

// 主调试画布组件
export default function DebugCanvas({ children, className }: DebugCanvasProps) {
  return (
    <ReactFlowProvider>
      <ReactFlowDebugCanvas className={className}>
        {children}
      </ReactFlowDebugCanvas>
    </ReactFlowProvider>
  );
}