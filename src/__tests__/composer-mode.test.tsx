import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { useBehaviorTreeStore } from '@/core/store/behavior-tree-store';
import { WorkflowMode } from '@/core/store/workflowModeState';
import ComposerLayout from '@/components/layout/composer-layout';
import ComposerCanvas from '@/components/layout/composer-canvas';

// 模拟ReactFlow组件以避免测试复杂性
vi.mock('reactflow', async () => {
  const actual = await vi.importActual('reactflow');
  return {
    ...actual,
    ReactFlow: ({ children, ...props }: any) => (
      <div data-testid="react-flow" {...props}>
        {children}
      </div>
    ),
    ReactFlowProvider: ({ children }: any) => <div>{children}</div>,
    Background: () => <div data-testid="background" />,
    Controls: () => <div data-testid="controls" />,
    MiniMap: () => <div data-testid="minimap" />,
    Panel: ({ children }: any) => <div data-testid="panel">{children}</div>,
    useNodesState: () => [ [], vi.fn(), vi.fn() ],
    useEdgesState: () => [ [], vi.fn(), vi.fn() ],
  };
});

// 模拟use-i18n钩子
vi.mock('@/hooks/use-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key
  })
}));

// 模拟自定义组件
vi.mock('@/components/layout/composer-toolbar', () => ({
  default: () => <div data-testid="composer-toolbar">Composer Toolbar</div>
}));

vi.mock('@/components/layout/node-library-panel', () => ({
  default: () => <div data-testid="node-library-panel">Node Library</div>
}));

vi.mock('@/components/layout/property-panel', () => ({
  default: () => <div data-testid="property-panel">Property Panel</div>
}));

vi.mock('@/components/nodes/behavior-tree-node', () => ({
  BehaviorTreeNode: () => <div data-testid="behavior-tree-node">Behavior Tree Node</div>
}));

describe('编排模式组件测试', () => {
  beforeEach(() => {
    // 重置store到初始状态
    useBehaviorTreeStore.setState(useBehaviorTreeStore.getInitialState());
    // 切换到编排模式
    useBehaviorTreeStore.getState().workflowMode.switchToComposer();
  });

  describe('编排布局组件', () => {
    it('应该正确渲染编排布局', () => {
      render(<ComposerLayout />);
      
      // 检查布局组件是否正确渲染
      expect(screen.getByTestId('composer-toolbar')).toBeInTheDocument();
      expect(screen.getByTestId('node-library-panel')).toBeInTheDocument();
      expect(screen.getByTestId('property-panel')).toBeInTheDocument();
    });

    it('应该正确显示模式标题', () => {
      render(<ComposerLayout />);
      
      // 检查是否显示编排模式标题
      expect(screen.getByText('composer:title')).toBeInTheDocument();
    });

    it('应该正确处理窗口大小变化', () => {
      render(<ComposerLayout />);
      
      // 触发窗口大小变化事件
      act(() => {
        window.dispatchEvent(new Event('resize'));
      });
      
      // 组件应该继续正常渲染
      expect(screen.getByTestId('composer-toolbar')).toBeInTheDocument();
    });
  });

  describe('编排画布组件', () => {
    it('应该正确渲染画布组件', () => {
      render(<ComposerCanvas />);
      
      // 检查画布组件是否正确渲染
      expect(screen.getByTestId('react-flow')).toBeInTheDocument();
      expect(screen.getByTestId('background')).toBeInTheDocument();
      expect(screen.getByTestId('controls')).toBeInTheDocument();
      expect(screen.getByTestId('minimap')).toBeInTheDocument();
    });

    it('应该正确显示空状态提示', () => {
      render(<ComposerCanvas />);
      
      // 检查空状态提示是否显示
      expect(screen.getByText('composer:canvas.emptyTitle')).toBeInTheDocument();
      expect(screen.getByText('composer:canvas.emptyDescription')).toBeInTheDocument();
    });

    it('应该正确处理节点添加', () => {
      render(<ComposerCanvas />);
      
      const state = useBehaviorTreeStore.getState();
      const initialNodeCount = state.nodes.length;
      
      // 模拟添加节点
      act(() => {
        state.actions.addNode({
          id: 'test-node-1',
          type: 'action',
          position: { x: 100, y: 100 },
          data: { label: 'Test Action' }
        });
      });
      
      // 检查节点是否被正确添加
      const newState = useBehaviorTreeStore.getState();
      expect(newState.nodes).toHaveLength(initialNodeCount + 1);
    });

    it('应该正确处理连接添加', () => {
      render(<ComposerCanvas />);
      
      const state = useBehaviorTreeStore.getState();
      const initialEdgeCount = state.edges.length;
      
      // 模拟添加连接
      act(() => {
        state.actions.addConnection({
          source: 'node-1',
          target: 'node-2'
        });
      });
      
      // 检查连接是否被正确添加
      const newState = useBehaviorTreeStore.getState();
      expect(newState.edges).toHaveLength(initialEdgeCount + 1);
    });
  });

  describe('编排工具测试', () => {
    it('应该正确切换活动工具', () => {
      const state = useBehaviorTreeStore.getState();
      
      // 切换到选择工具
      act(() => {
        state.composerMode.setActiveTool('select');
      });
      
      expect(state.composerMode.activeTool).toBe('select');
      
      // 切换到平移工具
      act(() => {
        state.composerMode.setActiveTool('pan');
      });
      
      expect(state.composerMode.activeTool).toBe('pan');
    });

    it('应该正确管理选中节点', () => {
      const state = useBehaviorTreeStore.getState();
      
      // 设置选中节点
      act(() => {
        state.composerMode.setSelectedNodes(['node-1', 'node-2']);
      });
      
      expect(state.composerMode.selectedNodeIds).toEqual(['node-1', 'node-2']);
    });

    it('应该正确处理撤销/重做', () => {
      const state = useBehaviorTreeStore.getState();
      
      // 添加操作到历史记录
      act(() => {
        state.composerMode.addToHistory({
          type: 'add_node',
          nodeId: 'test-node',
          data: {
            id: 'test-node',
            type: 'action',
            position: { x: 0, y: 0 },
            data: { label: 'Test' }
          }
        });
      });
      
      expect(state.composerMode.history).toHaveLength(1);
      expect(state.composerMode.historyIndex).toBe(0);
    });
  });

  describe('性能测试', () => {
    it('应该快速渲染复杂布局', () => {
      // 添加大量测试数据
      const state = useBehaviorTreeStore.getState();
      act(() => {
        // 添加100个节点
        for (let i = 0; i < 100; i++) {
          state.actions.addNode({
            id: `node-${i}`,
            type: 'action',
            position: { x: i * 10, y: i * 10 },
            data: { label: `Action ${i}` }
          });
        }
        
        // 添加99条连接
        for (let i = 0; i < 99; i++) {
          state.actions.addConnection({
            source: `node-${i}`,
            target: `node-${i + 1}`
          });
        }
      });

      const startTime = performance.now();
      render(<ComposerLayout />);
      const endTime = performance.now();
      
      // 应该在合理时间内渲染（这里设置为100ms）
      expect(endTime - startTime).toBeLessThan(100);
    });

    it('应该高效处理用户交互', () => {
      render(<ComposerCanvas />);
      
      const startTime = performance.now();
      
      // 模拟多次用户交互
      act(() => {
        for (let i = 0; i < 10; i++) {
          useBehaviorTreeStore.getState().composerMode.setActiveTool('select');
          useBehaviorTreeStore.getState().composerMode.setActiveTool('pan');
        }
      });
      
      const endTime = performance.now();
      
      // 应该在合理时间内处理（这里设置为50ms）
      expect(endTime - startTime).toBeLessThan(50);
    });
  });

  describe('边界情况测试', () => {
    it('应该正确处理空节点数据', () => {
      render(<ComposerCanvas />);
      
      // 确保组件在空数据情况下正常渲染
      expect(screen.getByTestId('react-flow')).toBeInTheDocument();
    });

    it('应该正确处理大量选中节点', () => {
      const state = useBehaviorTreeStore.getState();
      
      // 创建大量节点ID
      const largeNodeList = Array.from({ length: 1000 }, (_, i) => `node-${i}`);
      
      act(() => {
        state.composerMode.setSelectedNodes(largeNodeList);
      });
      
      expect(state.composerMode.selectedNodeIds).toHaveLength(1000);
    });

    it('应该正确处理无效工具切换', () => {
      const state = useBehaviorTreeStore.getState();
      
      // 尝试设置无效工具
      act(() => {
        // @ts-ignore - 故意传入无效值进行测试
        state.composerMode.setActiveTool('invalid-tool');
      });
      
      // 应该保持默认工具或忽略无效值
      expect(state.composerMode.activeTool).toBeDefined();
    });
  });
});