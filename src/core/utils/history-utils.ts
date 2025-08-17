import { Node, Edge } from "reactflow";

export interface HistoryState {
  nodes: Node[];
  edges: Edge[];
}

export class HistoryManager {
  private history: HistoryState[] = [];
  private currentIndex = -1;
  private maxHistorySize = 50;

  constructor(initialState: HistoryState) {
    this.push(initialState);
  }

  push(state: HistoryState) {
    // 如果当前不在历史记录的末尾，删除后面的记录
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1);
    }

    // 添加新状态（使用 structuredClone 进行深拷贝）
    this.history.push(structuredClone(state));

    // 限制历史记录大小
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    } else {
      this.currentIndex++;
    }
  }

  canUndo(): boolean {
    return this.currentIndex > 0;
  }

  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  undo(): HistoryState | null {
    if (!this.canUndo()) return null;
    this.currentIndex--;
    return this.getCurrentState();
  }

  redo(): HistoryState | null {
    if (!this.canRedo()) return null;
    this.currentIndex++;
    return this.getCurrentState();
  }

  getCurrentState(): HistoryState {
    return this.history[this.currentIndex];
  }

  clear() {
    this.history = [];
    this.currentIndex = -1;
  }
}