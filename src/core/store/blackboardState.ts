
import { StateCreator } from 'zustand';
import { BehaviorTreeState, BlackboardEntry } from './behavior-tree-store';

export interface BlackboardSlice {
  blackboard: Record<string, BlackboardEntry>;
  blackboardHistory: Record<string, BlackboardEntry[]>;
  actions: {
    setBlackboardValue: (key: string, value: any, type: BlackboardEntry['type'], source?: string) => void;
    deleteBlackboardKey: (key: string) => void;
    clearBlackboard: () => void;
  };
}

export const createBlackboardSlice: StateCreator<
  BehaviorTreeState,
  [],
  [],
  BlackboardSlice
> = (set) => ({
  blackboard: {},
  blackboardHistory: {},
  actions: {
    setBlackboardValue: (key, value, type, source) => {
      const entry: BlackboardEntry = {
        key,
        value,
        type,
        timestamp: Date.now(),
        source,
      };

      set((state) => ({
        blackboard: {
          ...state.blackboard,
          [key]: entry,
        },
        blackboardHistory: {
          ...state.blackboardHistory,
          [key]: [...(state.blackboardHistory[key] || []), entry],
        },
      }));
    },
    deleteBlackboardKey: (key) => {
      set((state) => {
        const { [key]: deleted, ...remainingBlackboard } = state.blackboard;
        return { blackboard: remainingBlackboard };
      });
    },
    clearBlackboard: () => {
      set({ blackboard: {}, blackboardHistory: {} });
    },
  },
});
