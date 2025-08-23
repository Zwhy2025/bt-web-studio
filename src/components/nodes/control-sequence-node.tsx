import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/core/utils/utils';
import { NodeStatus } from '@/core/store/behavior-tree-store';
import { ChevronRight, Play, CheckCircle, XCircle, Clock } from 'lucide-react';

interface ControlSequenceNodeData {
  label: string;
  status?: NodeStatus;
  executionCount?: number;
  lastExecutionTime?: number;
  breakpoint?: boolean;
  description?: string;
  isExpanded?: boolean;
}

// 状态图标映射
const StatusIcon = {
  [NodeStatus.IDLE]: Clock,
  [NodeStatus.RUNNING]: Play,
  [NodeStatus.SUCCESS]: CheckCircle,
  [NodeStatus.FAILURE]: XCircle,
};

// 状态样式映射
const statusStyles = {
  [NodeStatus.IDLE]: 'border-gray-300 bg-gray-50 text-gray-700',
  [NodeStatus.RUNNING]: 'border-blue-500 bg-blue-50 text-blue-700 shadow-lg',
  [NodeStatus.SUCCESS]: 'border-green-500 bg-green-50 text-green-700',
  [NodeStatus.FAILURE]: 'border-red-500 bg-red-50 text-red-700',
};

export function ControlSequenceNode({ 
  data, 
  selected, 
  xPos, 
  yPos 
}: NodeProps<ControlSequenceNodeData>) {
  const status = data.status || NodeStatus.IDLE;
  const Icon = StatusIcon[status];

  return (
    <div className="control-sequence-node">
      {/* 输入连接点 */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-gray-400 border-2 border-white"
      />

      <Card className={cn(
        'min-w-[180px] transition-all duration-200',
        statusStyles[status],
        selected && 'ring-2 ring-blue-500',
        data.breakpoint && 'ring-2 ring-red-500',
        'hover:shadow-md'
      )}>
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            {/* 状态图标 */}
            <Icon className="h-4 w-4 flex-shrink-0" />
            
            {/* 节点标签 */}
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">
                {data.label}
              </div>
              {data.description && (
                <div className="text-xs text-muted-foreground mt-1 truncate">
                  {data.description}
                </div>
              )}
            </div>

            {/* 展开/折叠图标 */}
            <ChevronRight 
              className={cn(
                'h-4 w-4 transition-transform',
                data.isExpanded && 'rotate-90'
              )} 
            />
          </div>

          {/* 执行统计 */}
          {data.executionCount && data.executionCount > 0 && (
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-current/20">
              <Badge variant="secondary" className="text-xs">
                执行 {data.executionCount} 次
              </Badge>
              {data.lastExecutionTime && (
                <div className="text-xs text-muted-foreground">
                  {new Date(data.lastExecutionTime).toLocaleTimeString()}
                </div>
              )}
            </div>
          )}

          {/* 断点指示器 */}
          {data.breakpoint && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
          )}
        </CardContent>
      </Card>

      {/* 输出连接点 */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-gray-400 border-2 border-white"
      />
    </div>
  );
}

export default ControlSequenceNode;