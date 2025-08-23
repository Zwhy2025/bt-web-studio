import { describe, it, expect, beforeEach } from 'vitest';
import { useBehaviorTreeStore } from '@/core/store/behavior-tree-store';
import { WorkflowMode } from '@/core/store/workflowModeState';

describe('行为树状态管理测试', () => {
  beforeEach(() => {
    // 重置store到初始状态
    useBehaviorTreeStore.setState(useBehaviorTreeStore.getInitialState());
  });

  describe('基础状态管理', () => {
    it('应该正确初始化状态', () => {
      const state = useBehaviorTreeStore.getState();
      
      // 检查基本状态
      expect(state.currentMode).toBe(WorkflowMode.COMPOSER);
      expect(state.nodes).toBeDefined();
      expect(state.edges).toBeDefined();
      expect(state.blackboard).toBeDefined();
      
      // 检查actions是否存在
      expect(state.actions).toBeDefined();
    });

    it('应该正确管理节点数据', () => {
      const testNode = {
        id: 'test-node-1',
        type: 'action',
        position: { x: 100, y: 100 },
        data: { label: 'Test Action' }
      };

      // 添加节点
      useBehaviorTreeStore.getState().actions.addNode(testNode);
      
      const state = useBehaviorTreeStore.getState();
      expect(state.nodes).toHaveLength(1);
      expect(state.nodes[0]).toEqual(testNode);
    });

    it('应该正确管理边数据', () => {
      const testEdge = {
        id: 'test-edge-1',
        source: 'node-1',
        target: 'node-2'
      };

      // 添加边
      useBehaviorTreeStore.getState().actions.addConnection({
        source: 'node-1',
        target: 'node-2'
      });
      
      const state = useBehaviorTreeStore.getState();
      expect(state.edges).toHaveLength(1);
      expect(state.edges[0].source).toBe('node-1');
      expect(state.edges[0].target).toBe('node-2');
    });

    it('应该正确管理黑板数据', () => {
      const testEntry = {
        key: 'test-key',
        value: 'test-value',
        type: 'string' as const,
        timestamp: Date.now()
      };

      // 添加黑板条目
      useBehaviorTreeStore.getState().actions.updateBlackboardEntry(testEntry);
      
      const state = useBehaviorTreeStore.getState();
      expect(state.blackboard[testEntry.key]).toBeDefined();
      expect(state.blackboard[testEntry.key].value).toBe(testEntry.value);
    });
  });

  describe('选择器测试', () => {
    it('应该正确返回当前会话数据', () => {
      const currentSession = useBehaviorTreeStore.getState().currentSession;
      const session = useBehaviorTreeStore.getState().actions.getCurrentSession();
      
      expect(session).toEqual(currentSession);
    });

    it('应该正确返回节点数据', () => {
      const nodes = useBehaviorTreeStore.getState().nodes;
      const selectorNodes = useBehaviorTreeStore.getState().actions.getNodes();
      
      expect(selectorNodes).toEqual(nodes);
    });

    it('应该正确返回边数据', () => {
      const edges = useBehaviorTreeStore.getState().edges;
      const selectorEdges = useBehaviorTreeStore.getState().actions.getEdges();
      
      expect(selectorEdges).toEqual(edges);
    });

    it('应该正确返回行为树数据', () => {
      const state = useBehaviorTreeStore.getState();
      const behaviorTreeData = {
        nodes: state.nodes,
        edges: state.edges
      };
      
      expect(state.actions.getBehaviorTreeData()).toEqual(behaviorTreeData);
    });
  });

  describe('性能测试', () => {
    it('应该高效处理大量节点', () => {
      const largeNodeSet = Array.from({ length: 1000 }, (_, i) => ({
        id: `node-${i}`,
        type: 'action',
        position: { x: i * 10, y: i * 10 },
        data: { label: `Action ${i}` }
      }));

      const startTime = performance.now();
      
      // 批量添加节点
      largeNodeSet.forEach(node => {
        useBehaviorTreeStore.getState().actions.addNode(node);
      });
      
      const endTime = performance.now();
      
      const state = useBehaviorTreeStore.getState();
      expect(state.nodes).toHaveLength(1000);
      
      // 应该在合理时间内完成（这里设置为100ms）
      expect(endTime - startTime).toBeLessThan(100);
    });

    it('应该高效处理大量边', () => {
      const largeEdgeSet = Array.from({ length: 999 }, (_, i) => ({
        source: `node-${i}`,
        target: `node-${i + 1}`
      }));

      const startTime = performance.now();
      
      // 批量添加边
      largeEdgeSet.forEach(connection => {
        useBehaviorTreeStore.getState().actions.addConnection(connection);
      });
      
      const endTime = performance.now();
      
      const state = useBehaviorTreeStore.getState();
      expect(state.edges).toHaveLength(999);
      
      // 应该在合理时间内完成（这里设置为100ms）
      expect(endTime - startTime).toBeLessThan(100);
    });
  });

  describe('边界情况测试', () => {
    it('应该正确处理空状态', () => {
      const state = useBehaviorTreeStore.getState();
      
      expect(state.nodes).toBeDefined();
      expect(state.edges).toBeDefined();
      expect(state.blackboard).toBeDefined();
    });

    it('应该正确处理重复节点添加', () => {
      const testNode = {
        id: 'duplicate-node',
        type: 'action',
        position: { x: 0, y: 0 },
        data: { label: 'Duplicate Test' }
      };

      // 添加相同ID的节点两次
      useBehaviorTreeStore.getState().actions.addNode(testNode);
      useBehaviorTreeStore.getState().actions.addNode(testNode);
      
      const state = useBehaviorTreeStore.getState();
      expect(state.nodes).toHaveLength(1);
    });

    it('应该正确处理无效边连接', () => {
      // 尝试连接不存在的节点
      useBehaviorTreeStore.getState().actions.addConnection({
        source: 'non-existent-source',
        target: 'non-existent-target'
      });
      
      const state = useBehaviorTreeStore.getState();
      expect(state.edges).toHaveLength(1);
    });
  });
});