import React, { memo, useState, useCallback } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { cn } from '@/core/utils/utils';
import { useDebugActions } from '@/core/store/behavior-tree-store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  GitBranch,
  Repeat,
  Zap,
  Shield,
  Package,
  Activity,
  Settings,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Pause,
  Play,
  Bug,
  Target,
  MoreHorizontal
} from 'lucide-react';

// 调试节点状态枚举
export enum DebugNodeStatus {
  IDLE = 'idle',
  RUNNING = 'running',
  SUCCESS = 'success',
  FAILURE = 'failure',
  ERROR = 'error',
  PAUSED = 'paused',
}

// 调试节点数据接口
export interface DebugBehaviorTreeNodeData {
  id: string;
  name: string;
  category: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  color?: string;
  
  // 调试特定数据
  debugStatus?: DebugNodeStatus;
  isBreakpoint?: boolean;
  isExecuting?: boolean;
  isHovered?: boolean;
  executionCount?: number;
  lastExecutionTime?: number;
  executionDuration?: number;
  hasError?: boolean;
  errorMessage?: string;
  
  // 调试模式设置
  debugMode?: boolean;
  showBreakpoints?: boolean;
  showExecutionCount?: boolean;
  
  // 原有数据
  properties?: Record<string, any>;
}

// 获取节点图标
function getNodeIcon(category: string, customIcon?: React.ComponentType<{ className?: string }>) {
  if (customIcon) return customIcon;
  
  switch (category) {
    case 'control': return GitBranch;
    case 'decorator': return Repeat;
    case 'action': return Zap;
    case 'condition': return Shield;
    case 'subtree': return Package;
    case 'parallel': return Activity;
    default: return GitBranch;
  }
}

// 获取节点颜色
function getNodeColor(category: string, customColor?: string) {
  if (customColor) return customColor;
  
  switch (category) {
    case 'control': return 'bg-blue-500';
    case 'decorator': return 'bg-purple-500';
    case 'action': return 'bg-green-500';
    case 'condition': return 'bg-orange-500';
    case 'subtree': return 'bg-teal-500';
    case 'parallel': return 'bg-indigo-500';
    default: return 'bg-gray-500';
  }
}

// 获取调试状态颜色
function getDebugStatusColor(status: DebugNodeStatus, isExecuting: boolean = false) {
  if (isExecuting) {
    return 'border-blue-400 bg-blue-50 shadow-lg shadow-blue-200';
  }
  
  switch (status) {
    case DebugNodeStatus.RUNNING:
      return 'border-green-400 bg-green-50';
    case DebugNodeStatus.SUCCESS:
      return 'border-green-500 bg-green-100';
    case DebugNodeStatus.FAILURE:
      return 'border-red-400 bg-red-50';
    case DebugNodeStatus.ERROR:
      return 'border-orange-400 bg-orange-50';
    case DebugNodeStatus.PAUSED:
      return 'border-yellow-400 bg-yellow-50';
    default:
      return 'border-gray-200 bg-white';
  }
}

// 获取调试状态图标
function getDebugStatusIcon(status: DebugNodeStatus, isExecuting: boolean = false) {
  if (isExecuting) {
    return <Activity className="h-3 w-3 text-blue-600 animate-pulse" />;
  }
  
  switch (status) {
    case DebugNodeStatus.RUNNING:
      return <Play className="h-3 w-3 text-green-600" />;
    case DebugNodeStatus.SUCCESS:
      return <CheckCircle className="h-3 w-3 text-green-600" />;
    case DebugNodeStatus.FAILURE:
      return <XCircle className="h-3 w-3 text-red-600" />;
    case DebugNodeStatus.ERROR:
      return <AlertTriangle className="h-3 w-3 text-orange-600" />;
    case DebugNodeStatus.PAUSED:
      return <Pause className="h-3 w-3 text-yellow-600" />;
    default:
      return null;
  }
}

// 调试行为树节点组件
export const DebugBehaviorTreeNode = memo<NodeProps<DebugBehaviorTreeNodeData>>(({ 
  id, 
  data, 
  selected,
  dragging 
}) => {
  const debugActions = useDebugActions();
  const [isHovered, setIsHovered] = useState(false);

  const Icon = getNodeIcon(data.category, data.icon);
  const nodeColor = getNodeColor(data.category, data.color);
  const statusColor = getDebugStatusColor(data.debugStatus || DebugNodeStatus.IDLE, data.isExecuting);
  const statusIcon = getDebugStatusIcon(data.debugStatus || DebugNodeStatus.IDLE, data.isExecuting);

  // 断点切换
  const handleToggleBreakpoint = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    if (data.isBreakpoint) {
      // 移除断点
      debugActions.removeBreakpoint(id);
    } else {
      // 添加断点
      debugActions.addBreakpoint(id);
    }
  }, [id, data.isBreakpoint, debugActions]);

  // 节点点击处理 - 可以用于设置当前执行点
  const handleNodeClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    // 在调试模式下点击节点可以设置为当前执行点
    console.log('Debug node clicked:', id);
  }, [id]);

  return (
    <div
      className={cn(
        'relative min-w-[140px] max-w-[220px] border-2 rounded-lg shadow-sm transition-all duration-200',
        statusColor,
        selected && 'ring-2 ring-primary ring-offset-1',
        dragging && 'opacity-50',
        data.isExecuting && 'scale-105',
        'hover:shadow-md'
      )}
      onClick={handleNodeClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 输入连接点 */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 border-2 border-gray-400 bg-white"
      />

      {/* 断点指示器 */}
      {data.showBreakpoints && data.isBreakpoint && (
        <div className="absolute -left-2 top-2 w-4 h-4 rounded-full bg-red-500 border-2 border-white z-10">
          <Bug className="h-2 w-2 text-white m-0.5" />
        </div>
      )}

      {/* 执行指示器 */}
      {data.isExecuting && (
        <div className="absolute -right-2 -top-2 w-6 h-6 rounded-full bg-blue-500 border-2 border-white z-10 flex items-center justify-center">
          <Activity className="h-3 w-3 text-white animate-pulse" />
        </div>
      )}

      {/* 节点头部 */}
      <div className="flex items-center gap-2 p-2 border-b border-gray-200">
        <div className={cn('w-6 h-6 rounded-md flex items-center justify-center', nodeColor)}>
          <Icon className="w-3 h-3 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{data.name}</div>
        </div>
        
        {/* 状态指示器 */}
        <div className="flex items-center gap-1">
          {statusIcon}
          {data.hasError && (
            <AlertTriangle className="h-3 w-3 text-red-500" />
          )}
        </div>
      </div>

      {/* 节点内容 */}
      <div className="p-2 space-y-1">
        {data.description && (
          <div className="text-xs text-muted-foreground line-clamp-2">
            {data.description}
          </div>
        )}
        
        {/* 调试信息 */}
        {data.debugMode && (
          <div className="flex flex-wrap gap-1 text-xs">
            {data.executionCount !== undefined && data.executionCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                执行: {data.executionCount}
              </Badge>
            )}
            
            {data.executionDuration !== undefined && (
              <Badge variant="outline" className="text-xs">
                {data.executionDuration}ms
              </Badge>
            )}
            
            {data.lastExecutionTime && (
              <Badge variant="outline" className="text-xs">
                {new Date(data.lastExecutionTime).toLocaleTimeString()}
              </Badge>
            )}
          </div>
        )}

        {/* 属性预览 */}
        {data.properties && Object.keys(data.properties).length > 0 && (
          <div className="flex flex-wrap gap-1">
            {Object.entries(data.properties).slice(0, 1).map(([key, value]) => (
              <Badge key={key} variant="secondary" className="text-xs">
                {key}: {String(value).slice(0, 8)}
              </Badge>
            ))}
            {Object.keys(data.properties).length > 1 && (
              <Badge variant="secondary" className="text-xs">
                +{Object.keys(data.properties).length - 1}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* 悬停调试工具栏 */}
      {isHovered && data.debugMode && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 flex items-center gap-1 bg-background border rounded-md shadow-lg p-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleBreakpoint}
            className="h-6 w-6 p-0"
            title={data.isBreakpoint ? "移除断点" : "设置断点"}
          >
            <div className={cn(
              'w-2 h-2 rounded-full',
              data.isBreakpoint ? 'bg-red-500' : 'bg-gray-300'
            )} />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              console.log('Jump to node:', id);
            }}
            className="h-6 w-6 p-0"
            title="跳转到节点"
          >
            <Target className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* 输出连接点 */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 border-2 border-gray-400 bg-white"
      />

      {/* 错误消息提示 */}
      {data.hasError && data.errorMessage && isHovered && (
        <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-red-50 border border-red-200 rounded-md text-xs text-red-700 z-20">
          {data.errorMessage}
        </div>
      )}
    </div>
  );
});

DebugBehaviorTreeNode.displayName = 'DebugBehaviorTreeNode';

// 导出节点数据类型
export type { DebugBehaviorTreeNodeData, DebugNodeStatus };