
import { StateCreator } from 'zustand';
import { BehaviorTreeState, ProjectSession, NodeStatus, DebugState, Node, DebugSession, ReplaySession } from './behavior-tree-store';

/**
 * 创建一个新节点
 * @param position 节点位置
 * @param data 节点数据
 * @param isFirstNode 是否为第一个节点
 * @param snapToGrid 是否吸附到网格
 * @param nodeType 节点类型
 * @returns 创建的节点
 */
export const createNode = (position: { x: number; y: number }, data: Record<string, any> = {}, isFirstNode: boolean = false, snapToGrid: boolean = true, nodeType: string = 'behaviorTreeNode'): Node => ({
  id: isFirstNode ? 'root' : `node-${Date.now()}`,
  type: nodeType,
  position: snapToGrid ? {
    x: Math.round(position.x / 20) * 20,
    y: Math.round(position.y / 20) * 20,
  } : position,
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

const createDefaultSession = (): ProjectSession & Partial<DebugSession> & Partial<ReplaySession> => ({
  id: `session-${Date.now()}`,
  name: '新项目',
  nodes: [createNode({ x: 100, y: 80 }, { label: 'Root (Sequence)' }, true, true, 'control-sequence')],
  edges: [],
  blackboard: {},
  createdAt: Date.now(),
  modifiedAt: Date.now(),
  host: '',
  port: 0,
  status: DebugState.STOPPED,
});

export interface SessionSlice {
  currentSession: (ProjectSession & Partial<DebugSession> & Partial<ReplaySession>) | null;
  sessions: (ProjectSession & Partial<DebugSession> & Partial<ReplaySession>)[];
  activeSessionId: string;
  actions: {
    createSession: (name: string) => string;
    switchSession: (sessionId: string) => void;
    updateSession: (sessionId: string, updates: Partial<ProjectSession>) => void;
    deleteSession: (sessionId: string) => void;
    resetToDefaults: () => void;
  };
}

export const createSessionSlice: StateCreator<
  BehaviorTreeState,
  [],
  [],
  SessionSlice
> = (set, get) => ({
  currentSession: null, // Will be initialized
  sessions: [],
  activeSessionId: '',
  actions: {
    createSession: (name) => {
      const newSession = createDefaultSession();
      newSession.name = name;

      set((state) => ({
        sessions: [...state.sessions, newSession],
        currentSession: newSession,
        activeSessionId: newSession.id,
        nodes: newSession.nodes,
        edges: newSession.edges,
        blackboard: newSession.blackboard,
      }));

      return newSession.id;
    },
    switchSession: (sessionId) => {
      const state = get();
      const session = state.sessions.find((s) => s.id === sessionId);
      if (session) {
        if (state.currentSession) {
          const updatedSessions = state.sessions.map((s) =>
            s.id === state.currentSession?.id
              ? {
                ...s,
                nodes: state.nodes,
                edges: state.edges,
                blackboard: state.blackboard,
                modifiedAt: Date.now(),
              }
              : s
          );
          set({ sessions: updatedSessions });
        }

        const newState: Partial<BehaviorTreeState> = {
          currentSession: session,
          activeSessionId: sessionId,
          nodes: session.nodes,
          edges: session.edges,
          blackboard: session.blackboard,
          selectedNodeIds: [],
          selectedEdgeIds: [],
        };

        if (state.isDebuggerConnected && state.debuggerClient) {
          state.debuggerClient.setNodes(session.nodes.map((n) => n.id));
        }

        set(newState);
      }
    },
    updateSession: (sessionId, updates) => {
      set((state) => ({
        sessions: state.sessions.map((s) =>
          s.id === sessionId ? { ...s, ...updates, modifiedAt: Date.now() } : s
        ),
        currentSession: state.currentSession?.id === sessionId
          ? { ...state.currentSession, ...updates, modifiedAt: Date.now() }
          : state.currentSession,
      }));
    },
    deleteSession: (sessionId) => {
      const state = get();
      const remainingSessions = state.sessions.filter((s) => s.id !== sessionId);

      if (remainingSessions.length === 0) {
        const newSession = createDefaultSession();
        set({
          sessions: [newSession],
          currentSession: newSession,
          activeSessionId: newSession.id,
          nodes: newSession.nodes,
          edges: newSession.edges,
          blackboard: newSession.blackboard,
        });
      } else {
        const newActiveSession = state.activeSessionId === sessionId
          ? remainingSessions[0]
          : state.currentSession;

        set({
          sessions: remainingSessions,
          currentSession: newActiveSession,
          activeSessionId: newActiveSession?.id || '',
          nodes: newActiveSession?.nodes || [],
          edges: newActiveSession?.edges || [],
          blackboard: newActiveSession?.blackboard || {},
        });
      }
    },
    resetToDefaults: () => {
      const defaultSession = createDefaultSession();
      set({
        currentSession: defaultSession,
        sessions: [defaultSession],
        activeSessionId: defaultSession.id,
        nodes: defaultSession.nodes,
        edges: defaultSession.edges,
        blackboard: {},
        blackboardHistory: {},
        debugState: DebugState.STOPPED,
        breakpoints: new Set(),
        currentExecutingNode: null,
        executionEvents: [],
        executionSpeed: 1.0,
        timelinePosition: 0,
        timelineRange: [0, 100],
        isReplaying: false,
        selectedNodeIds: [],
        selectedEdgeIds: [],
      });
    },
  },
});

export { createDefaultSession };
