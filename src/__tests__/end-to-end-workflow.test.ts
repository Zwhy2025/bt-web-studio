import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useBehaviorTreeStore } from '@/core/store/behavior-tree-store';
import { WorkflowMode } from '@/core/store/workflowModeState';

// 模拟i18n钩子
vi.mock('@/hooks/use-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key
  })
}));

describe('端到端工作流测试', () => {
  beforeEach(() => {
    // 重置store到初始状态
    useBehaviorTreeStore.setState(useBehaviorTreeStore.getInitialState());
  });

  describe('完整工作流测试', () => {
    it('应该支持从创建行为树到调试再到回放的完整流程', () => {
      const store = useBehaviorTreeStore.getState();
      
      // 1. 在编排模式下创建行为树
      store.workflowMode.switchToComposer();
      expect(store.workflowMode.currentMode).toBe(WorkflowMode.COMPOSER);
      
      // 添加节点
      store.actions.addNode({
        id: 'root-selector',
        type: 'control',
        position: { x: 0, y: 0 },
        data: { label: 'Selector' }
      });
      
      store.actions.addNode({
        id: 'condition-1',
        type: 'condition',
        position: { x: 200, y: -100 },
        data: { label: 'Condition 1' }
      });
      
      store.actions.addNode({
        id: 'action-1',
        type: 'action',
        position: { x: 200, y: 100 },
        data: { label: 'Action 1' }
      });
      
      // 添加连接
      store.actions.addConnection({
        source: 'root-selector',
        target: 'condition-1'
      });
      
      store.actions.addConnection({
        source: 'root-selector',
        target: 'action-1'
      });
      
      expect(store.nodes).toHaveLength(3);
      expect(store.edges).toHaveLength(2);
      
      // 2. 切换到调试模式进行调试
      store.workflowMode.switchToDebug();
      expect(store.workflowMode.currentMode).toBe(WorkflowMode.DEBUG);
      
      // 设置调试会话
      const debugSession = {
        id: 'debug-session-1',
        name: 'Behavior Tree Debug Session',
        status: 'running' as const,
        startTime: Date.now()
      };
      
      store.debugMode.setDebugSession(debugSession);
      expect(store.debugMode.debugSession).toEqual(debugSession);
      
      // 添加断点
      store.debugMode.addBreakpoint('condition-1');
      store.debugMode.addBreakpoint('action-1');
      
      expect(store.debugMode.breakpoints.size).toBe(2);
      
      // 模拟执行状态变化
      store.debugMode.setExecutionState('running');
      expect(store.debugMode.executionState).toBe('running');
      
      store.debugMode.pauseExecution();
      expect(store.debugMode.executionState).toBe('paused');
      
      // 3. 切换到回放模式分析执行结果
      store.workflowMode.switchToReplay();
      expect(store.workflowMode.currentMode).toBe(WorkflowMode.REPLAY);
      
      // 创建回放会话
      const replaySession = {
        id: 'replay-session-1',
        name: 'Behavior Tree Replay Session',
        duration: 10000,
        events: [
          {
            id: 'event-1',
            timestamp: 1000,
            nodeId: 'root-selector',
            type: 'node_enter',
            level: 'info',
            message: 'Selector node entered'
          },
          {
            id: 'event-2',
            timestamp: 2000,
            nodeId: 'condition-1',
            type: 'node_enter',
            level: 'info',
            message: 'Condition 1 node entered'
          },
          {
            id: 'event-3',
            timestamp: 3000,
            nodeId: 'condition-1',
            type: 'node_success',
            level: 'info',
            message: 'Condition 1 node succeeded'
          }
        ]
      };
      
      store.replayMode.setReplaySession(replaySession);
      expect(store.replayMode.replaySession).toEqual(replaySession);
      
      // 模拟播放控制
      store.replayMode.startPlayback();
      expect(store.replayMode.isPlaying).toBe(true);
      
      store.replayMode.jumpToTime(2500);
      expect(store.replayMode.timelinePosition).toBe(2500);
      
      // 4. 验证数据一致性
      // 回到编排模式，确保行为树数据保持不变
      store.workflowMode.switchToComposer();
      expect(store.nodes).toHaveLength(3);
      expect(store.edges).toHaveLength(2);
      
      // 验证节点数据完整性
      const rootNode = store.nodes.find(n => n.id === 'root-selector');
      const conditionNode = store.nodes.find(n => n.id === 'condition-1');
      const actionNode = store.nodes.find(n => n.id === 'action-1');
      
      expect(rootNode).toBeDefined();
      expect(conditionNode).toBeDefined();
      expect(actionNode).toBeDefined();
      
      // 验证连接数据完整性
      const edgeToCondition = store.edges.find(e => e.target === 'condition-1');
      const edgeToAction = store.edges.find(e => e.target === 'action-1');
      
      expect(edgeToCondition).toBeDefined();
      expect(edgeToAction).toBeDefined();
    });

    it('应该支持多次模式切换而不丢失数据', () => {
      const store = useBehaviorTreeStore.getState();
      
      // 在编排模式下创建复杂行为树
      store.workflowMode.switchToComposer();
      
      // 创建一个更复杂的行为树结构
      const nodes = [
        { id: 'root', type: 'control', position: { x: 0, y: 0 }, data: { label: 'Root' } },
        { id: 'seq-1', type: 'control', position: { x: 200, y: -100 }, data: { label: 'Sequence 1' } },
        { id: 'seq-2', type: 'control', position: { x: 200, y: 100 }, data: { label: 'Sequence 2' } },
        { id: 'cond-1', type: 'condition', position: { x: 400, y: -150 }, data: { label: 'Condition 1' } },
        { id: 'cond-2', type: 'condition', position: { x: 400, y: -50 }, data: { label: 'Condition 2' } },
        { id: 'act-1', type: 'action', position: { x: 400, y: 50 }, data: { label: 'Action 1' } },
        { id: 'act-2', type: 'action', position: { x: 400, y: 150 }, data: { label: 'Action 2' } }
      ];
      
      nodes.forEach(node => {
        store.actions.addNode(node);
      });
      
      // 添加连接
      const connections = [
        { source: 'root', target: 'seq-1' },
        { source: 'root', target: 'seq-2' },
        { source: 'seq-1', target: 'cond-1' },
        { source: 'seq-1', target: 'cond-2' },
        { source: 'seq-2', target: 'act-1' },
        { source: 'seq-2', target: 'act-2' }
      ];
      
      connections.forEach(conn => {
        store.actions.addConnection(conn);
      });
      
      expect(store.nodes).toHaveLength(7);
      expect(store.edges).toHaveLength(6);
      
      // 多次模式切换
      for (let i = 0; i < 5; i++) {
        store.workflowMode.switchToDebug();
        store.debugMode.addBreakpoint(`cond-${i % 2 + 1}`);
        store.debugMode.setExecutionState('running');
        
        store.workflowMode.switchToReplay();
        store.replayMode.setPlaybackSpeed(1.5);
        store.replayMode.jumpToTime(5000);
        
        store.workflowMode.switchToComposer();
      }
      
      // 验证数据完整性
      expect(store.nodes).toHaveLength(7);
      expect(store.edges).toHaveLength(6);
      
      // 验证所有节点都存在
      nodes.forEach(node => {
        const foundNode = store.nodes.find(n => n.id === node.id);
        expect(foundNode).toBeDefined();
        expect(foundNode?.data.label).toBe(node.data.label);
      });
      
      // 验证所有连接都存在
      connections.forEach(conn => {
        const foundEdge = store.edges.find(e => e.source === conn.source && e.target === conn.target);
        expect(foundEdge).toBeDefined();
      });
    });

    it('应该正确处理并发操作', () => {
      const store = useBehaviorTreeStore.getState();
      
      // 在编排模式下进行操作
      store.workflowMode.switchToComposer();
      
      // 模拟并发添加节点
      const addNodesConcurrently = () => {
        for (let i = 0; i < 10; i++) {
          store.actions.addNode({
            id: `concurrent-node-${i}`,
            type: 'action',
            position: { x: i * 50, y: 0 },
            data: { label: `Concurrent Action ${i}` }
          });
        }
      };
      
      // 模拟并发添加连接
      const addConnectionsConcurrently = () => {
        for (let i = 0; i < 9; i++) {
          store.actions.addConnection({
            source: `concurrent-node-${i}`,
            target: `concurrent-node-${i + 1}`
          });
        }
      };
      
      // 同时执行多个操作
      addNodesConcurrently();
      addConnectionsConcurrently();
      
      expect(store.nodes).toHaveLength(10);
      expect(store.edges).toHaveLength(9);
      
      // 切换模式并验证数据
      store.workflowMode.switchToDebug();
      store.debugMode.addBreakpoint('concurrent-node-5');
      
      store.workflowMode.switchToReplay();
      store.replayMode.setReplaySession({
        id: 'concurrent-test-session',
        name: 'Concurrent Test Session',
        duration: 5000,
        events: []
      });
      
      store.workflowMode.switchToComposer();
      
      // 验证数据完整性
      expect(store.nodes).toHaveLength(10);
      expect(store.edges).toHaveLength(9);
    });
  });

  describe('错误恢复测试', () => {
    it('应该在错误发生后正确恢复状态', () => {
      const store = useBehaviorTreeStore.getState();
      
      // 在编排模式下创建数据
      store.workflowMode.switchToComposer();
      store.actions.addNode({
        id: 'recovery-test-node',
        type: 'action',
        position: { x: 0, y: 0 },
        data: { label: 'Recovery Test' }
      });
      
      // 模拟错误发生
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      try {
        // 故意触发一个错误
        // @ts-ignore - 故意传入无效数据
        store.actions.addNode(null);
      } catch (error) {
        // 错误应该被捕获
      }
      
      // 确保原始数据仍然存在
      expect(store.nodes).toHaveLength(1);
      const node = store.nodes[0];
      expect(node.id).toBe('recovery-test-node');
      
      // 继续正常操作
      store.actions.addNode({
        id: 'recovery-test-node-2',
        type: 'condition',
        position: { x: 200, y: 0 },
        data: { label: 'Recovery Test 2' }
      });
      
      expect(store.nodes).toHaveLength(2);
      
      consoleErrorSpy.mockRestore();
    });

    it('应该正确处理模式切换期间的错误', () => {
      const store = useBehaviorTreeStore.getState();
      
      // 创建一些数据
      store.workflowMode.switchToComposer();
      store.actions.addNode({
        id: 'switch-error-test-node',
        type: 'action',
        position: { x: 0, y: 0 },
        data: { label: 'Switch Error Test' }
      });
      
      // 模拟模式切换时的错误
      const originalSwitch = store.workflowMode.switchToDebug;
      store.workflowMode.switchToDebug = vi.fn().mockImplementation(() => {
        throw new Error('模拟切换错误');
      });
      
      // 尝试切换模式
      try {
        store.workflowMode.switchToDebug();
      } catch (error) {
        // 错误应该被捕获
      }
      
      // 恢复原始方法
      store.workflowMode.switchToDebug = originalSwitch;
      
      // 数据应该保持完整
      expect(store.nodes).toHaveLength(1);
      expect(store.nodes[0].id).toBe('switch-error-test-node');
      
      // 应该能够正常切换模式
      store.workflowMode.switchToDebug();
      expect(store.workflowMode.currentMode).toBe(WorkflowMode.DEBUG);
    });
  });

  describe('性能基准测试', () => {
    it('应该在合理时间内完成复杂工作流', () => {
      const startTime = performance.now();
      const store = useBehaviorTreeStore.getState();
      
      // 创建大型行为树
      store.workflowMode.switchToComposer();
      
      // 添加100个节点
      for (let i = 0; i < 100; i++) {
        store.actions.addNode({
          id: `perf-node-${i}`,
          type: i % 3 === 0 ? 'control' : i % 3 === 1 ? 'condition' : 'action',
          position: { x: (i % 10) * 100, y: Math.floor(i / 10) * 100 },
          data: { label: `Performance Node ${i}` }
        });
      }
      
      // 添加连接
      for (let i = 0; i < 99; i++) {
        store.actions.addConnection({
          source: `perf-node-${i}`,
          target: `perf-node-${i + 1}`
        });
      }
      
      // 多次模式切换
      for (let i = 0; i < 10; i++) {
        store.workflowMode.switchToDebug();
        store.debugMode.addBreakpoint(`perf-node-${i * 10}`);
        
        store.workflowMode.switchToReplay();
        store.replayMode.jumpToTime(i * 1000);
        
        store.workflowMode.switchToComposer();
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // 整个工作流应该在1秒内完成
      expect(duration).toBeLessThan(1000);
      
      // 验证数据完整性
      expect(store.nodes).toHaveLength(100);
      expect(store.edges).toHaveLength(99);
    });

    it('应该高效处理大量并发操作', () => {
      const store = useBehaviorTreeStore.getState();
      store.workflowMode.switchToComposer();
      
      const startTime = performance.now();
      
      // 并发执行大量操作
      const operations = [];
      for (let i = 0; i < 1000; i++) {
        operations.push(() => {
          store.actions.addNode({
            id: `concurrent-perf-${i}`,
            type: 'action',
            position: { x: i, y: 0 },
            data: { label: `Concurrent ${i}` }
          });
        });
      }
      
      // 执行所有操作
      operations.forEach(op => op());
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // 应该在合理时间内完成
      expect(duration).toBeLessThan(500);
      expect(store.nodes).toHaveLength(1000);
    });
  });
});