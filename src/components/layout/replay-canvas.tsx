import React, { useCallback, useRef, useEffect, useState, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  ReactFlowInstance,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Panel,
  MarkerType
} from 'reactflow';
import isEqual from 'lodash/isEqual';
import { cn } from '@/core/utils/utils';
import { useI18n } from '@/hooks/use-i18n';
import { 
  useReplaySession,
  useCurrentTime,
  useReplayEvents,
  useVisibleEvents,
  useTimelineMarkers,
  useBehaviorTreeData,
  useReplayActions
} from '@/core/store/behavior-tree-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Play,
  Pause,
  Calendar,
  Activity,
  Zap,
  Eye,
  EyeOff,
  Target,
  Clock,
  TrendingUp
} from 'lucide-react';

// 引入ReactFlow样式
import 'reactflow/dist/style.css';

// 回放节点组件
import { ReplayBehaviorTreeNode } from '../nodes/replay-behavior-tree-node';

interface ReplayCanvasProps {
  children?: React.ReactNode;
  className?: string;
}

// 自定义节点类型映射
const nodeTypes = {
  replayBehaviorTreeNode: ReplayBehaviorTreeNode,
};

// 回放状态边样式
const getEdgeStyle = (isActive: boolean, isPast: boolean) => {
  if (isActive) {
    return {
      stroke: '#10b981', // green-500
      strokeWidth: 3,
      animated: true,
    };
  }
  if (isPast) {
    return {
      stroke: '#6b7280', // gray-500
      strokeWidth: 2,
      opacity: 0.6,
    };
  }
  return {
    stroke: '#e5e7eb', // gray-200
    strokeWidth: 1,
    opacity: 0.3,
  };
};

// 回放控制面板
function ReplayControls({ 
  reactFlowInstance 
}: { 
  reactFlowInstance: ReactFlowInstance | null 
}) {
  const { t } = useI18n();
  const timelineMarkers = useTimelineMarkers();
  const replayActions = useReplayActions();
  const [showExecutionPath, setShowExecutionPath] = useState(true);
  const [showNodeAnimations, setShowNodeAnimations] = useState(true);

  const handleFitView = useCallback(() => {
    reactFlowInstance?.fitView({ padding: 0.1 });
  }, [reactFlowInstance]);

  const handleToggleExecutionPath = useCallback(() => {
    setShowExecutionPath(!showExecutionPath);
    replayActions.setVisualizationOption('showExecutionPath', !showExecutionPath);
  }, [showExecutionPath, replayActions]);

  const handleToggleNodeAnimations = useCallback(() => {
    setShowNodeAnimations(!showNodeAnimations);
    replayActions.setVisualizationOption('showNodeAnimations', !showNodeAnimations);
  }, [showNodeAnimations, replayActions]);

  return (
    <Panel position="top-right" className="flex flex-col gap-2">
      <div className="flex items-center gap-1 bg-background/80 backdrop-blur-sm border rounded-md p-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleFitView}
          className="h-8 w-8 p-0"
          title={t('replay:canvas.fitView')}
        >
          <Target className="h-4 w-4" />
        </Button>
        
        <Button
          variant={showExecutionPath ? "default" : "ghost"}
          size="sm"
          onClick={handleToggleExecutionPath}
          className="h-8 w-8 p-0"
          title={t('replay:canvas.toggleExecutionPath')}
        >
          <TrendingUp className="h-4 w-4" />
        </Button>
        
        <Button
          variant={showNodeAnimations ? "default" : "ghost"}
          size="sm"
          onClick={handleToggleNodeAnimations}
          className="h-8 w-8 p-0"
          title={t('replay:canvas.toggleAnimations')}
        >
          <Zap className="h-4 w-4" />
        </Button>
      </div>
    </Panel>
  );
}

// 回放信息面板
function ReplayInfo({ 
  nodeCount, 
  activeNodeCount,
  currentTime,
  totalTime 
}: { 
  nodeCount: number; 
  activeNodeCount: number;
  currentTime: number;
  totalTime: number;
}) {
  const { t } = useI18n();
  
  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = totalTime > 0 ? (currentTime / totalTime) * 100 : 0;

  return (
    <Panel position="bottom-left" className="flex items-center gap-2">
      <div className="flex items-center gap-3 bg-background/80 backdrop-blur-sm border rounded-md px-3 py-2 text-sm">
        <div className="flex items-center gap-1">
          <Activity className="h-4 w-4 text-muted-foreground" />
          <span>{t('replay:canvas.nodeCount', { count: nodeCount })}</span>
        </div>
        
        {activeNodeCount > 0 && (
          <>
            <span className="text-muted-foreground">|</span>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>{t('replay:canvas.activeNodes', { count: activeNodeCount })}</span>
            </div>
          </>
        )}
        
        <span className="text-muted-foreground">|</span>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span>{formatTime(currentTime)} / {formatTime(totalTime)}</span>
          <div className="w-16">
            <Progress value={progress} className="h-1" />
          </div>
        </div>
      </div>
    </Panel>
  );
}

// 事件时间轴标记
function EventTimelineMarkers() {
  const { t } = useI18n();
  const visibleEvents = useVisibleEvents();
  const currentTime = useCurrentTime();
  const replaySession = useReplaySession();
  
  const nearbyEvents = useMemo(() => {
    if (!replaySession) return [];
    
    // 找出当前时间附近的事件（前后5秒）
    const timeWindow = 5000; // 5秒
    return visibleEvents.filter(event => 
      Math.abs(event.timestamp - currentTime) <= timeWindow
    ).slice(0, 5); // 最多显示5个事件
  }, [visibleEvents, currentTime, replaySession]);

  if (nearbyEvents.length === 0) return null;

  return (
    <Panel position="top-left" className="space-y-1">
      <div className="text-xs font-medium text-muted-foreground mb-1">
        {t('replay:canvas.nearbyEvents')}
      </div>
      {nearbyEvents.map((event) => (
        <div 
          key={event.id}
          className="flex items-center gap-2 bg-background/80 backdrop-blur-sm border rounded-md px-2 py-1 text-xs"
        >
          <div className={cn(
            'w-2 h-2 rounded-full',
            event.level === 'error' ? 'bg-red-500' :
            event.level === 'warning' ? 'bg-yellow-500' :
            event.level === 'info' ? 'bg-blue-500' : 'bg-gray-500'
          )} />
          <span className="truncate max-w-32">{event.message}</span>
          <Badge variant="outline" className="text-xs">
            {new Date(event.timestamp).toLocaleTimeString()}
          </Badge>
        </div>
      ))}
    </Panel>
  );
}

// ReactFlow画布组件
function ReactFlowCanvas({ 
  className,
  children 
}: { 
  className?: string;
  children?: React.ReactNode;
}) {
  const { t } = useI18n();
  const behaviorTreeData = useBehaviorTreeData();
  const replaySession = useReplaySession();
  const currentTime = useCurrentTime();
  const visibleEvents = useVisibleEvents();
  const timelineState = useTimelineState();

  // ReactFlow实例
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  // 初始化节点和边，添加回放状态
  const [nodes, setNodes] = useNodesState([]);
  const [edges, setEdges] = useEdgesState([]);

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
  const updatedNodes = useMemo(() => {
    if (!stableTreeNodes || !replaySession) return [];
    
    // 基于当前时间和事件更新节点状态
    return stableTreeNodes.map(node => {
      // 找出影响此节点的事件
      const nodeEvents = visibleEvents.filter(event => 
        event.nodeId === node.id && event.timestamp <= currentTime
      );

      // 确定节点当前状态
      let nodeState = 'idle';
      let isActive = false;
      let lastEvent = null;

      if (nodeEvents.length > 0) {
        // 按时间排序，获取最近的事件
        const sortedEvents = nodeEvents.sort((a, b) => b.timestamp - a.timestamp);
        lastEvent = sortedEvents[0];

        // 根据事件类型确定状态
        switch (lastEvent.type) {
          case 'node_enter':
            nodeState = 'running';
            isActive = true;
            break;
          case 'node_success':
            nodeState = 'success';
            break;
          case 'node_failure':
            nodeState = 'failure';
            break;
          case 'node_exit':
            nodeState = 'idle';
            break;
        }
      }

      return {
        ...node,
        type: 'replayBehaviorTreeNode',
        data: {
          ...node.data,
          replayState: nodeState,
          isActive,
          lastEvent,
          currentTime,
          events: nodeEvents
        }
      };
    });
  }, [stableTreeNodes, currentTime, visibleEvents, replaySession]);

  const updatedEdges = useMemo(() => {
    if (!stableTreeEdges) return [];
    
    return stableTreeEdges.map(edge => {
      // 检查源节点和目标节点的状态
      const sourceNode = updatedNodes.find(n => n.id === edge.source);
      const targetNode = updatedNodes.find(n => n.id === edge.target);
      
      const isActive = sourceNode?.data?.isActive && targetNode?.data?.isActive;
      const isPast = sourceNode?.data?.replayState === 'success' || 
                     sourceNode?.data?.replayState === 'failure';

      return {
        ...edge,
        style: getEdgeStyle(isActive, isPast),
        markerEnd: { type: MarkerType.ArrowClosed },
        animated: isActive && timelineState.isPlaying
      };
    });
  }, [stableTreeEdges, updatedNodes, timelineState.isPlaying]);

  // 处理节点状态更新 - 修复无限循环问题
  useEffect(() => {
    if (updatedNodes.length > 0 || (updatedNodes.length === 0 && nodes.length > 0)) {
      setNodes((prevNodes) => {
        // 只有当节点实际发生变化时才更新
        if (!isEqual(prevNodes, updatedNodes)) {
          return updatedNodes;
        }
        return prevNodes;
      });
    }
  }, [updatedNodes, setNodes]);

  // 处理边状态更新 - 修复无限循环问题
  useEffect(() => {
    if (updatedEdges.length > 0 || (updatedEdges.length === 0 && edges.length > 0)) {
      setEdges((prevEdges) => {
        // 只有当边实际发生变化时才更新
        if (!isEqual(prevEdges, updatedEdges)) {
          return updatedEdges;
        }
        return prevEdges;
      });
    }
  }, [updatedEdges, setEdges]);

  // 统计信息
  const activeNodeCount = nodes.filter(node => node.data?.isActive).length;
  const totalTime = replaySession?.duration || 0;

  return (
    <div className={cn('flex-1 relative', className)}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onInit={setReactFlowInstance}
        connectionMode="strict"
        elementsSelectable={false}
        nodesDraggable={false}
        nodesConnectable={false}
        panOnDrag
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
            const state = node.data?.replayState;
            switch (state) {
              case 'running': return '#10b981'; // green-500
              case 'success': return '#059669'; // green-600
              case 'failure': return '#dc2626'; // red-600
              default: return '#64748b'; // gray-500
            }
          }}
          position="bottom-left"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            border: '1px solid #e2e8f0',
            borderRadius: '4px',
          }}
        />

        {/* 回放控制面板 */}
        <ReplayControls reactFlowInstance={reactFlowInstance} />

        {/* 回放信息面板 */}
        <ReplayInfo
          nodeCount={nodes.length}
          activeNodeCount={activeNodeCount}
          currentTime={currentTime}
          totalTime={totalTime}
        />

        {/* 事件时间轴标记 */}
        <EventTimelineMarkers />

        {/* 空状态提示 */}
        {nodes.length === 0 && (
          <Panel position="center" className="pointer-events-none">
            <div className="text-center p-8 bg-background/80 backdrop-blur-sm border rounded-lg">
              <div className="text-muted-foreground mb-2">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              </div>
              <h3 className="text-lg font-medium mb-2">
                {t('replay:canvas.emptyTitle')}
              </h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                {t('replay:canvas.emptyDescription')}
              </p>
            </div>
          </Panel>
        )}
      </ReactFlow>

      {children}
    </div>
  );
}

// 主画布组件
export default function ReplayCanvas({ children, className }: ReplayCanvasProps) {
  return (
    <ReactFlowProvider>
      <ReactFlowCanvas className={className}>
        {children}
      </ReactFlowCanvas>
    </ReactFlowProvider>
  );
}