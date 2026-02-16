import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/core/utils/utils';
import { NodeStatus } from '@/core/store/behavior-tree-store';
import { ChevronRight, Play, CheckCircle, XCircle, Clock, Crown } from 'lucide-react';

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

// 格式化节点标签，避免 "Sequence: Sequence" 等重复
function formatNodeLabel(data: ControlSequenceNodeData & Record<string, any>): string {
  if ((data as any)?.instanceName === 'root') return 'Root';
  const modelName = data?.modelName;
  if (modelName) return modelName;
  const label = data?.label ?? '';
  if (typeof label !== 'string') return String(label);
  const parts = label.split(':').map((s) => s.trim());
  if (parts.length === 2 && parts[0] === parts[1]) return parts[0];
  return label;
}

// 状态样式映射（支持深色模式）
const statusStyles = {
  [NodeStatus.IDLE]: 'border-border bg-card text-foreground',
  [NodeStatus.RUNNING]: 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400 shadow-lg',
  [NodeStatus.SUCCESS]: 'border-green-500 bg-green-500/10 text-green-600 dark:text-green-400',
  [NodeStatus.FAILURE]: 'border-red-500 bg-red-500/10 text-red-600 dark:text-red-400',
};

export function ControlSequenceNode({ 
  id,
  data, 
  selected, 
  xPos, 
  yPos 
}: NodeProps<ControlSequenceNodeData>) {
  const status = data.status || NodeStatus.IDLE;
  const isRoot = id === 'root' || (data as any)?.instanceName === 'root';
  const Icon = isRoot ? Crown : StatusIcon[status];

  return (
    <div className="control-sequence-node">
      {/* 输入连接点（Root 无输入端口） */}
      {!isRoot && (
        <Handle
          type="target"
          position={Position.Top}
          className="w-3 h-3 !bg-muted-foreground border-2 border-background"
        />
      )}

      <Card className={cn(
        'min-w-[180px] transition-all duration-200',
        isRoot && 'border-amber-400/70 bg-amber-50/80 dark:bg-amber-950/40 dark:border-amber-500/50 shadow-amber-200/30',
        !isRoot && statusStyles[status],
        selected && 'ring-2 ring-blue-500',
        data.breakpoint && 'ring-2 ring-red-500',
        'hover:shadow-md'
      )}>
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            {/* 状态图标 */}
            <Icon className="h-4 w-4 flex-shrink-0" />
            
            {/* 节点标签：避免 "Sequence: Sequence" 等重复显示 */}
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">
                {formatNodeLabel(data)}
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
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-background" />
          )}
        </CardContent>
      </Card>

      {/* 输出连接点 */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-muted-foreground border-2 border-background"
      />
    </div>
  );
}

export default ControlSequenceNode;