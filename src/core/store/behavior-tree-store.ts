import { create } from 'zustand';
import { useMemo } from 'react';
import { create } from 'zustand';
import { shallow } from 'zustand/shallow';
import { subscribeWithSelector } from 'zustand/middleware';
import { Node, Edge } from 'reactflow';

import { createSessionSlice, SessionSlice, createDefaultSession } from './sessionState';
import { createTreeSlice, TreeSlice } from './treeState';
import { createBlackboardSlice, BlackboardSlice } from './blackboardState';
import { createDebuggerSlice, DebuggerSlice } from './debuggerState';
import { createTimelineSlice, TimelineSlice } from './timelineState';
import { createUiSlice, UiSlice } from './uiState';
import { createWorkflowModeSlice, WorkflowModeSlice } from './workflowModeState';
import { createComposerModeSlice, ComposerModeSlice } from './composerModeState';
import { createDebugModeSlice, DebugModeSlice } from './debugModeState';
import { createReplayModeSlice, ReplayModeSlice } from './replayModeState';

// 节点状态枚举
export enum NodeStatus {
  IDLE = 'idle',
  RUNNING = 'running',
  SUCCESS = 'success',
  FAILURE = 'failure',
}

// 黑板数据类型
export interface BlackboardEntry {
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'object';
  timestamp: number;
  source?: string; // 哪个节点设置的
}

// 扩展的节点类型
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

// 扩展的边类型
export interface BehaviorTreeEdge extends Edge {
  data?: {
    executionCount?: number;
    lastExecutionTime?: number;
    isSubtreeConnection?: boolean;
    parentSubtreeRef?: string;
  };
}

// 调试状态
export enum DebugState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  STOPPED = 'stopped',
  RUNNING = 'running',
  PAUSED = 'paused',
  STEPPING = 'stepping',
}

// 执行事件
export interface ExecutionEvent {
  id: string;
  timestamp: number;
  nodeId: string;
  type: 'enter' | 'exit' | 'tick';
  status: NodeStatus;
  blackboardSnapshot?: Record<string, any>;
  duration?: number;
}

// 项目会话
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

// 合并所有 Slices 的类型定义
export type BehaviorTreeState = SessionSlice & TreeSlice & BlackboardSlice & DebuggerSlice & TimelineSlice & UiSlice & WorkflowModeSlice & ComposerModeSlice & DebugModeSlice & ReplayModeSlice;

// 创建最终的 store
export const useBehaviorTreeStore = create<BehaviorTreeState>()(
  subscribeWithSelector((set, get, api) => {
    const defaultSession = createDefaultSession();

    const sessionSlice = createSessionSlice(set, get, api);
    const treeSlice = createTreeSlice(set, get, api);
    const blackboardSlice = createBlackboardSlice(set, get, api);
    const debuggerSlice = createDebuggerSlice(set, get, api);
    const timelineSlice = createTimelineSlice(set, get, api);
    const uiSlice = createUiSlice(set, get, api);
    const workflowModeSlice = createWorkflowModeSlice(set, get, api);
    const composerModeSlice = createComposerModeSlice(set, get, api);
    const debugModeSlice = createDebugModeSlice(set, get, api);
    const replayModeSlice = createReplayModeSlice(set, get, api);

    return {
      ...sessionSlice,
      ...treeSlice,
      ...blackboardSlice,
      ...debuggerSlice,
      ...timelineSlice,
      ...uiSlice,
      ...workflowModeSlice,
      ...composerModeSlice,
      ...debugModeSlice,
      ...replayModeSlice,

      // 使用默认会话覆盖初始状态
      currentSession: defaultSession,
      sessions: [defaultSession],
      activeSessionId: defaultSession.id,
      nodes: defaultSession.nodes,
      edges: defaultSession.edges,
      blackboard: defaultSession.blackboard,

      // 将所有 Slices 的 actions 合并到一个统一的 actions 对象中
      actions: {
        ...sessionSlice.actions,
        ...treeSlice.actions,
        ...blackboardSlice.actions,
        ...debuggerSlice.actions,
        ...timelineSlice.actions,
        ...uiSlice.actions,
        ...workflowModeSlice.actions,
        ...composerModeSlice.composerActions,
        ...debugModeSlice.debugActions,
        ...replayModeSlice.replayActions,
      },
    };
  })
);

// 选择器 hooks (保持不变)
export const useCurrentSession = () => useBehaviorTreeStore((state) => state.currentSession);
export const useNodes = () => useBehaviorTreeStore((state) => state.nodes);
export const useEdges = () => useBehaviorTreeStore((state) => state.edges);
export const useBlackboard = () => useBehaviorTreeStore((state) => state.blackboard);
export const useDebugState = () => useBehaviorTreeStore((state) => state.debugState);
export const useIsDebuggerConnected = () => useBehaviorTreeStore((state) => state.isDebuggerConnected);
export const useDebuggerConnectionError = () => useBehaviorTreeStore((state) => state.debuggerConnectionError);
export const useExecutionEvents = () => useBehaviorTreeStore((state) => state.executionEvents);
export const useSelectedNodes = () => useBehaviorTreeStore((state) => state.selectedNodeIds);
export const useSelectedEdges = () => useBehaviorTreeStore((state) => state.selectedEdgeIds);
export const useActions = () => useBehaviorTreeStore((state) => state.actions);

// 工作流模式相关选择器
export const useCurrentMode = () => useBehaviorTreeStore((state) => state.currentMode);
export const usePreviousMode = () => useBehaviorTreeStore((state) => state.previousMode);
export const useIsTransitioning = () => useBehaviorTreeStore((state) => state.isTransitioning);
export const useTransitionProgress = () => useBehaviorTreeStore((state) => state.transitionProgress);
export const useModeHistory = () => useBehaviorTreeStore((state) => state.modeHistory);

// 编排模式相关选择器
export const useActiveTool = () => useBehaviorTreeStore((state) => state.activeTool);
export const useComposerSelectedNodes = () => useBehaviorTreeStore((state) => state.selectedNodeIds);
export const useSnapToGrid = () => useBehaviorTreeStore((state) => state.alignment?.snapToGrid || false);
export const useCanvasConfig = () => useBehaviorTreeStore((state) => state.viewport);
// 稳定的选择器：仅当 nodes/edges 变更时才更新引用
export const useBehaviorTreeData = () => {
  const nodes = useBehaviorTreeStore((state) => state.nodes);
  const edges = useBehaviorTreeStore((state) => state.edges);

  return useMemo(() => ({ nodes, edges }), [nodes, edges]);
};
export const useViewport = () => useBehaviorTreeStore((state) => state.viewport);
export const useNodeLibraryConfig = () => useBehaviorTreeStore((state) => state.nodeLibrary);
export const usePropertyPanelConfig = () => useBehaviorTreeStore((state) => state.propertyPanel);
export const useEditHistory = () => useBehaviorTreeStore((state) => state.editHistory);
export const useValidationErrors = () => useBehaviorTreeStore((state) => state.validationErrors);
export const useComposerActions = () => useBehaviorTreeStore((state) => state.composerActions);

// 调试模式相关选择器
export const useDebugSession = () => useBehaviorTreeStore((state) => state.currentSession);
export const useExecutionStatus = () => useBehaviorTreeStore((state) => state.executionStatus);
export const useBreakpoints = () => useBehaviorTreeStore((state) => state.breakpoints);
export const useCallStack = () => useBehaviorTreeStore((state) => state.callStack);
export const useWatchVariables = () => useBehaviorTreeStore((state) => state.watchVariables);
export const useDebugLogs = () => useBehaviorTreeStore((state) => state.logs);
export const useDebugActions = () => useBehaviorTreeStore((state) => state.debugActions);

// 回放模式相关选择器
export const useReplaySession = () => useBehaviorTreeStore((state) => state.currentSession);
export const useReplayStatus = () => useBehaviorTreeStore((state) => state.replayStatus);
export const useCurrentTime = () => useBehaviorTreeStore((state) => state.currentTime);
export const useVisibleEvents = () => useBehaviorTreeStore((state) => state.visibleEvents);
export const useTimelineMarkers = () => useBehaviorTreeStore((state) => state.timelineMarkers);
export const useAnalysisResult = () => useBehaviorTreeStore((state) => state.analysisResult);
export const useReplayActions = () => useBehaviorTreeStore((state) => state.replayActions);
export const useReplayEvents = () => useBehaviorTreeStore((state) => state.executionEvents || []);
export const useEventFilters = () => useBehaviorTreeStore((state) => state.eventFilter);
export const useTimelineState = () => {
  const replayStatus = useBehaviorTreeStore((state) => state.replayStatus);
  const currentTime = useBehaviorTreeStore((state) => state.currentTime);
  const totalDuration = useBehaviorTreeStore((state) => state.totalDuration);

  return useMemo(() => ({
    isPlaying: replayStatus === 'playing',
    currentTime,
    duration: totalDuration || 0
  }), [replayStatus, currentTime, totalDuration]);
};
