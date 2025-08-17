
import { StateCreator } from 'zustand';
import { BehaviorTreeState } from './behavior-tree-store';

export interface UiSlice {
  showMinimap: boolean;
  showGrid: boolean;
  snapToGrid: boolean;
  panelSizes: Record<string, number>;
  actions: {
    toggleMinimap: () => void;
    toggleGrid: () => void;
    toggleSnapToGrid: () => void;
    setPanelSize: (panelId: string, size: number) => void;
  };
}

export const createUiSlice: StateCreator<
  BehaviorTreeState,
  [],
  [],
  UiSlice
> = (set) => ({
  showMinimap: true,
  showGrid: true,
  snapToGrid: true,
  panelSizes: {
    leftPanel: 18,
    rightPanel: 18,
    bottomPanel: 200,
  },
  actions: {
    toggleMinimap: () => {
      set((state) => ({ showMinimap: !state.showMinimap }));
    },
    toggleGrid: () => {
      set((state) => ({ showGrid: !state.showGrid }));
    },
    toggleSnapToGrid: () => {
      set((state) => ({ snapToGrid: !state.snapToGrid }));
    },
    setPanelSize: (panelId, size) => {
      set((state) => ({
        panelSizes: {
          ...state.panelSizes,
          [panelId]: size,
        },
      }));
    },
  },
});
