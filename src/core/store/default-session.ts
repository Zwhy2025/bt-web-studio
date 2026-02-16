/**
 * 默认会话与节点创建逻辑
 * 独立模块以打破 behavior-tree-store <-> sessionState 的循环依赖
 */
import type { Node } from 'reactflow';
import {
  NodeStatus,
  DebugState,
  type BehaviorTreeNode,
  type BehaviorTreeEdge,
  type ProjectSession,
  type BlackboardEntry,
} from './behavior-tree-types';

export interface DefaultSessionExtra {
  host: string;
  port: number;
  status: DebugState;
}

/**
 * 创建一个新节点
 */
export const createNode = (
  position: { x: number; y: number },
  data: Record<string, any> = {},
  isFirstNode = false,
  snapToGrid = true,
  nodeType = 'behaviorTreeNode'
): Node => ({
  id: isFirstNode ? 'root' : `node-${Date.now()}`,
  type: nodeType,
  position: snapToGrid
    ? {
        x: Math.round(position.x / 20) * 20,
        y: Math.round(position.y / 20) * 20,
      }
    : position,
  data: {
    label: data.label || data.name || 'Unnamed Node',
    status: NodeStatus.IDLE,
    parameters: {},
    executionCount: 0,
    inputs: isFirstNode ? [] : [{ id: 'in', side: 'top' }],
    outputs: [{ id: 'out', side: 'bottom' }],
    ...(isFirstNode ? { instanceName: 'root' } : {}),
    originalId: data.id,
    nodeType: nodeType,
    createdAt: Date.now(),
    ...data,
  },
});

/**
 * 创建默认会话
 */
export function createDefaultSession(): ProjectSession & DefaultSessionExtra {
  return {
    id: `session-${Date.now()}`,
    name: '新项目',
    nodes: [
      createNode(
        { x: 100, y: 80 },
        {
          label: 'Root (Sequence)',
          modelName: 'Sequence',
          category: 'control',
        },
        true,
        true,
        'behaviorTreeNode'
      ) as BehaviorTreeNode,
    ],
    edges: [] as BehaviorTreeEdge[],
    blackboard: {} as Record<string, BlackboardEntry>,
    createdAt: Date.now(),
    modifiedAt: Date.now(),
    host: '',
    port: 0,
    status: DebugState.STOPPED,
  };
}
