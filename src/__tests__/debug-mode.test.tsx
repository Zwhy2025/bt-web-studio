import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { useBehaviorTreeStore } from '@/core/store/behavior-tree-store';
import { WorkflowMode } from '@/core/store/workflowModeState';
import DebugLayout from '@/components/layout/debug-layout';
import DebugCanvas from '@/components/layout/debug-canvas';

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
vi.mock('@/components/layout/debug-toolbar', () => ({
  default: () => <div data-testid="debug-toolbar">Debug Toolbar</div>
}));

vi.mock('@/components/layout/breakpoint-panel', () => ({
  default: () => <div data-testid="breakpoint-panel">Breakpoint Panel</div>
}));

vi.mock('@/components/layout/monitoring-panel', () => ({
  default: () => <div data-testid="monitoring-panel">Monitoring Panel</div>
}));

vi.mock('@/components/nodes/debug-behavior-tree-node', () => ({
  DebugBehaviorTreeNode: () => <div data-testid="debug-behavior-tree-node">Debug Behavior Tree Node</div>
}));

describe('调试模式组件测试', () => {
  beforeEach(() => {
    // 重置store到初始状态
    useBehaviorTreeStore.setState(useBehaviorTreeStore.getInitialState());
    // 切换到调试模式
    useBehaviorTreeStore.getState().workflowMode.switchToDebug();
  });

  describe('调试布局组件', () => {
    it('应该正确渲染调试布局', () => {
      render(<DebugLayout />);
      
      // 检查布局组件是否正确渲染
      expect(screen.getByTestId('debug-toolbar')).toBeInTheDocument();
      expect(screen.getByTestId('breakpoint-panel')).toBeInTheDocument();
      expect(screen.getByTestId('monitoring-panel')).toBeInTheDocument();
    });

    it('应该正确显示模式标题', () => {
      render(<DebugLayout />);
      
      // 检查是否显示调试模式标题
      expect(screen.getByText('debug:title')).toBeInTheDocument();
    });

    it('应该正确处理窗口大小变化', () => {
      render(<DebugLayout />);
      
      // 触发窗口大小变化事件
      act(() => {
        window.dispatchEvent(new Event('resize'));
      });
      
      // 组件应该继续正常渲染
      expect(screen.getByTestId('debug-toolbar')).toBeInTheDocument();
    });
  });

  describe('调试画布组件', () => {
    it('应该正确渲染画布组件', () => {
      render(<DebugCanvas />);
      
      // 检查画布组件是否正确渲染
      expect(screen.getByTestId('react-flow')).toBeInTheDocument();
      expect(screen.getByTestId('background')).toBeInTheDocument();
      expect(screen.getByTestId('controls')).toBeInTheDocument();
      expect(screen.getByTestId('minimap')).toBeInTheDocument();
    });

    it('应该正确显示未连接状态提示', () => {
      render(<DebugCanvas />);
      
      // 检查未连接状态提示是否显示
      expect(screen.getByText('debug:canvas.notConnected')).toBeInTheDocument();
      expect(screen.getByText('debug:canvas.notConnectedDesc')).toBeInTheDocument();
    });

    it('应该正确处理调试会话设置', () => {
      const state = useBehaviorTreeStore.getState();
      
      // 设置调试会话
      const debugSession = {
        id: 'test-session',
        name: 'Test Debug Session',
        status: 'running' as const,
        startTime: Date.now()
      };
      
      act(() => {
        state.debugMode.setDebugSession(debugSession);
      });
      
      expect(state.debugMode.debugSession).toEqual(debugSession);
    });

    it('应该正确处理执行状态变化', () => {
      const state = useBehaviorTreeStore.getState();
      
      // 设置执行状态为运行
      act(() => {
        state.debugMode.setExecutionState('running');
      });
      
      expect(state.debugMode.executionState).toBe('running');
      
      // 设置执行状态为暂停
      act(() => {
        state.debugMode.setExecutionState('paused');
      });
      
      expect(state.debugMode.executionState).toBe('paused');
    });
  });

  describe('调试功能测试', () => {
    it('应该正确管理断点', () => {
      const state = useBehaviorTreeStore.getState();
      
      // 添加断点
      act(() => {
        state.debugMode.addBreakpoint('node-1');
        state.debugMode.addBreakpoint('node-2');
      });
      
      expect(state.debugMode.breakpoints.size).toBe(2);
      expect(state.debugMode.breakpoints.has('node-1')).toBe(true);
      expect(state.debugMode.breakpoints.has('node-2')).toBe(true);
      
      // 移除断点
      act(() => {
        state.debugMode.removeBreakpoint('node-1');
      });
      
      expect(state.debugMode.breakpoints.size).toBe(1);
      expect(state.debugMode.breakpoints.has('node-1')).toBe(false);
    });

    it('应该正确管理监视变量', () => {
      const state = useBehaviorTreeStore.getState();
      
      // 添加监视变量
      act(() => {
        state.debugMode.addWatchVariable('testVar1');
        state.debugMode.addWatchVariable('testVar2');
      });
      
      expect(state.debugMode.watchVariables).toHaveLength(2);
      expect(state.debugMode.watchVariables[0].expression).toBe('testVar1');
      expect(state.debugMode.watchVariables[1].expression).toBe('testVar2');
      
      // 移除监视变量
      act(() => {
        state.debugMode.removeWatchVariable(0);
      });
      
      expect(state.debugMode.watchVariables).toHaveLength(1);
      expect(state.debugMode.watchVariables[0].expression).toBe('testVar2');
    });

    it('应该正确管理调用栈', () => {
      const state = useBehaviorTreeStore.getState();
      
      // 设置调用栈
      const callStack = [
        { nodeId: 'node-1', functionName: 'function1' },
        { nodeId: 'node-2', functionName: 'function2' }
      ];
      
      act(() => {
        state.debugMode.setCallStack(callStack);
      });
      
      expect(state.debugMode.callStack).toEqual(callStack);
    });

    it('应该正确处理调试日志', () => {
      const state = useBehaviorTreeStore.getState();
      
      // 添加日志条目
      const logEntry = {
        id: 'log-1',
        timestamp: Date.now(),
        level: 'info' as const,
        message: 'Test log message'
      };
      
      act(() => {
        state.debugMode.addLogEntry(logEntry);
      });
      
      expect(state.debugMode.logs).toHaveLength(1);
      expect(state.debugMode.logs[0]).toEqual(logEntry);
    });
  });

  describe('执行控制测试', () => {
    it('应该正确处理开始执行', () => {
      const state = useBehaviorTreeStore.getState();
      
      act(() => {
        state.debugMode.startExecution();
      });
      
      expect(state.debugMode.executionState).toBe('running');
    });

    it('应该正确处理暂停执行', () => {
      const state = useBehaviorTreeStore.getState();
      
      // 先开始执行
      act(() => {
        state.debugMode.startExecution();
      });
      
      // 然后暂停执行
      act(() => {
        state.debugMode.pauseExecution();
      });
      
      expect(state.debugMode.executionState).toBe('paused');
    });

    it('应该正确处理停止执行', () => {
      const state = useBehaviorTreeStore.getState();
      
      // 先开始执行
      act(() => {
        state.debugMode.startExecution();
      });
      
      // 然后停止执行
      act(() => {
        state.debugMode.stopExecution();
      });
      
      expect(state.debugMode.executionState).toBe('stopped');
    });

    it('应该正确处理单步执行', () => {
      const state = useBehaviorTreeStore.getState();
      
      act(() => {
        state.debugMode.stepExecution();
      });
      
      expect(state.debugMode.executionState).toBe('stepping');
    });
  });

  describe('性能测试', () => {
    it('应该快速渲染复杂调试布局', () => {
      // 添加大量测试数据
      const state = useBehaviorTreeStore.getState();
      act(() => {
        // 添加大量断点
        for (let i = 0; i < 100; i++) {
          state.debugMode.addBreakpoint(`node-${i}`);
        }
        
        // 添加大量监视变量
        for (let i = 0; i < 50; i++) {
          state.debugMode.addWatchVariable(`var-${i}`);
        }
      });

      const startTime = performance.now();
      render(<DebugLayout />);
      const endTime = performance.now();
      
      // 应该在合理时间内渲染（这里设置为100ms）
      expect(endTime - startTime).toBeLessThan(100);
    });

    it('应该高效处理调试状态更新', () => {
      const startTime = performance.now();
      
      // 模拟多次调试状态更新
      act(() => {
        for (let i = 0; i < 100; i++) {
          useBehaviorTreeStore.getState().debugMode.setExecutionState('running');
          useBehaviorTreeStore.getState().debugMode.setExecutionState('paused');
        }
      });
      
      const endTime = performance.now();
      
      // 应该在合理时间内处理（这里设置为100ms）
      expect(endTime - startTime).toBeLessThan(100);
    });
  });

  describe('边界情况测试', () => {
    it('应该正确处理空调试会话', () => {
      render(<DebugCanvas />);
      
      // 确保组件在空调试会话情况下正常渲染
      expect(screen.getByTestId('react-flow')).toBeInTheDocument();
      expect(screen.getByText('debug:canvas.notConnected')).toBeInTheDocument();
    });

    it('应该正确处理大量断点', () => {
      const state = useBehaviorTreeStore.getState();
      
      // 添加大量断点
      act(() => {
        for (let i = 0; i < 1000; i++) {
          state.debugMode.addBreakpoint(`node-${i}`);
        }
      });
      
      expect(state.debugMode.breakpoints.size).toBe(1000);
    });

    it('应该正确处理重复断点添加', () => {
      const state = useBehaviorTreeStore.getState();
      
      // 添加相同节点的断点两次
      act(() => {
        state.debugMode.addBreakpoint('duplicate-node');
        state.debugMode.addBreakpoint('duplicate-node');
      });
      
      // 应该只保留一个断点
      expect(state.debugMode.breakpoints.size).toBe(1);
      expect(state.debugMode.breakpoints.has('duplicate-node')).toBe(true);
    });

    it('应该正确处理无效执行状态', () => {
      const state = useBehaviorTreeStore.getState();
      
      // 尝试设置无效执行状态
      act(() => {
        // @ts-ignore - 故意传入无效值进行测试
        state.debugMode.setExecutionState('invalid-state');
      });
      
      // 应该保持有效状态或忽略无效值
      expect(['idle', 'running', 'paused', 'stopped', 'stepping']).toContain(
        state.debugMode.executionState
      );
    });
  });
});