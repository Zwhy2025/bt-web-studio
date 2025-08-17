
import { StateCreator } from 'zustand';
import { BehaviorTreeState, ExecutionEvent, NodeStatus } from './behavior-tree-store';

export interface TimelineSlice {
  executionEvents: ExecutionEvent[];
  currentEventIndex: number;
  timelinePosition: number;
  timelineRange: [number, number];
  isReplaying: boolean;
  playbackSpeed: number;
  totalDuration: number;
  replayTimer: NodeJS.Timeout | null;
  replayStartTime: number;
  actions: {
    addExecutionEvent: (event: Omit<ExecutionEvent, 'id' | 'timestamp'>) => void;
    clearExecutionEvents: () => void;
    setTimelinePosition: (position: number) => void;
    setTimelineRange: (range: [number, number]) => void;
    toggleReplay: () => void;
    startReplay: () => void;
    stopReplay: () => void;
    pauseReplay: () => void;
    seekToTime: (time: number) => void;
    setPlaybackSpeed: (speed: number) => void;
    updateNodesForTimePosition: (time: number) => void;
    skipForward: (seconds?: number) => void;
    skipBackward: (seconds?: number) => void;
    seekToStart: () => void;
    seekToEnd: () => void;
  };
}

export const createTimelineSlice: StateCreator<
  BehaviorTreeState,
  [],
  [],
  TimelineSlice
> = (set, get) => ({
  executionEvents: [],
  currentEventIndex: 0,
  timelinePosition: 0,
  timelineRange: [0, 100],
  isReplaying: false,
  playbackSpeed: 1.0,
  totalDuration: 0,
  replayTimer: null,
  replayStartTime: 0,
  actions: {
    addExecutionEvent: (event) => {
      const newEvent: ExecutionEvent = {
        ...event,
        id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
      };
      set((state) => ({ executionEvents: [...state.executionEvents, newEvent] }));
    },
    clearExecutionEvents: () => {
      set({ executionEvents: [] });
    },
    setTimelinePosition: (position) => {
      set({ timelinePosition: position });
    },
    setTimelineRange: (range) => {
      set({ timelineRange: range });
    },
    toggleReplay: () => {
      const { isReplaying, actions } = get();
      if (isReplaying) {
        actions.stopReplay();
      } else {
        actions.startReplay();
      }
    },
    startReplay: () => {
      const state = get();
      if (state.replayTimer) clearInterval(state.replayTimer);

      const totalDuration = state.executionEvents.length > 0 ? Math.max(...state.executionEvents.map(e => e.timestamp)) : 10000;
      const startTime = Date.now();
      const initialPosition = state.timelinePosition;

      const timer = setInterval(() => {
        const currentState = get();
        const elapsed = (Date.now() - startTime) * currentState.playbackSpeed;
        const newPosition = Math.min(initialPosition + elapsed, totalDuration);

        set({ timelinePosition: newPosition });
        currentState.actions.updateNodesForTimePosition(newPosition);

        if (newPosition >= totalDuration) {
          currentState.actions.stopReplay();
        }
      }, 50);

      set({ isReplaying: true, replayTimer: timer, replayStartTime: startTime, totalDuration });
    },
    stopReplay: () => {
      const state = get();
      if (state.replayTimer) clearInterval(state.replayTimer);
      set({ isReplaying: false, replayTimer: null, replayStartTime: 0 });
    },
    pauseReplay: () => {
      const state = get();
      if (state.replayTimer) clearInterval(state.replayTimer);
      set({ isReplaying: false, replayTimer: null });
    },
    seekToTime: (time) => {
      const state = get();
      const clampedTime = Math.max(0, Math.min(time, state.totalDuration));
      set({ timelinePosition: clampedTime });
      state.actions.updateNodesForTimePosition(clampedTime);
    },
    setPlaybackSpeed: (speed) => {
      const clampedSpeed = Math.max(0.1, Math.min(8.0, speed));
      set({ playbackSpeed: clampedSpeed });
    },
    updateNodesForTimePosition: (time) => {
      const state = get();
      const resetNodes = state.nodes.map(node => ({ ...node, data: { ...node.data, status: NodeStatus.IDLE } }));
      const activeEvents = state.executionEvents.filter(event => event.timestamp <= time);
      activeEvents.sort((a, b) => a.timestamp - b.timestamp);

      const updatedNodes = resetNodes.map(node => {
        const nodeEvents = activeEvents.filter(event => event.nodeId === node.id);
        const latestEvent = nodeEvents[nodeEvents.length - 1];
        if (latestEvent) {
          return { ...node, data: { ...node.data, status: latestEvent.status } };
        }
        return node;
      });
      set({ nodes: updatedNodes });
    },
    skipForward: (seconds = 1) => {
      const state = get();
      const newTime = Math.min(state.timelinePosition + seconds * 1000, state.totalDuration);
      state.actions.seekToTime(newTime);
    },
    skipBackward: (seconds = 1) => {
      const state = get();
      const newTime = Math.max(state.timelinePosition - seconds * 1000, 0);
      state.actions.seekToTime(newTime);
    },
    seekToStart: () => {
      get().actions.seekToTime(0);
    },
    seekToEnd: () => {
      get().actions.seekToTime(get().totalDuration);
    },
  },
});
