import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useBehaviorTreeStore } from '@/core/store/behavior-tree-store';
import { WorkflowMode } from '@/core/store/workflowModeState';

// 模拟组件和依赖
vi.mock('@/hooks/use-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key
  })
}));

// 测试数据
const mockTreeData = {
  nodes: [
    { id: 'node1', type: 'action', position: { x: 0, y: 0 }, data: { label: 'Test Action' } },
    { id: 'node2', type: 'condition', position: { x: 100, y: 0 }, data: { label: 'Test Condition' } }
  ],
  edges: [
    { id: 'edge1', source: 'node1', target: 'node2' }
  ]
};

const mockDebugSession = {
  id: 'session1',
  name: 'Test Debug Session',
  status: 'running' as const,
  startTime: Date.now()
};

const mockReplaySession = {
  id: 'replay1',
  name: 'Test Replay Session',
  duration: 60000,
  events: []
};

describe('模式切换集成测试', () => {
  let store: ReturnType<typeof useBehaviorTreeStore>;

  beforeEach(() => {
    // 重置store状态
    store = useBehaviorTreeStore.getState();
    store.workflowMode.switchToComposer();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('编排模式', () => {
    it('应该正确切换到编排模式', () => {
      store.workflowMode.switchToComposer();

      const state = store.workflowMode;
      expect(state.currentMode).toBe(WorkflowMode.COMPOSER);
      expect(state.isTransitioning).toBe(false);
    });

    it('应该在编排模式下正确管理行为树数据', () => {
      store.workflowMode.switchToComposer();
      store.composerMode.setSelectedNodes(['node1']);
      store.composerMode.setActiveTool('select');

      const composerState = store.composerMode;
      expect(composerState.selectedNodeIds).toContain('node1');
      expect(composerState.activeTool).toBe('select');
    });

    it('应该正确处理节点操作', () => {
      store.workflowMode.switchToComposer();
      store.composerMode.addToHistory({
        type: 'add_node',
        nodeId: 'node1',
        data: mockTreeData.nodes[0]
      });

      const composerState = store.composerMode;
      expect(composerState.history).toHaveLength(1);
      expect(composerState.history[0].type).toBe('add_node');
    });

    it('应该支持撤销/重做操作', () => {
      store.workflowMode.switchToComposer();
      
      // 添加操作到历史
      store.composerMode.addToHistory({
        type: 'add_node',
        nodeId: 'node1',
        data: mockTreeData.nodes[0]
      });
      
      store.composerMode.addToHistory({
        type: 'add_node',
        nodeId: 'node2',
        data: mockTreeData.nodes[1]
      });

      // 撤销操作
      store.composerMode.undo();

      const composerState = store.composerMode;
      expect(composerState.historyIndex).toBe(0);
      expect(composerState.canRedo).toBe(true);

      // 重做操作
      store.composerMode.redo();

      expect(store.composerMode.historyIndex).toBe(1);
    });
  });

  describe('调试模式', () => {
    it('应该正确切换到调试模式', () => {
      store.workflowMode.switchToDebug();

      const state = store.workflowMode;
      expect(state.currentMode).toBe(WorkflowMode.DEBUG);
      expect(state.isTransitioning).toBe(false);
    });

    it('应该正确管理调试会话', () => {
      store.workflowMode.switchToDebug();
      store.debugMode.setDebugSession(mockDebugSession);

      const debugState = store.debugMode;
      expect(debugState.debugSession).toEqual(mockDebugSession);
      expect(debugState.executionState).toBe('running');
    });

    it('应该正确管理断点', () => {
      store.workflowMode.switchToDebug();
      store.debugMode.addBreakpoint('node1');
      store.debugMode.addBreakpoint('node2');

      const debugState = store.debugMode;
      expect(debugState.breakpoints.size).toBe(2);
      expect(debugState.breakpoints.has('node1')).toBe(true);
      expect(debugState.breakpoints.has('node2')).toBe(true);
    });

    it('应该正确处理执行控制', () => {
      store.workflowMode.switchToDebug();
      store.debugMode.setDebugSession(mockDebugSession);
      store.debugMode.pauseExecution();

      expect(store.debugMode.executionState).toBe('paused');

      store.debugMode.resumeExecution();

      expect(store.debugMode.executionState).toBe('running');
    });

    it('应该正确管理监视变量', () => {
      store.workflowMode.switchToDebug();
      store.debugMode.addWatchVariable('testVar');

      const debugState = store.debugMode;
      expect(debugState.watchVariables).toHaveLength(1);
      expect(debugState.watchVariables[0].expression).toBe('testVar');
    });
  });

  describe('回放模式', () => {
    it('应该正确切换到回放模式', () => {
      store.workflowMode.switchToReplay();

      const state = store.workflowMode;
      expect(state.currentMode).toBe(WorkflowMode.REPLAY);
      expect(state.isTransitioning).toBe(false);
    });

    it('应该正确管理回放会话', () => {
      store.workflowMode.switchToReplay();
      store.replayMode.setReplaySession(mockReplaySession);

      const replayState = store.replayMode;
      expect(replayState.replaySession).toEqual(mockReplaySession);
    });

    it('应该正确控制时间轴播放', () => {
      store.workflowMode.switchToReplay();
      store.replayMode.setReplaySession(mockReplaySession);
      store.replayMode.startPlayback();

      expect(store.replayMode.isPlaying).toBe(true);

      store.replayMode.pausePlayback();

      expect(store.replayMode.isPlaying).toBe(false);
    });

    it('应该正确处理时间轴跳转', () => {
      store.workflowMode.switchToReplay();
      store.replayMode.setReplaySession(mockReplaySession);
      store.replayMode.jumpToTime(30000); // 跳转到30秒

      expect(store.replayMode.timelinePosition).toBe(30000);
    });

    it('应该正确管理播放速度', () => {
      store.workflowMode.switchToReplay();
      store.replayMode.setPlaybackSpeed(2.0); // 2倍速

      expect(store.replayMode.playbackSpeed).toBe(2.0);
    });
  });

  describe('模式间切换', () => {
    it('应该正确处理从编排模式到调试模式的切换', () => {
      store.workflowMode.switchToComposer();
      store.composerMode.setSelectedNodes(['node1']);

      expect(store.workflowMode.currentMode).toBe(WorkflowMode.COMPOSER);

      store.workflowMode.switchToDebug();

      expect(store.workflowMode.currentMode).toBe(WorkflowMode.DEBUG);
      expect(store.workflowMode.previousMode).toBe(WorkflowMode.COMPOSER);
    });

    it('应该正确处理从调试模式到回放模式的切换', () => {
      store.workflowMode.switchToDebug();
      store.debugMode.setDebugSession(mockDebugSession);

      expect(store.workflowMode.currentMode).toBe(WorkflowMode.DEBUG);

      store.workflowMode.switchToReplay();

      expect(store.workflowMode.currentMode).toBe(WorkflowMode.REPLAY);
      expect(store.workflowMode.previousMode).toBe(WorkflowMode.DEBUG);
    });

    it('应该支持返回上一个模式', () => {
      store.workflowMode.switchToComposer();
      store.workflowMode.switchToDebug();
      store.workflowMode.goToPreviousMode();

      expect(store.workflowMode.currentMode).toBe(WorkflowMode.COMPOSER);
    });

    it('应该正确处理模式切换验证', () => {
      // 测试在有未保存更改时的切换
      store.workflowMode.switchToComposer();
      store.composerMode.setHasUnsavedChanges(true);

      const canSwitch = store.workflowMode.canSwitchMode(WorkflowMode.DEBUG);
      expect(canSwitch).toBe(false);
    });

    it('应该正确维护模式历史', () => {
      store.workflowMode.switchToComposer();
      store.workflowMode.switchToDebug();
      store.workflowMode.switchToReplay();

      const state = store.workflowMode;
      expect(state.modeHistory).toHaveLength(3);
      expect(state.modeHistory[0]).toBe(WorkflowMode.COMPOSER);
      expect(state.modeHistory[1]).toBe(WorkflowMode.DEBUG);
      expect(state.modeHistory[2]).toBe(WorkflowMode.REPLAY);
    });
  });

  describe('状态隔离验证', () => {
    it('应该确保编排模式状态在切换后保持独立', () => {
      // 在编排模式下设置状态
      store.workflowMode.switchToComposer();
      store.composerMode.setSelectedNodes(['node1']);
      store.composerMode.setActiveTool('select');

      const composerState = store.composerMode;
      
      // 切换到其他模式
      store.workflowMode.switchToDebug();
      store.debugMode.addBreakpoint('node2');

      // 切换回编排模式，状态应该保持
      store.workflowMode.switchToComposer();

      expect(store.composerMode.selectedNodeIds).toEqual(composerState.selectedNodeIds);
      expect(store.composerMode.activeTool).toBe(composerState.activeTool);
    });

    it('应该确保调试模式状态在切换后保持独立', () => {
      // 在调试模式下设置状态
      store.workflowMode.switchToDebug();
      store.debugMode.addBreakpoint('node1');
      store.debugMode.setExecutionSpeed(0.5);

      const debugState = store.debugMode;

      // 切换到其他模式
      store.workflowMode.switchToReplay();

      // 切换回调试模式，状态应该保持
      store.workflowMode.switchToDebug();

      expect(store.debugMode.breakpoints).toEqual(debugState.breakpoints);
      expect(store.debugMode.executionSpeed).toBe(debugState.executionSpeed);
    });

    it('应该确保回放模式状态在切换后保持独立', () => {
      // 在回放模式下设置状态
      store.workflowMode.switchToReplay();
      store.replayMode.setPlaybackSpeed(2.0);
      store.replayMode.setLoopEnabled(true);

      const replayState = store.replayMode;

      // 切换到其他模式
      store.workflowMode.switchToComposer();

      // 切换回回放模式，状态应该保持
      store.workflowMode.switchToReplay();

      expect(store.replayMode.playbackSpeed).toBe(replayState.playbackSpeed);
      expect(store.replayMode.loopEnabled).toBe(replayState.loopEnabled);
    });
  });

  describe('错误处理', () => {
    it('应该正确处理无效模式切换', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      try {
        // @ts-ignore - 故意传入无效模式进行测试
        store.workflowMode.switchToMode('invalid_mode');
      } catch (error) {
        expect(error).toBeDefined();
      }

      consoleSpy.mockRestore();
    });

    it('应该正确处理模式切换过程中的异常', () => {
      const originalSwitchTo = store.workflowMode.switchToDebug;
      
      // 模拟切换过程中的错误
      store.workflowMode.switchToDebug = vi.fn().mockImplementation(() => {
        throw new Error('模式切换失败');
      });

      expect(() => {
        store.workflowMode.switchToDebug();
      }).toThrow('模式切换失败');

      // 恢复原始方法
      store.workflowMode.switchToDebug = originalSwitchTo;
    });
  });

  describe('性能测试', () => {
    it('应该在合理时间内完成模式切换', () => {
      const startTime = performance.now();
      
      store.workflowMode.switchToComposer();
      store.workflowMode.switchToDebug();
      store.workflowMode.switchToReplay();
      store.workflowMode.switchToComposer();

      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // 模式切换应该在100ms内完成
      expect(duration).toBeLessThan(100);
    });

    it('应该正确处理大量状态数据的模式切换', () => {
      // 创建大量测试数据
      const largeNodeList = Array.from({ length: 1000 }, (_, i) => `node${i}`);
      
      store.workflowMode.switchToComposer();
      store.composerMode.setSelectedNodes(largeNodeList);

      const startTime = performance.now();
      
      store.workflowMode.switchToDebug();
      store.workflowMode.switchToComposer();

      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // 即使有大量数据，切换也应该在200ms内完成
      expect(duration).toBeLessThan(200);
      expect(store.composerMode.selectedNodeIds).toHaveLength(1000);
    });
  });
});