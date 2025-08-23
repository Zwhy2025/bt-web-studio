import React, { useMemo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { cn } from '@/core/utils/utils';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/hooks/use-i18n';
import { 
  Play,
  Pause,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  AlertCircle,
  Square
} from 'lucide-react';

// 回放节点数据接口
interface ReplayNodeData {
  label: string;
  category: 'control' | 'decorator' | 'action' | 'condition' | 'subtree';
  nodeType: string;
  replayState: 'idle' | 'running' | 'success' | 'failure' | 'paused';
  isActive: boolean;
  lastEvent?: {
    id: string;
    timestamp: number;
    type: string;
    message: string;
    level: 'info' | 'warning' | 'error' | 'debug';
  };
  currentTime: number;
  events: any[];
  executionCount?: number;
  avgExecutionTime?: number;
  successRate?: number;
}

// 节点状态颜色映射
const getNodeStateColors = (state: string, category: string) => {
  const baseColors = {
    control: 'bg-blue-50 border-blue-200 text-blue-900',
    decorator: 'bg-purple-50 border-purple-200 text-purple-900',
    action: 'bg-green-50 border-green-200 text-green-900',
    condition: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    subtree: 'bg-cyan-50 border-cyan-200 text-cyan-900',
  };

  const stateOverrides = {
    running: 'bg-blue-100 border-blue-400 text-blue-900 shadow-lg ring-2 ring-blue-300 ring-opacity-50',
    success: 'bg-green-100 border-green-400 text-green-900 shadow-md',
    failure: 'bg-red-100 border-red-400 text-red-900 shadow-md',
    paused: 'bg-yellow-100 border-yellow-400 text-yellow-900 shadow-md',
  };

  return stateOverrides[state as keyof typeof stateOverrides] || 
         baseColors[category as keyof typeof baseColors] || 
         'bg-gray-50 border-gray-200 text-gray-900';
};

// 节点状态图标
const getNodeStateIcon = (state: string, isActive: boolean) => {
  const iconClass = cn('h-4 w-4', isActive && 'animate-pulse');
  
  switch (state) {
    case 'running':
      return <Play className={cn(iconClass, 'text-blue-600')} />;
    case 'success':
      return <CheckCircle className={cn(iconClass, 'text-green-600')} />;
    case 'failure':
      return <XCircle className={cn(iconClass, 'text-red-600')} />;
    case 'paused':
      return <Pause className={cn(iconClass, 'text-yellow-600')} />;
    default:
      return <Square className={cn(iconClass, 'text-gray-400')} />;
  }
};

// 执行统计显示组件
function ExecutionStats({ 
  executionCount, 
  avgExecutionTime, 
  successRate 
}: {
  executionCount?: number;
  avgExecutionTime?: number;
  successRate?: number;
}) {
  const { t } = useI18n();

  if (!executionCount) return null;

  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className="mt-2 space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{t('replay:node.executions')}:</span>
        <Badge variant="secondary" className="text-xs">{executionCount}</Badge>
      </div>
      
      {avgExecutionTime !== undefined && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{t('replay:node.avgTime')}:</span>
          <span className="font-mono">{formatTime(avgExecutionTime)}</span>
        </div>
      )}
      
      {successRate !== undefined && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{t('replay:node.successRate')}:</span>
          <span className={cn(
            'font-medium',
            successRate > 0.8 ? 'text-green-600' :
            successRate > 0.5 ? 'text-yellow-600' : 'text-red-600'
          )}>
            {(successRate * 100).toFixed(0)}%
          </span>
        </div>
      )}
    </div>
  );
}

// 最近事件显示组件
function RecentEvent({ 
  event,
  currentTime 
}: {
  event: ReplayNodeData['lastEvent'];
  currentTime: number;
}) {
  const { t } = useI18n();

  if (!event) return null;

  const timeDiff = currentTime - event.timestamp;
  const isRecent = timeDiff < 5000; // 5秒内算最近

  const getEventIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <AlertCircle className="h-3 w-3 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-3 w-3 text-yellow-500" />;
      case 'info':
        return <Activity className="h-3 w-3 text-blue-500" />;
      default:
        return <Clock className="h-3 w-3 text-gray-500" />;
    }
  };

  return (
    <div className={cn(
      'mt-2 p-1 rounded text-xs border',
      isRecent ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
    )}>
      <div className="flex items-center gap-1 mb-1">
        {getEventIcon(event.level)}
        <span className="font-medium truncate">{event.message}</span>
      </div>
      <div className="text-muted-foreground">
        {new Date(event.timestamp).toLocaleTimeString()}
      </div>
    </div>
  );
}

// 主回放节点组件
export function ReplayBehaviorTreeNode({ data }: NodeProps<ReplayNodeData>) {
  const { t } = useI18n();

  const {
    label,
    category,
    nodeType,
    replayState,
    isActive,
    lastEvent,
    currentTime,
    events,
    executionCount,
    avgExecutionTime,
    successRate
  } = data;

  // 计算节点样式
  const nodeClasses = useMemo(() => {
    return cn(
      'px-3 py-2 shadow-md rounded-lg border-2 bg-white min-w-[160px] max-w-[240px] transition-all duration-200',
      getNodeStateColors(replayState, category),
      isActive && 'transform scale-105'
    );
  }, [replayState, category, isActive]);

  // 节点类型显示名称
  const getNodeTypeName = (type: string): string => {
    const typeMap: Record<string, string> = {
      'Sequence': t('nodes:types.sequence'),
      'Selector': t('nodes:types.selector'),
      'Parallel': t('nodes:types.parallel'),
      'Inverter': t('nodes:types.inverter'),
      'Repeater': t('nodes:types.repeater'),
      'Condition': t('nodes:types.condition'),
      'Action': t('nodes:types.action'),
      'SubTree': t('nodes:types.subtree'),
    };
    return typeMap[type] || type;
  };

  return (
    <div className={nodeClasses}>
      {/* 输入连接点 */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 border-2 border-gray-400 bg-white"
      />

      {/* 节点头部：状态图标和标签 */}
      <div className="flex items-center gap-2 mb-2">
        {getNodeStateIcon(replayState, isActive)}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate" title={label}>
            {label}
          </div>
          <div className="text-xs text-muted-foreground">
            {getNodeTypeName(nodeType)}
          </div>
        </div>
        {isActive && (
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        )}
      </div>

      {/* 节点分类标识 */}
      <div className="flex items-center justify-between mb-2">
        <Badge variant="outline" className="text-xs">
          {t(`nodes:categories.${category}`)}
        </Badge>
        
        {events.length > 0 && (
          <Badge variant="secondary" className="text-xs">
            {events.length} {t('replay:node.events')}
          </Badge>
        )}
      </div>

      {/* 执行统计 */}
      <ExecutionStats 
        executionCount={executionCount}
        avgExecutionTime={avgExecutionTime}
        successRate={successRate}
      />

      {/* 最近事件 */}
      <RecentEvent event={lastEvent} currentTime={currentTime} />

      {/* 输出连接点 */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 border-2 border-gray-400 bg-white"
      />

      {/* 活跃状态动画效果 */}
      {isActive && (
        <div className="absolute inset-0 rounded-lg border-2 border-blue-400 animate-ping opacity-25 pointer-events-none" />
      )}
    </div>
  );
}

export default ReplayBehaviorTreeNode;