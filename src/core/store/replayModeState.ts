import { StateCreator } from 'zustand';

// 回放状态
export enum ReplayStatus {
  IDLE = 'idle',
  LOADING = 'loading',
  READY = 'ready',
  PLAYING = 'playing',
  PAUSED = 'paused',
  SEEKING = 'seeking',
  ERROR = 'error',
}

// 事件类型
export enum ReplayEventType {
  NODE_ENTER = 'node_enter',
  NODE_EXIT = 'node_exit',
  NODE_TICK = 'node_tick',
  BLACKBOARD_UPDATE = 'blackboard_update',
  TREE_START = 'tree_start',
  TREE_END = 'tree_end',
}

// 回放事件
export interface ReplayEvent {
  id: string;
  timestamp: number;
  type: ReplayEventType;
  nodeId: string;
  data: any;
  status?: string;
  duration?: number;
}

// 回放会话
export interface ReplaySession {
  id: string;
  name: string;
  filePath?: string;
  events: ReplayEvent[];
  totalDuration: number;
  startTime: number;
  endTime: number;
  nodeIds: string[];
  eventTypes: ReplayEventType[];
  metadata: {
    version: string;
    createdAt: number;
    source: string;
    description?: string;
  };
}

// 时间轴标记
export interface TimelineMarker {
  id: string;
  timestamp: number;
  label: string;
  type: 'bookmark' | 'error' | 'milestone';
  color?: string;
  description?: string;
}

// 回放过滤器
export interface ReplayFilter {
  eventTypes: ReplayEventType[];
  nodeIds: string[];
  timeRange: { start: number; end: number } | null;
  searchText: string;
  showOnlyErrors: boolean;
}

// 回放模式状态接口
export interface ReplayModeState {
  // 回放会话
  currentSession: ReplaySession | null;
  availableSessions: ReplaySession[];
  isLoadingSession: boolean;
  sessionError: string | null;

  // 时间轴控制
  currentTime: number;
  playbackSpeed: number;
  isPlaying: boolean;
  isLooping: boolean;
  replayStatus: ReplayStatus;

  // 时间轴标记
  timelineMarkers: TimelineMarker[];
  selectedMarker: string | null;

  // 事件管理
  visibleEvents: ReplayEvent[];
  selectedEvent: string | null;
  eventFilter: ReplayFilter;

  // 可视化设置
  showEventFlow: boolean;
  showNodeTraces: boolean;
  animationEnabled: boolean;

  // 导出设置
  exportFormat: 'json' | 'csv' | 'video';
  exportOptions: {
    includeMetadata: boolean;
    compressData: boolean;
    frameRate: number;
  };
}

// 回放模式动作接口
export interface ReplayModeActions {
  // 会话管理
  loadSession: (filePath: string) => Promise<boolean>;
  createSessionFromEvents: (events: ReplayEvent[], metadata?: any) => Promise<boolean>;
  saveSession: (session: ReplaySession) => Promise<boolean>;
  deleteSession: (sessionId: string) => void;
  clearCurrentSession: () => void;

  // 时间轴控制
  play: () => void;
  pause: () => void;
  stop: () => void;
  seekToTime: (timestamp: number) => void;
  seekToEvent: (eventId: string) => void;
  setPlaybackSpeed: (speed: number) => void;
  toggleLoop: () => void;
  stepForward: () => void;
  stepBackward: () => void;

  // 标记管理
  addMarker: (timestamp: number, label: string, type?: TimelineMarker['type']) => void;
  removeMarker: (markerId: string) => void;
  updateMarker: (markerId: string, updates: Partial<TimelineMarker>) => void;
  selectMarker: (markerId: string) => void;
  clearMarkers: () => void;

  // 事件管理
  selectEvent: (eventId: string) => void;
  filterEvents: (filter: Partial<ReplayFilter>) => void;
  clearEventFilter: () => void;
  searchEvents: (query: string) => void;

  // 可视化控制
  toggleEventFlow: () => void;
  toggleNodeTraces: () => void;
  toggleAnimation: () => void;

  // 导出功能
  exportSession: (format: 'json' | 'csv' | 'video') => void;
  exportTimeRange: (start: number, end: number, format: string) => void;
  setExportOptions: (options: Partial<ReplayModeState['exportOptions']>) => void;

  // 数据处理
  preprocessEvents: (events: ReplayEvent[]) => ReplayEvent[];
  validateSession: (session: ReplaySession) => boolean;

  // 状态管理
  saveReplayState: () => any;
  restoreReplayState: (state: any) => void;
  resetReplayState: () => void;
}

// 回放模式切片接口
export interface ReplayModeSlice extends ReplayModeState {
  replayActions: ReplayModeActions;
}

// 默认过滤器
const defaultFilter: ReplayFilter = {
  eventTypes: Object.values(ReplayEventType),
  nodeIds: [],
  timeRange: null,
  searchText: '',
  showOnlyErrors: false,
};

// 默认导出选项
const defaultExportOptions = {
  includeMetadata: true,
  compressData: false,
  frameRate: 30,
};

// 创建回放模式状态切片
export const createReplayModeSlice: StateCreator<
  ReplayModeSlice,
  [],
  [],
  ReplayModeSlice
> = (set, get) => {

  const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // 应用事件过滤器
  const applyEventFilter = () => {
    const { currentSession, eventFilter } = get();
    if (!currentSession) return;

    let filtered = currentSession.events;

    // 事件类型过滤
    if (eventFilter.eventTypes.length > 0) {
      filtered = filtered.filter(event => eventFilter.eventTypes.includes(event.type));
    }

    // 节点ID过滤
    if (eventFilter.nodeIds.length > 0) {
      filtered = filtered.filter(event => eventFilter.nodeIds.includes(event.nodeId));
    }

    // 时间范围过滤
    if (eventFilter.timeRange) {
      filtered = filtered.filter(event =>
        event.timestamp >= eventFilter.timeRange!.start &&
        event.timestamp <= eventFilter.timeRange!.end
      );
    }

    // 文本搜索
    if (eventFilter.searchText) {
      const query = eventFilter.searchText.toLowerCase();
      filtered = filtered.filter(event =>
        event.nodeId.toLowerCase().includes(query) ||
        (event.data && JSON.stringify(event.data).toLowerCase().includes(query))
      );
    }

    // 只显示错误
    if (eventFilter.showOnlyErrors) {
      filtered = filtered.filter(event =>
        event.status === 'error' || event.status === 'failure'
      );
    }

    set(state => ({ ...state, visibleEvents: filtered }));
  };


  return {
    // 初始状态
    currentSession: null,
    availableSessions: [],
    isLoadingSession: false,
    sessionError: null,

    currentTime: 0,
    playbackSpeed: 1,
    isPlaying: false,
    isLooping: false,
    replayStatus: ReplayStatus.IDLE,

    timelineMarkers: [],
    selectedMarker: null,

    visibleEvents: [],
    selectedEvent: null,
    eventFilter: defaultFilter,

    showEventFlow: true,
    showNodeTraces: true,
    animationEnabled: true,

    exportFormat: 'json',
    exportOptions: defaultExportOptions,

    // 动作
    replayActions: {
      loadSession: async (filePath: string) => {
        set(state => ({ ...state, isLoadingSession: true, sessionError: null }));

        try {
          // TODO: 实际的文件加载逻辑
          const mockSession: ReplaySession = {
            id: generateId(),
            name: `Session from ${filePath}`,
            filePath,
            events: [], // TODO: 从文件解析事件
            totalDuration: 0,
            startTime: 0,
            endTime: 0,
            nodeIds: [],
            eventTypes: [],
            metadata: {
              version: '1.0',
              createdAt: Date.now(),
              source: filePath,
            },
          };

          set(state => ({
            ...state,
            currentSession: mockSession,
            isLoadingSession: false,
            replayStatus: ReplayStatus.READY,
            availableSessions: [...state.availableSessions, mockSession],
          }));

          return true;
        } catch (error) {
          set(state => ({
            ...state,
            isLoadingSession: false,
            sessionError: `Failed to load session: ${error}`,
            replayStatus: ReplayStatus.ERROR,
          }));
          return false;
        }
      },

      createSessionFromEvents: async (events: ReplayEvent[], metadata = {}) => {
        const sortedEvents = events.sort((a, b) => a.timestamp - b.timestamp);
        const nodeIds = [...new Set(events.map(e => e.nodeId))];
        const eventTypes = [...new Set(events.map(e => e.type))];

        const session: ReplaySession = {
          id: generateId(),
          name: `Session ${Date.now()}`,
          events: sortedEvents,
          totalDuration: sortedEvents[sortedEvents.length - 1]?.timestamp - sortedEvents[0]?.timestamp || 0,
          startTime: sortedEvents[0]?.timestamp || 0,
          endTime: sortedEvents[sortedEvents.length - 1]?.timestamp || 0,
          nodeIds,
          eventTypes,
          metadata: {
            version: '1.0',
            createdAt: Date.now(),
            source: 'generated',
            ...metadata,
          },
        };

        set(state => ({
          ...state,
          currentSession: session,
          replayStatus: ReplayStatus.READY,
          availableSessions: [...state.availableSessions, session],
          visibleEvents: sortedEvents,
        }));

        return true;
      },

      saveSession: async (session: ReplaySession) => {
        // TODO: 实际的保存逻辑
        console.log('Saving session:', session.name);
        return true;
      },

      deleteSession: (sessionId: string) => {
        set(state => ({
          ...state,
          availableSessions: state.availableSessions.filter(s => s.id !== sessionId),
          currentSession: state.currentSession?.id === sessionId ? null : state.currentSession,
        }));
      },

      clearCurrentSession: () => {
        set(state => ({
          ...state,
          currentSession: null,
          replayStatus: ReplayStatus.IDLE,
          currentTime: 0,
          visibleEvents: [],
          selectedEvent: null,
        }));
      },

      play: () => {
        set(state => ({
          ...state,
          isPlaying: true,
          replayStatus: ReplayStatus.PLAYING,
        }));

        // TODO: 启动播放定时器
      },

      pause: () => {
        set(state => ({
          ...state,
          isPlaying: false,
          replayStatus: ReplayStatus.PAUSED,
        }));
      },

      stop: () => {
        set(state => ({
          ...state,
          isPlaying: false,
          currentTime: 0,
          replayStatus: ReplayStatus.READY,
        }));
      },

      seekToTime: (timestamp: number) => {
        set(state => ({
          ...state,
          currentTime: timestamp,
          replayStatus: ReplayStatus.READY,
        }));
      },

      seekToEvent: (eventId: string) => {
        const { currentSession } = get();
        if (!currentSession) return;

        const event = currentSession.events.find(e => e.id === eventId);
        if (event) {
          set(state => ({
            ...state,
            currentTime: event.timestamp,
            selectedEvent: eventId,
          }));
        }
      },

      setPlaybackSpeed: (speed: number) => {
        set(state => ({
          ...state,
          playbackSpeed: Math.max(0.1, Math.min(5, speed)),
        }));
      },

      toggleLoop: () => {
        set(state => ({ ...state, isLooping: !state.isLooping }));
      },

      stepForward: () => {
        const { currentSession, currentTime } = get();
        if (!currentSession) return;

        const nextEvent = currentSession.events.find(e => e.timestamp > currentTime);
        if (nextEvent) {
          set(state => ({ ...state, currentTime: nextEvent.timestamp }));
        }
      },

      stepBackward: () => {
        const { currentSession, currentTime } = get();
        if (!currentSession) return;

        const prevEvent = currentSession.events
          .slice()
          .reverse()
          .find(e => e.timestamp < currentTime);
        if (prevEvent) {
          set(state => ({ ...state, currentTime: prevEvent.timestamp }));
        }
      },

      addMarker: (timestamp: number, label: string, type = 'bookmark' as const) => {
        const marker: TimelineMarker = {
          id: generateId(),
          timestamp,
          label,
          type,
        };

        set(state => ({
          ...state,
          timelineMarkers: [...state.timelineMarkers, marker],
        }));
      },

      removeMarker: (markerId: string) => {
        set(state => ({
          ...state,
          timelineMarkers: state.timelineMarkers.filter(m => m.id !== markerId),
          selectedMarker: state.selectedMarker === markerId ? null : state.selectedMarker,
        }));
      },

      updateMarker: (markerId: string, updates: Partial<TimelineMarker>) => {
        set(state => ({
          ...state,
          timelineMarkers: state.timelineMarkers.map(m =>
            m.id === markerId ? { ...m, ...updates } : m
          ),
        }));
      },

      selectMarker: (markerId: string) => {
        set(state => ({ ...state, selectedMarker: markerId }));
      },

      clearMarkers: () => {
        set(state => ({ ...state, timelineMarkers: [], selectedMarker: null }));
      },

      selectEvent: (eventId: string) => {
        set(state => ({ ...state, selectedEvent: eventId }));
      },

      filterEvents: (filter: Partial<ReplayFilter>) => {
        set(state => ({
          ...state,
          eventFilter: { ...state.eventFilter, ...filter },
        }));
        applyEventFilter();
      },

      clearEventFilter: () => {
        set(state => ({ ...state, eventFilter: defaultFilter }));
        applyEventFilter();
      },

      searchEvents: (query: string) => {
        set(state => ({
          ...state,
          eventFilter: { ...state.eventFilter, searchText: query },
        }));
        applyEventFilter();
      },

      toggleEventFlow: () => {
        set(state => ({ ...state, showEventFlow: !state.showEventFlow }));
      },

      toggleNodeTraces: () => {
        set(state => ({ ...state, showNodeTraces: !state.showNodeTraces }));
      },

      toggleAnimation: () => {
        set(state => ({ ...state, animationEnabled: !state.animationEnabled }));
      },

      exportSession: (format: 'json' | 'csv' | 'video') => {
        const { currentSession } = get();
        if (!currentSession) return;

        // TODO: 实现会话导出
        console.log(`Exporting session as ${format}`);
      },

      exportTimeRange: (start: number, end: number, format: string) => {
        const { currentSession } = get();
        if (!currentSession) return;

        const rangeEvents = currentSession.events.filter(
          e => e.timestamp >= start && e.timestamp <= end
        );

        // TODO: 导出时间范围数据
        console.log(`Exporting ${rangeEvents.length} events as ${format}`);
      },

      setExportOptions: (options: Partial<ReplayModeState['exportOptions']>) => {
        set(state => ({
          ...state,
          exportOptions: { ...state.exportOptions, ...options },
        }));
      },

      preprocessEvents: (events: ReplayEvent[]) => {
        // TODO: 事件预处理逻辑
        return events.sort((a, b) => a.timestamp - b.timestamp);
      },

      validateSession: (session: ReplaySession) => {
        // TODO: 会话验证逻辑
        return session.events.length > 0 && session.totalDuration > 0;
      },

      saveReplayState: () => {
        const state = get();
        return {
          currentTime: state.currentTime,
          playbackSpeed: state.playbackSpeed,
          eventFilter: state.eventFilter,
          timelineMarkers: state.timelineMarkers,
        };
      },

      restoreReplayState: (state: any) => {
        set(currentState => ({ ...currentState, ...state }));
      },

      resetReplayState: () => {
        set({
          currentTime: 0,
          playbackSpeed: 1,
          isPlaying: false,
          isLooping: false,
          replayStatus: ReplayStatus.IDLE,
          timelineMarkers: [],
          selectedMarker: null,
          visibleEvents: [],
          selectedEvent: null,
          eventFilter: defaultFilter,
        });
      },
    }
  };
};

// 选择器钩子
export const useReplaySession = () => (state: any) => state.currentSession;
export const useReplayStatus = () => (state: any) => state.replayStatus;
export const useCurrentTime = () => (state: any) => state.currentTime;
export const useVisibleEvents = () => (state: any) => state.visibleEvents;
export const useTimelineMarkers = () => (state: any) => state.timelineMarkers;
export const useReplayActions = () => (state: any) => state.replayActions; 