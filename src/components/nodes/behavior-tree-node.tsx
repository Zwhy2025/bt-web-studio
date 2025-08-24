import React, { memo, useState, useCallback, useMemo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { cn } from '@/core/utils/utils';
import { useComposerActions, useSelectedNodes } from '@/core/store/behavior-tree-store';
import { Badge } from '@/components/ui/badge';
import { 
  GitBranch,
  Repeat,
  Zap,
  Shield,
  Package,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock
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
export interface PortConfig {
  id: string;
  label?: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
}

export interface BehaviorTreeNodeData {
  id: string;
  name: string;
  modelName?: string;     // 模型名（类型/模板）
  instanceName?: string;  // 实例名（显示用）
  category: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  color?: string;
  status?: NodeStatus;
  isBreakpoint?: boolean; // 调试用（编排不显示控件）
  isDisabled?: boolean;   // 调试用（编排不显示控件）
  hasError?: boolean;
  errorMessage?: string;
  executionCount?: number;
  lastExecutionTime?: number;
  properties?: Record<string, any>;
  inputs?: PortConfig[];
  outputs?: PortConfig[];
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
function getNodeColor(category: string, customColor?: string, isRootNode: boolean = false) {
  // Root节点使用特殊颜色(红色)
  if (isRootNode) return 'bg-red-500';
  
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
      return 'border-blue-400 bg-blue-50 dark:border-blue-500/50 dark:bg-blue-500/10';
    case NodeStatus.SUCCESS:
      return 'border-green-400 bg-green-50 dark:border-green-500/50 dark:bg-green-500/10';
    case NodeStatus.FAILURE:
      return 'border-red-400 bg-red-50 dark:border-red-500/50 dark:bg-red-500/10';
    case NodeStatus.ERROR:
      return 'border-orange-400 bg-orange-50 dark:border-orange-500/50 dark:bg-orange-500/10';
    default:
      // 默认在明暗两种主题下都可读
      return 'border-border bg-card';
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

  // 确保data.icon存在且是有效的组件，否则使用category获取图标
  const Icon = data.icon && typeof data.icon === 'function' 
    ? data.icon 
    : getNodeIcon(data.category);
  const nodeColor = getNodeColor(data.category, data.color, id === 'root');
  const statusColor = getStatusColor(data.status || NodeStatus.IDLE);
  const statusIcon = getStatusIcon(data.status || NodeStatus.IDLE);

  const isSelected = selectedNodes.includes(id);
  const isRootNode = id === 'root';

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

  // 端口配置（根据数据渲染多端口）
  const inputs = useMemo<PortConfig[]>(() => {
    const arr = data.inputs && data.inputs.length > 0 ? data.inputs : [{ id: 'in', side: 'top' as const }];
    return arr.map(p => ({ ...p, side: p.side || 'top' }));
  }, [data.inputs]);

  const outputs = useMemo<PortConfig[]>(() => {
    const arr = data.outputs && data.outputs.length > 0 ? data.outputs : [{ id: 'out', side: 'bottom' as const }];
    return arr.map(p => ({ ...p, side: p.side || 'bottom' }));
  }, [data.outputs]);

  const modelTitle = (data.modelName || data.name || '').toString();
  const instanceTitle = (data.instanceName || '').toString().trim();

  return (
    <div
      className={cn(
        'relative min-w-[120px] max-w-[220px] border-2 rounded-lg shadow-sm transition-all duration-200 text-foreground',
        isRootNode ? 'bg-red-500 border-red-600' : statusColor,
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
      {/* 输入连接点（支持多端口） */}
      {inputs.map((port, i) => {
        const count = inputs.length;
        const pos = port.side === 'left' ? Position.Left : port.side === 'right' ? Position.Right : Position.Top;
        const style: React.CSSProperties = {};
        if (pos === Position.Top || pos === Position.Bottom) {
          style.left = `${((i + 1) / (count + 1)) * 100}%`;
          style.transform = 'translateX(-50%)';
        } else {
          const sideCount = inputs.filter(p => p.side === port.side).length;
          const idx = inputs.filter((p, idx) => p.side === port.side && idx <= i).length - 1;
          style.top = `${((idx + 1) / (sideCount + 1)) * 100}%`;
          style.transform = 'translateY(-50%)';
        }
        return (
          <Handle
            key={`in-${port.id}-${i}`}
            id={port.id}
            type="target"
            position={pos}
            className="w-3 h-3 border-2 border-border bg-background"
            isConnectable={!data.isDisabled}
            style={style}
          />
        );
      })}

      {/* 节点头部 */}
      <div className="flex items-center gap-2 p-2 border-b border-border/70 bg-accent/10">
        <div className={cn('w-6 h-6 rounded-md flex items-center justify-center shadow-sm', nodeColor)}>
          <Icon className="w-3 h-3 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          {/* 模型名：优先显示且字号更大 */}
          <div className="font-semibold text-sm truncate">{modelTitle}</div>
          {/* 实例名：仅在设置后显示，置于模型名下方且更小 */}
          {instanceTitle && (
            <div className="text-[11px] text-muted-foreground leading-4 truncate">{instanceTitle}</div>
          )}
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

      {/* 节点内容（编排模式简洁显示，不展示描述与属性预览） */}
      <div className="p-2" />

      {/* 编排模式不显示调试类悬浮工具栏（断点/禁用/设置） */}

      {/* 输出连接点（支持多端口） */}
      {outputs.map((port, i) => {
        const count = outputs.length;
        const pos = port.side === 'left' ? Position.Left : port.side === 'right' ? Position.Right : Position.Bottom;
        const style: React.CSSProperties = {};
        if (pos === Position.Top || pos === Position.Bottom) {
          style.left = `${((i + 1) / (count + 1)) * 100}%`;
          style.transform = 'translateX(-50%)';
        } else {
          const sideCount = outputs.filter(p => p.side === port.side).length;
          const idx = outputs.filter((p, idx) => p.side === port.side && idx <= i).length - 1;
          style.top = `${((idx + 1) / (sideCount + 1)) * 100}%`;
          style.transform = 'translateY(-50%)';
        }
        return (
          <Handle
            key={`out-${port.id}-${i}`}
            id={port.id}
            type="source"
            position={pos}
            className="w-3 h-3 border-2 border-border bg-background"
            isConnectable={!data.isDisabled}
            style={style}
          />
        );
      })}

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
export { BehaviorTreeNodeData };
