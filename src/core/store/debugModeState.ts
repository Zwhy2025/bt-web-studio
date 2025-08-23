import { StateCreator } from 'zustand';

// 调试会话状态
export enum DebugSessionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error',
}

// 执行状态
export enum ExecutionStatus {
  IDLE = 'idle',
  RUNNING = 'running',
  PAUSED = 'paused',
  STEPPING = 'stepping',
  STOPPED = 'stopped',
}

// 断点类型
export interface Breakpoint {
  id: string;
  nodeId: string;
  enabled: boolean;
  condition?: string;
  hitCount: number;
  createdAt: number;
}

// 调用栈条目
export interface CallStackEntry {
  id: string;
  nodeId: string;
  functionName: string;
  level: number;
  timestamp: number;
  parameters?: Record<string, any>;
}

// 变量监视
export interface WatchVariable {
  id: string;
  expression: string;
  value: any;
  type: string;
  isValid: boolean;
  lastUpdated: number;
}

// 日志条目
export interface LogEntry {
  id: string;
  timestamp: number;
  level: 'debug' | 'info' | 'warning' | 'error';
  message: string;
  nodeId?: string;
}

// 调试会话信息
export interface DebugSession {
  id: string;
  name: string;
  host: string;
  port: number;
  status: DebugSessionStatus;
  connectionTime?: number;
}

// 调试模式状态接口
export interface DebugModeState {
  // 会话管理
  currentSession: DebugSession | null;
  availableSessions: DebugSession[];
  isConnecting: boolean;
  connectionError: string | null;
  
  // 执行控制
  executionStatus: ExecutionStatus;
  currentExecutingNode: string | null;
  executionSpeed: number;
  
  // 断点管理
  breakpoints: Record<string, Breakpoint>;
  
  // 调用栈
  callStack: CallStackEntry[];
  selectedStackFrame: string | null;
  
  // 变量监视
  watchVariables: WatchVariable[];
  localVariables: Record<string, any>;
  
  // 日志系统
  logs: LogEntry[];
  
  // 可视化设置
  showExecutionPath: boolean;
  showNodeStatus: boolean;
  highlightActiveNode: boolean;
}

// 调试模式动作接口
export interface DebugModeActions {
  // 会话管理
  createSession: (config: { host: string; port: number; name?: string }) => Promise<boolean>;
  connectToSession: (sessionId: string) => Promise<boolean>;
  disconnectSession: () => void;
  
  // 执行控制
  startExecution: () => void;
  pauseExecution: () => void;
  stopExecution: () => void;
  stepInto: () => void;
  stepOver: () => void;
  stepOut: () => void;
  setExecutionSpeed: (speed: number) => void;
  
  // 断点管理
  addBreakpoint: (nodeId: string, condition?: string) => void;
  removeBreakpoint: (breakpointId: string) => void;
  toggleBreakpoint: (breakpointId: string) => void;
  clearAllBreakpoints: () => void;
  
  // 调用栈
  selectStackFrame: (frameId: string) => void;
  refreshCallStack: () => void;
  
  // 变量监视
  addWatchVariable: (expression: string) => void;
  removeWatchVariable: (watchId: string) => void;
  evaluateExpression: (expression: string) => Promise<any>;
  
  // 日志管理
  addLog: (entry: Omit<LogEntry, 'id' | 'timestamp'>) => void;
  clearLogs: () => void;
  
  // 可视化控制
  toggleExecutionPath: () => void;
  toggleNodeStatus: () => void;
  toggleActiveNodeHighlight: () => void;
  
  // 状态管理
  saveSessionState: () => any;
  restoreSessionState: (state: any) => void;
  resetDebugState: () => void;
}

// 调试模式切片接口
export interface DebugModeSlice extends DebugModeState {
  debugActions: DebugModeActions;
}

// 创建调试模式状态切片
export const createDebugModeSlice: StateCreator<
  DebugModeSlice,
  [],
  [],
  DebugModeSlice
> = (set, get) => {
  
  const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const addLog = (entry: Omit<LogEntry, 'id' | 'timestamp'>) => {
    const newEntry: LogEntry = {
      ...entry,
      id: generateId(),
      timestamp: Date.now(),
    };
    
    set(state => ({
      ...state,
      logs: [...state.logs, newEntry].slice(-1000) // 限制1000条
    }));
  };
  
  return {
    // 初始状态
    currentSession: null,
    availableSessions: [],
    isConnecting: false,
    connectionError: null,
    
    executionStatus: ExecutionStatus.IDLE,
    currentExecutingNode: null,
    executionSpeed: 50,
    
    breakpoints: {},
    
    callStack: [],
    selectedStackFrame: null,
    
    watchVariables: [],
    localVariables: {},
    
    logs: [],
    
    showExecutionPath: true,
    showNodeStatus: true,
    highlightActiveNode: true,
    
    // 动作
    debugActions: {
      createSession: async (config) => {
        const newSession: DebugSession = {
          id: generateId(),
          name: config.name || `Debug Session ${Date.now()}`,
          host: config.host,
          port: config.port,
          status: DebugSessionStatus.DISCONNECTED,
        };
        
        set(state => ({
          ...state,
          availableSessions: [...state.availableSessions, newSession]
        }));
        
        return true;
      },
      
      connectToSession: async (sessionId: string) => {
        const { availableSessions } = get();
        const session = availableSessions.find(s => s.id === sessionId);
        
        if (!session) return false;
        
        set(state => ({ ...state, isConnecting: true }));
        
        // 模拟连接
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        set(state => ({
          ...state,
          currentSession: { ...session, status: DebugSessionStatus.CONNECTED },
          isConnecting: false,
        }));
        
        addLog({
          level: 'info',
          message: `Connected to ${session.name}`,
        });
        
        return true;
      },
      
      disconnectSession: () => {
        set(state => ({
          ...state,
          currentSession: null,
          executionStatus: ExecutionStatus.IDLE,
        }));
      },
      
      startExecution: () => {
        set(state => ({ ...state, executionStatus: ExecutionStatus.RUNNING }));
        addLog({ level: 'info', message: 'Execution started' });
      },
      
      pauseExecution: () => {
        set(state => ({ ...state, executionStatus: ExecutionStatus.PAUSED }));
        addLog({ level: 'info', message: 'Execution paused' });
      },
      
      stopExecution: () => {
        set(state => ({
          ...state,
          executionStatus: ExecutionStatus.STOPPED,
          currentExecutingNode: null,
        }));
        addLog({ level: 'info', message: 'Execution stopped' });
      },
      
      stepInto: () => {
        set(state => ({ ...state, executionStatus: ExecutionStatus.STEPPING }));
        addLog({ level: 'debug', message: 'Step into' });
      },
      
      stepOver: () => {
        set(state => ({ ...state, executionStatus: ExecutionStatus.STEPPING }));
        addLog({ level: 'debug', message: 'Step over' });
      },
      
      stepOut: () => {
        set(state => ({ ...state, executionStatus: ExecutionStatus.STEPPING }));
        addLog({ level: 'debug', message: 'Step out' });
      },
      
      setExecutionSpeed: (speed: number) => {
        set(state => ({ ...state, executionSpeed: Math.max(1, Math.min(100, speed)) }));
      },
      
      addBreakpoint: (nodeId: string, condition?: string) => {
        const breakpoint: Breakpoint = {
          id: generateId(),
          nodeId,
          enabled: true,
          condition,
          hitCount: 0,
          createdAt: Date.now(),
        };
        
        set(state => ({
          ...state,
          breakpoints: { ...state.breakpoints, [breakpoint.id]: breakpoint },
        }));
        
        addLog({
          level: 'info',
          message: `Breakpoint added to ${nodeId}`,
          nodeId,
        });
      },
      
      removeBreakpoint: (breakpointId: string) => {
        set(state => {
          const newBreakpoints = { ...state.breakpoints };
          delete newBreakpoints[breakpointId];
          return { ...state, breakpoints: newBreakpoints };
        });
      },
      
      toggleBreakpoint: (breakpointId: string) => {
        set(state => ({
          ...state,
          breakpoints: {
            ...state.breakpoints,
            [breakpointId]: {
              ...state.breakpoints[breakpointId],
              enabled: !state.breakpoints[breakpointId].enabled,
            },
          },
        }));
      },
      
      clearAllBreakpoints: () => {
        set(state => ({ ...state, breakpoints: {} }));
        addLog({ level: 'info', message: 'All breakpoints cleared' });
      },
      
      selectStackFrame: (frameId: string) => {
        set(state => ({ ...state, selectedStackFrame: frameId }));
      },
      
      refreshCallStack: () => {
        // TODO: 实现调用栈刷新
        console.log('Refreshing call stack');
      },
      
      addWatchVariable: (expression: string) => {
        const watchVar: WatchVariable = {
          id: generateId(),
          expression,
          value: undefined,
          type: 'unknown',
          isValid: true,
          lastUpdated: Date.now(),
        };
        
        set(state => ({
          ...state,
          watchVariables: [...state.watchVariables, watchVar],
        }));
      },
      
      removeWatchVariable: (watchId: string) => {
        set(state => ({
          ...state,
          watchVariables: state.watchVariables.filter(w => w.id !== watchId),
        }));
      },
      
      evaluateExpression: async (expression: string) => {
        console.log('Evaluating:', expression);
        return `Result: ${expression}`;
      },
      
      addLog,
      
      clearLogs: () => {
        set(state => ({ ...state, logs: [] }));
      },
      
      toggleExecutionPath: () => {
        set(state => ({ ...state, showExecutionPath: !state.showExecutionPath }));
      },
      
      toggleNodeStatus: () => {
        set(state => ({ ...state, showNodeStatus: !state.showNodeStatus }));
      },
      
      toggleActiveNodeHighlight: () => {
        set(state => ({ ...state, highlightActiveNode: !state.highlightActiveNode }));
      },
      
      saveSessionState: () => {
        const state = get();
        return {
          breakpoints: state.breakpoints,
          watchVariables: state.watchVariables,
          executionSpeed: state.executionSpeed,
        };
      },
      
      restoreSessionState: (state: any) => {
        set(currentState => ({ ...currentState, ...state }));
      },
      
      resetDebugState: () => {
        set({
          executionStatus: ExecutionStatus.IDLE,
          currentExecutingNode: null,
          breakpoints: {},
          callStack: [],
          selectedStackFrame: null,
          watchVariables: [],
          localVariables: {},
          logs: [],
        });
      },
    }
  };
};

// 选择器钩子
export const useDebugSession = () => (state: any) => state.currentSession;
export const useExecutionStatus = () => (state: any) => state.executionStatus;
export const useBreakpoints = () => (state: any) => state.breakpoints;
export const useCallStack = () => (state: any) => state.callStack;
export const useWatchVariables = () => (state: any) => state.watchVariables;
export const useDebugLogs = () => (state: any) => state.logs;
export const useDebugActions = () => (state: any) => state.debugActions;