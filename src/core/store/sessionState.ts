import { StateCreator } from 'zustand';
import type { BehaviorTreeState } from './behavior-tree-store';
import type { ProjectSession, DebugSession, ReplaySession } from './behavior-tree-store';
import { createDefaultSession } from './default-session';
import { DebugState } from './behavior-tree-types';

export { createNode } from './default-session';

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

export { createDefaultSession } from './default-session';
