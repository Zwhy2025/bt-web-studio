/**
 * 行为树核心类型与枚举
 * 独立模块，无循环依赖，供 default-session 等使用
 */
import type { Node, Edge } from 'reactflow';

export enum NodeStatus {
  IDLE = 'idle',
  RUNNING = 'running',
  SUCCESS = 'success',
  FAILURE = 'failure',
}

export enum DebugState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  STOPPED = 'stopped',
  RUNNING = 'running',
  PAUSED = 'paused',
  STEPPING = 'stepping',
}

export interface BlackboardEntry {
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'object';
  timestamp: number;
  source?: string;
}

export interface BehaviorTreeNode extends Node {
  data: {
    label: string;
    status?: NodeStatus;
    parameters?: Record<string, any>;
    breakpoint?: boolean;
    executionCount?: number;
    lastExecutionTime?: number;
    description?: string;
    subtreeId?: string;
    subtreeParameters?: Record<string, string>;
    isSubtreeReference?: boolean;
    isExpanded?: boolean;
    isSubtreeChild?: boolean;
    parentSubtreeRef?: string;
    originalId?: string;
  };
}

export interface BehaviorTreeEdge extends Edge {
  data?: {
    executionCount?: number;
    lastExecutionTime?: number;
    isSubtreeConnection?: boolean;
    parentSubtreeRef?: string;
  };
}

export interface ProjectSession {
  id: string;
  name: string;
  nodes: BehaviorTreeNode[];
  edges: BehaviorTreeEdge[];
  blackboard: Record<string, BlackboardEntry>;
  createdAt: number;
  modifiedAt: number;
  filePath?: string;
}
