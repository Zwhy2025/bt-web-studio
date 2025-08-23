import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { useBehaviorTreeStore } from '@/core/store/behavior-tree-store';
import { WorkflowMode } from '@/core/store/workflowModeState';
import ReplayLayout from '@/components/layout/replay-layout';
import ReplayCanvas from '@/components/layout/replay-canvas';

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
vi.mock('@/components/layout/replay-toolbar', () => ({
  default: () => <div data-testid="replay-toolbar">Replay Toolbar</div>
}));

vi.mock('@/components/layout/timeline-panel', () => ({
  default: () => <div data-testid="timeline-panel">Timeline Panel</div>
}));

vi.mock('@/components/layout/event-inspector-panel', () => ({
  default: () => <div data-testid="event-inspector-panel">Event Inspector Panel</div>
}));

vi.mock('@/components/layout/analysis-panel', () => ({
  default: () => <div data-testid="analysis-panel">Analysis Panel</div>
}));

vi.mock('@/components/nodes/replay-behavior-tree-node', () => ({
  ReplayBehaviorTreeNode: () => <div data-testid="replay-behavior-tree-node">Replay Behavior Tree Node</div>
}));

describe('回放模式组件测试', () => {
  beforeEach(() => {
    // 重置store到初始状态
    useBehaviorTreeStore.setState(useBehaviorTreeStore.getInitialState());
    // 切换到回放模式
    useBehaviorTreeStore.getState().workflowMode.switchToReplay();
  });

  describe('回放布局组件', () => {
    it('应该正确渲染回放布局', () => {
      render(<ReplayLayout />);
      
      // 检查布局组件是否正确渲染
      expect(screen.getByTestId('replay-toolbar')).toBeInTheDocument();
      expect(screen.getByTestId('timeline-panel')).toBeInTheDocument();
      expect(screen.getByTestId('event-inspector-panel')).toBeInTheDocument();
      expect(screen.getByTestId('analysis-panel')).toBeInTheDocument();
    });

    it('应该正确显示模式标题', () => {
      render(<ReplayLayout />);
      
      // 检查是否显示回放模式标题
      expect(screen.getByText('replay:title')).toBeInTheDocument();
    });

    it('应该正确处理窗口大小变化', () => {
      render(<ReplayLayout />);
      
      // 触发窗口大小变化事件
      act(() => {
        window.dispatchEvent(new Event('resize'));
      });
      
      // 组件应该继续正常渲染
      expect(screen.getByTestId('replay-toolbar')).toBeInTheDocument();
    });
  });

  describe('回放画布组件', () => {
    it('应该正确渲染画布组件', () => {
      render(<ReplayCanvas />);
      
      // 检查画布组件是否正确渲染
      expect(screen.getByTestId('react-flow')).toBeInTheDocument();
      expect(screen.getByTestId('background')).toBeInTheDocument();
      expect(screen.getByTestId('controls')).toBeInTheDocument();
      expect(screen.getByTestId('minimap')).toBeInTheDocument();
    });

    it('应该正确显示空状态提示', () => {
      render(<ReplayCanvas />);
      
      // 检查空状态提示是否显示
      expect(screen.getByText('replay:canvas.emptyTitle')).toBeInTheDocument();
      expect(screen.getByText('replay:canvas.emptyDescription')).toBeInTheDocument();
    });

    it('应该正确处理回放会话设置', () => {
      const state = useBehaviorTreeStore.getState();
      
      // 设置回放会话
      const replaySession = {
        id: 'test-replay-session',
        name: 'Test Replay Session',
        duration: 60000,
        events: []
      };
      
      act(() => {
        state.replayMode.setReplaySession(replaySession);
      });
      
      expect(state.replayMode.replaySession).toEqual(replaySession);
    });

    it('应该正确处理时间轴位置变化', () => {
      const state = useBehaviorTreeStore.getState();
      
      // 设置时间轴位置
      act(() => {
        state.replayMode.jumpToTime(30000); // 跳转到30秒
      });
      
      expect(state.replayMode.timelinePosition).toBe(30000);
    });
  });

  describe('回放控制测试', () => {
    it('应该正确处理播放控制', () => {
      const state = useBehaviorTreeStore.getState();
      
      // 开始播放
      act(() => {
        state.replayMode.startPlayback();
      });
      
      expect(state.replayMode.isPlaying).toBe(true);
      
      // 暂停播放
      act(() => {
        state.replayMode.pausePlayback();
      });
      
      expect(state.replayMode.isPlaying).toBe(false);
    });

    it('应该正确处理播放速度设置', () => {
      const state = useBehaviorTreeStore.getState();
      
      // 设置播放速度
      act(() => {
        state.replayMode.setPlaybackSpeed(2.0); // 2倍速
      });
      
      expect(state.replayMode.playbackSpeed).toBe(2.0);
      
      // 设置不同的播放速度
      act(() => {
        state.replayMode.setPlaybackSpeed(0.5); // 0.5倍速
      });
      
      expect(state.replayMode.playbackSpeed).toBe(0.5);
    });

    it('应该正确处理循环播放设置', () => {
      const state = useBehaviorTreeStore.getState();
      
      // 启用循环播放
      act(() => {
        state.replayMode.setLoopEnabled(true);
      });
      
      expect(state.replayMode.loopEnabled).toBe(true);
      
      // 禁用循环播放
      act(() => {
        state.replayMode.setLoopEnabled(false);
      });
      
      expect(state.replayMode.loopEnabled).toBe(false);
    });

    it('应该正确处理可视化选项', () => {
      const state = useBehaviorTreeStore.getState();
      
      // 设置可视化选项
      act(() => {
        state.replayMode.setVisualizationOption('showExecutionPath', true);
        state.replayMode.setVisualizationOption('showNodeAnimations', false);
      });
      
      expect(state.replayMode.visualizationOptions.showExecutionPath).toBe(true);
      expect(state.replayMode.visualizationOptions.showNodeAnimations).toBe(false);
    });
  });

  describe('事件过滤测试', () => {
    it('应该正确处理事件类型过滤', () => {
      const state = useBehaviorTreeStore.getState();
      
      // 启用特定事件类型过滤
      act(() => {
        state.replayMode.setEventTypeFilter('node_enter', true);
        state.replayMode.setEventTypeFilter('node_exit', false);
      });
      
      expect(state.replayMode.eventTypeFilters.node_enter).toBe(true);
      expect(state.replayMode.eventTypeFilters.node_exit).toBe(false);
    });

    it('应该正确处理事件级别过滤', () => {
      const state = useBehaviorTreeStore.getState();
      
      // 启用特定事件级别过滤
      act(() => {
        state.replayMode.setEventLevelFilter('info', true);
        state.replayMode.setEventLevelFilter('debug', false);
      });
      
      expect(state.replayMode.eventLevelFilters.info).toBe(true);
      expect(state.replayMode.eventLevelFilters.debug).toBe(false);
    });

    it('应该正确处理搜索过滤', () => {
      const state = useBehaviorTreeStore.getState();
      
      // 设置搜索查询
      act(() => {
        state.replayMode.setSearchQuery('test search');
      });
      
      expect(state.replayMode.searchQuery).toBe('test search');
    });

    it('应该正确清除所有过滤器', () => {
      const state = useBehaviorTreeStore.getState();
      
      // 设置一些过滤器
      act(() => {
        state.replayMode.setEventTypeFilter('node_enter', true);
        state.replayMode.setEventLevelFilter('info', true);
        state.replayMode.setSearchQuery('test');
      });
      
      // 清除所有过滤器
      act(() => {
        state.replayMode.clearAllFilters();
      });
      
      expect(state.replayMode.eventTypeFilters.node_enter).toBe(false);
      expect(state.replayMode.eventLevelFilters.info).toBe(false);
      expect(state.replayMode.searchQuery).toBe('');
    });
  });

  describe('数据分析测试', () => {
    it('应该正确处理分析结果设置', () => {
      const state = useBehaviorTreeStore.getState();
      
      // 设置分析结果
      const analysisResult = {
        totalEvents: 100,
        eventTypes: { node_enter: 50, node_exit: 50 },
        performance: { avgTime: 10, successRate: 0.9 }
      };
      
      act(() => {
        state.replayMode.setAnalysisResult(analysisResult);
      });
      
      expect(state.replayMode.analysisResult).toEqual(analysisResult);
    });

    it('应该正确处理时间轴标记设置', () => {
      const state = useBehaviorTreeStore.getState();
      
      // 设置时间轴标记
      const timelineMarkers = [
        { time: 1000, label: 'Marker 1' },
        { time: 2000, label: 'Marker 2' }
      ];
      
      act(() => {
        state.replayMode.setTimelineMarkers(timelineMarkers);
      });
      
      expect(state.replayMode.timelineMarkers).toEqual(timelineMarkers);
    });
  });

  describe('性能测试', () => {
    it('应该快速渲染复杂回放布局', () => {
      // 添加大量测试数据
      const state = useBehaviorTreeStore.getState();
      act(() => {
        // 设置大量事件
        const events = Array.from({ length: 1000 }, (_, i) => ({
          id: `event-${i}`,
          timestamp: i * 100,
          nodeId: `node-${i % 100}`,
          type: 'node_enter',
          level: 'info' as const,
          message: `Event ${i}`
        }));
        
        state.replayMode.setReplaySession({
          id: 'perf-test-session',
          name: 'Performance Test Session',
          duration: 100000,
          events
        });
      });

      const startTime = performance.now();
      render(<ReplayLayout />);
      const endTime = performance.now();
      
      // 应该在合理时间内渲染（这里设置为100ms）
      expect(endTime - startTime).toBeLessThan(100);
    });

    it('应该高效处理时间轴更新', () => {
      const startTime = performance.now();
      
      // 模拟多次时间轴位置更新
      act(() => {
        for (let i = 0; i < 1000; i++) {
          useBehaviorTreeStore.getState().replayMode.jumpToTime(i * 100);
        }
      });
      
      const endTime = performance.now();
      
      // 应该在合理时间内处理（这里设置为100ms）
      expect(endTime - startTime).toBeLessThan(100);
    });
  });

  describe('边界情况测试', () => {
    it('应该正确处理空回放会话', () => {
      render(<ReplayCanvas />);
      
      // 确保组件在空回放会话情况下正常渲染
      expect(screen.getByTestId('react-flow')).toBeInTheDocument();
      expect(screen.getByText('replay:canvas.emptyTitle')).toBeInTheDocument();
    });

    it('应该正确处理无效时间轴位置', () => {
      const state = useBehaviorTreeStore.getState();
      
      // 尝试设置负数时间
      act(() => {
        state.replayMode.jumpToTime(-1000);
      });
      
      // 应该被限制在有效范围内
      expect(state.replayMode.timelinePosition).toBeGreaterThanOrEqual(0);
      
      // 尝试设置超过会话时长的时间
      act(() => {
        state.replayMode.setReplaySession({
          id: 'test-session',
          name: 'Test Session',
          duration: 60000,
          events: []
        });
        state.replayMode.jumpToTime(100000); // 超出会话时长
      });
      
      // 应该被限制在会话时长范围内
      expect(state.replayMode.timelinePosition).toBeLessThanOrEqual(60000);
    });

    it('应该正确处理大量事件过滤', () => {
      const state = useBehaviorTreeStore.getState();
      
      // 设置大量事件类型过滤
      act(() => {
        const eventTypes = ['node_enter', 'node_exit', 'node_success', 'node_failure', 'blackboard_update'];
        eventTypes.forEach(type => {
          state.replayMode.setEventTypeFilter(type, true);
        });
      });
      
      // 检查所有过滤器是否正确设置
      expect(state.replayMode.eventTypeFilters.node_enter).toBe(true);
      expect(state.replayMode.eventTypeFilters.node_exit).toBe(true);
      expect(state.replayMode.eventTypeFilters.node_success).toBe(true);
      expect(state.replayMode.eventTypeFilters.node_failure).toBe(true);
      expect(state.replayMode.eventTypeFilters.blackboard_update).toBe(true);
    });

    it('应该正确处理无效播放速度', () => {
      const state = useBehaviorTreeStore.getState();
      
      // 尝试设置负数播放速度
      act(() => {
        state.replayMode.setPlaybackSpeed(-1.0);
      });
      
      // 应该被重置为默认值或有效值
      expect(state.replayMode.playbackSpeed).toBeGreaterThan(0);
      
      // 尝试设置过大的播放速度
      act(() => {
        state.replayMode.setPlaybackSpeed(100.0);
      });
      
      // 应该被限制在合理范围内
      expect(state.replayMode.playbackSpeed).toBeLessThanOrEqual(10.0);
    });
  });
});