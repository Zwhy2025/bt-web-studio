import React, { memo, useState, useCallback } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { cn } from '@/core/utils/utils';
import { useComposerActions, useSelectedNodes } from '@/core/store/behavior-tree-store';
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
  MoreHorizontal
} from 'lucide-react';

// 节点状态枚举
export enum NodeStatus {
  IDLE = 'idle',
  RUNNING = 'running',
  SUCCESS = 'success',
  FAILURE = 'failure',
  ERROR = 'error',
}

// 节点数据接口
export interface BehaviorTreeNodeData {
  id: string;
  name: string;
  category: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  color?: string;
  status?: NodeStatus;
  isBreakpoint?: boolean;
  isDisabled?: boolean;
  hasError?: boolean;
  errorMessage?: string;
  executionCount?: number;
  lastExecutionTime?: number;
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

// 获取状态颜色
function getStatusColor(status: NodeStatus) {
  switch (status) {
    case NodeStatus.RUNNING:
      return 'border-blue-400 bg-blue-50';
    case NodeStatus.SUCCESS:
      return 'border-green-400 bg-green-50';
    case NodeStatus.FAILURE:
      return 'border-red-400 bg-red-50';
    case NodeStatus.ERROR:
      return 'border-orange-400 bg-orange-50';
    default:
      return 'border-gray-200 bg-white';
  }
}

// 获取状态图标
function getStatusIcon(status: NodeStatus) {
  switch (status) {
    case NodeStatus.RUNNING:
      return <Clock className="h-3 w-3 text-blue-600 animate-spin" />;
    case NodeStatus.SUCCESS:
      return <CheckCircle className="h-3 w-3 text-green-600" />;
    case NodeStatus.FAILURE:
      return <XCircle className="h-3 w-3 text-red-600" />;
    case NodeStatus.ERROR:
      return <AlertTriangle className="h-3 w-3 text-orange-600" />;
    default:
      return null;
  }
}

// 行为树节点组件
export const BehaviorTreeNode = memo<NodeProps<BehaviorTreeNodeData>>(({ 
  id, 
  data, 
  selected,
  dragging 
}) => {
  const composerActions = useComposerActions();
  const selectedNodes = useSelectedNodes();
  const [isHovered, setIsHovered] = useState(false);

  const Icon = getNodeIcon(data.category, data.icon);
  const nodeColor = getNodeColor(data.category, data.color);
  const statusColor = getStatusColor(data.status || NodeStatus.IDLE);
  const statusIcon = getStatusIcon(data.status || NodeStatus.IDLE);

  const isSelected = selectedNodes.includes(id);

  // 节点点击处理
  const handleNodeClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    composerActions.selectNode(id, event.ctrlKey || event.metaKey);
  }, [id, composerActions]);

  // 节点双击处理
  const handleNodeDoubleClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    composerActions.openNodeEditor(id);
  }, [id, composerActions]);

  // 断点切换
  const handleToggleBreakpoint = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    composerActions.toggleBreakpoint(id);
  }, [id, composerActions]);

  // 节点禁用切换
  const handleToggleDisabled = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    composerActions.toggleNodeDisabled(id);
  }, [id, composerActions]);

  return (
    <div
      className={cn(
        'relative min-w-[120px] max-w-[200px] border-2 rounded-lg shadow-sm transition-all duration-200',
        statusColor,
        isSelected && 'ring-2 ring-primary ring-offset-1',
        dragging && 'opacity-50',
        data.isDisabled && 'opacity-60',
        'hover:shadow-md',
        isHovered && 'scale-105'
      )}
      onClick={handleNodeClick}
      onDoubleClick={handleNodeDoubleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 输入连接点 */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 border-2 border-gray-400 bg-white"
        isConnectable={!data.isDisabled}
      />

      {/* 节点头部 */}
      <div className="flex items-center gap-2 p-2 border-b border-gray-200">
        <div className={cn('w-6 h-6 rounded-md flex items-center justify-center', nodeColor)}>
          <Icon className="w-3 h-3 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{data.name}</div>
        </div>
        
        {/* 状态和标志 */}
        <div className="flex items-center gap-1">
          {statusIcon}
          {data.isBreakpoint && (
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
          )}
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
        
        {/* 属性预览 */}
        {data.properties && Object.keys(data.properties).length > 0 && (
          <div className="flex flex-wrap gap-1">
            {Object.entries(data.properties).slice(0, 2).map(([key, value]) => (
              <Badge key={key} variant="secondary" className="text-xs">
                {key}: {String(value).slice(0, 10)}
              </Badge>
            ))}
            {Object.keys(data.properties).length > 2 && (
              <Badge variant="secondary" className="text-xs">
                +{Object.keys(data.properties).length - 2}
              </Badge>
            )}
          </div>
        )}

        {/* 执行统计 */}
        {data.executionCount && data.executionCount > 0 && (
          <div className="text-xs text-muted-foreground">
            执行次数: {data.executionCount}
          </div>
        )}
      </div>

      {/* 悬停工具栏 */}
      {isHovered && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 flex items-center gap-1 bg-background border rounded-md shadow-lg p-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleBreakpoint}
            className="h-6 w-6 p-0"
            title="切换断点"
          >
            <div className={cn(
              'w-2 h-2 rounded-full',
              data.isBreakpoint ? 'bg-red-500' : 'bg-gray-300'
            )} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleDisabled}
            className="h-6 w-6 p-0"
            title={data.isDisabled ? '启用节点' : '禁用节点'}
          >
            {data.isDisabled ? (
              <Eye className="h-3 w-3" />
            ) : (
              <EyeOff className="h-3 w-3" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              composerActions.openNodeSettings(id);
            }}
            className="h-6 w-6 p-0"
            title="节点设置"
          >
            <Settings className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* 输出连接点 */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 border-2 border-gray-400 bg-white"
        isConnectable={!data.isDisabled}
      />

      {/* 错误消息提示 */}
      {data.hasError && data.errorMessage && isHovered && (
        <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-red-50 border border-red-200 rounded-md text-xs text-red-700 z-10">
          {data.errorMessage}
        </div>
      )}
    </div>
  );
});

BehaviorTreeNode.displayName = 'BehaviorTreeNode';

// 导出节点数据类型
export type { BehaviorTreeNodeData, NodeStatus };