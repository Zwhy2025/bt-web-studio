import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { Node, Edge } from 'reactflow'
// 注释掉之前的 mock-debugger-client 导入
// import { startMockDebugSession, stopMockDebugSession } from '@/lib/mock-debugger-client' 
import { MockWebSocketClient, DebuggerMessage } from '@/lib/mock-websocket-client' // 新增导入
import { simulateSubtreeExecution } from '@/lib/subtree-mock-generator' // 导入子树模拟功能

// 节点状态枚举
export enum NodeStatus {
  IDLE = 'idle',
  RUNNING = 'running', 
  SUCCESS = 'success',
  FAILURE = 'failure',
}

// 黑板数据类型
export interface BlackboardEntry {
  key: string
  value: any
  type: 'string' | 'number' | 'boolean' | 'object'
  timestamp: number
  source?: string // 哪个节点设置的
}

// 扩展的节点类型
export interface BehaviorTreeNode extends Node {
  data: {
    label: string
    status?: NodeStatus
    parameters?: Record<string, any>
    breakpoint?: boolean
    executionCount?: number
    lastExecutionTime?: number
    description?: string
  }
}

// 扩展的边类型
export interface BehaviorTreeEdge extends Omit<Edge, 'data'> {
  data?: {
    executionCount?: number
    lastExecutionTime?: number
  }
}

// 调试状态
export enum DebugState {
  DISCONNECTED = 'disconnected', // 新增：未连接到调试器
  CONNECTING = 'connecting',     // 新增：正在连接到调试器
  CONNECTED = 'connected',       // 新增：已连接到调试器
  STOPPED = 'stopped',
  RUNNING = 'running',
  PAUSED = 'paused',
  STEPPING = 'stepping',
}

// 执行事件
export interface ExecutionEvent {
  id: string
  timestamp: number
  nodeId: string
  type: 'enter' | 'exit' | 'tick'
  status: NodeStatus
  blackboardSnapshot?: Record<string, any>
  duration?: number
}

// 项目会话
export interface ProjectSession {
  id: string
  name: string
  nodes: BehaviorTreeNode[]
  edges: BehaviorTreeEdge[]
  blackboard: Record<string, BlackboardEntry>
  createdAt: number
  modifiedAt: number
  filePath?: string
}

// 状态接口
interface BehaviorTreeState {
  // 当前项目会话
  currentSession: ProjectSession | null
  sessions: ProjectSession[]
  activeSessionId: string | null
  
  // 画布状态
  nodes: BehaviorTreeNode[]
  edges: BehaviorTreeEdge[]
  selectedNodeIds: string[]
  selectedEdgeIds: string[]
  
  // 黑板状态
  blackboard: Record<string, BlackboardEntry>
  blackboardHistory: Record<string, BlackboardEntry[]>
  
  // 调试状态
  debugState: DebugState
  isDebuggerConnected: boolean // 新增：调试器是否已连接
  debuggerConnectionError: string | null // 新增：调试器连接错误信息
  breakpoints: Set<string>
  currentExecutingNode: string | null
  executionEvents: ExecutionEvent[]
  executionSpeed: number // 1.0 = 正常速度
  
  // 时间轴状态
  timelinePosition: number
  timelineRange: [number, number]
  isReplaying: boolean
  
  // UI 状态
  showMinimap: boolean
  showGrid: boolean
  snapToGrid: boolean
  panelSizes: Record<string, number>
  
  // 新增：WebSocket 客户端实例
  debuggerClient: MockWebSocketClient | null
  
  // 操作方法
  actions: {
    // 会话管理
    createSession: (name: string) => string
    switchSession: (sessionId: string) => void
    updateSession: (sessionId: string, updates: Partial<ProjectSession>) => void
    deleteSession: (sessionId: string) => void
    
    // 节点操作
    addNode: (node: BehaviorTreeNode) => void
    updateNode: (nodeId: string, updates: Partial<BehaviorTreeNode>) => void
    deleteNode: (nodeId: string) => void
    setNodeStatus: (nodeId: string, status: NodeStatus) => void
    toggleBreakpoint: (nodeId: string) => void
    
    // 边操作
    addEdge: (edge: BehaviorTreeEdge) => void
    updateEdge: (edgeId: string, updates: Partial<BehaviorTreeEdge>) => void
    deleteEdge: (edgeId: string) => void
    
    // 选择操作
    setSelectedNodes: (nodeIds: string[]) => void
    setSelectedEdges: (edgeIds: string[]) => void
    clearSelection: () => void
    
    // 黑板操作
    setBlackboardValue: (key: string, value: any, type: BlackboardEntry['type'], source?: string) => void
    deleteBlackboardKey: (key: string) => void
    clearBlackboard: () => void
    
    // 调试操作
    startExecution: () => void
    pauseExecution: () => void
    stopExecution: () => void
    stepExecution: () => void
    setExecutionSpeed: (speed: number) => void
    // 新增：模拟导入的子树执行
    simulateSubtree: () => void
    
    // 事件记录
    addExecutionEvent: (event: Omit<ExecutionEvent, 'id' | 'timestamp'>) => void
    clearExecutionEvents: () => void
    
    // 时间轴操作
    setTimelinePosition: (position: number) => void
    setTimelineRange: (range: [number, number]) => void
    toggleReplay: () => void
    
    // UI 操作
    toggleMinimap: () => void
    toggleGrid: () => void
    toggleSnapToGrid: () => void
    setPanelSize: (panelId: string, size: number) => void
    
    // 批量操作
    importData: (nodes: BehaviorTreeNode[], edges: BehaviorTreeEdge[]) => void
    exportData: () => { nodes: BehaviorTreeNode[], edges: BehaviorTreeEdge[] }
    resetToDefaults: () => void
  }
}

// 默认会话
const createDefaultSession = (): ProjectSession => ({
  id: `session-${Date.now()}`,
  name: '新建项目',
  nodes: [{
    id: 'root',
    position: { x: 100, y: 80 },
    data: { 
      label: 'Root (Sequence)',
      status: NodeStatus.IDLE,
      parameters: {},
      executionCount: 0,
    },
    type: 'control-sequence',
  }],
  edges: [],
  blackboard: {},
  createdAt: Date.now(),
  modifiedAt: Date.now(),
})

// 创建状态存储
export const useBehaviorTreeStore = create<BehaviorTreeState>()(
  subscribeWithSelector((set, get) => {
    const defaultSession = createDefaultSession()
    
    return {
      // 初始状态
      currentSession: defaultSession,
      sessions: [defaultSession],
      activeSessionId: defaultSession.id,
      
      nodes: defaultSession.nodes,
      edges: defaultSession.edges,
      selectedNodeIds: [],
      selectedEdgeIds: [],
      
      blackboard: {},
      blackboardHistory: {},
      
      debugState: DebugState.DISCONNECTED, // 初始状态为未连接
      isDebuggerConnected: false,
      debuggerConnectionError: null,
      breakpoints: new Set(),
      currentExecutingNode: null,
      executionEvents: [],
      executionSpeed: 1.0,
      
      timelinePosition: 0,
      timelineRange: [0, 100],
      isReplaying: false,
      
      showMinimap: true,
      showGrid: true,
      snapToGrid: true,
      panelSizes: {
        leftPanel: 18,
        rightPanel: 18,
        bottomPanel: 200,
      },
      
      debuggerClient: null, // 初始化为 null
      
      actions: {
        // 会话管理
        createSession: (name: string) => {
          const newSession = createDefaultSession()
          newSession.name = name
          
          set(state => ({
            sessions: [...state.sessions, newSession],
            currentSession: newSession,
            activeSessionId: newSession.id,
            nodes: newSession.nodes,
            edges: newSession.edges,
            blackboard: newSession.blackboard,
          }))
          
          return newSession.id
        },
        
        switchSession: (sessionId: string) => {
          const state = get()
          const session = state.sessions.find(s => s.id === sessionId)
          if (session) {
            // 在切换前保存当前会话的状态
            if (state.currentSession) {
              const updatedSessions = state.sessions.map(s => 
                s.id === state.currentSession?.id 
                  ? { 
                      ...s, 
                      nodes: state.nodes,
                      edges: state.edges,
                      blackboard: state.blackboard,
                      modifiedAt: Date.now()
                    }
                  : s
              )
              set({ sessions: updatedSessions })
            }
            
            // 切换到新会话
            // 通知 MockWebSocketClient 更新节点列表
            const newState: Partial<BehaviorTreeState> = {
              currentSession: session,
              activeSessionId: sessionId,
              nodes: session.nodes,
              edges: session.edges,
              blackboard: session.blackboard,
              selectedNodeIds: [],
              selectedEdgeIds: [],
            };
            
            // 如果已连接，更新调试器客户端的节点列表
            if (state.isDebuggerConnected && state.debuggerClient) {
              state.debuggerClient.setNodes(session.nodes.map(n => n.id));
            }
            
            set(newState);
          }
        },
        
        updateSession: (sessionId: string, updates: Partial<ProjectSession>) => {
          set(state => ({
            sessions: state.sessions.map(s => 
              s.id === sessionId 
                ? { ...s, ...updates, modifiedAt: Date.now() }
                : s
            ),
            currentSession: state.currentSession?.id === sessionId
              ? { ...state.currentSession, ...updates, modifiedAt: Date.now() }
              : state.currentSession,
          }))
        },
        
        deleteSession: (sessionId: string) => {
          const state = get()
          const remainingSessions = state.sessions.filter(s => s.id !== sessionId)
          
          if (remainingSessions.length === 0) {
            // 如果删除了所有会话，创建一个新的默认会话
            const newSession = createDefaultSession()
            set({
              sessions: [newSession],
              currentSession: newSession,
              activeSessionId: newSession.id,
              nodes: newSession.nodes,
              edges: newSession.edges,
              blackboard: newSession.blackboard,
            })
          } else {
            const newActiveSession = state.activeSessionId === sessionId 
              ? remainingSessions[0] 
              : state.currentSession
            
            set({
              sessions: remainingSessions,
              currentSession: newActiveSession,
              activeSessionId: newActiveSession?.id || null,
              nodes: newActiveSession?.nodes || [],
              edges: newActiveSession?.edges || [],
              blackboard: newActiveSession?.blackboard || {},
            })
          }
        },
        
        // 节点操作
        addNode: (node: BehaviorTreeNode) => {
          set(state => ({
            nodes: [...state.nodes, node],
          }))
        },
        
        updateNode: (nodeId: string, updates: Partial<BehaviorTreeNode>) => {
          set(state => ({
            nodes: state.nodes.map(n => 
              n.id === nodeId ? { ...n, ...updates } : n
            ),
          }))
        },
        
        deleteNode: (nodeId: string) => {
          set(state => ({
            nodes: state.nodes.filter(n => n.id !== nodeId),
            edges: state.edges.filter(e => e.source !== nodeId && e.target !== nodeId),
            selectedNodeIds: state.selectedNodeIds.filter(id => id !== nodeId),
          }))
        },
        
        setNodeStatus: (nodeId: string, status: NodeStatus) => {
          set(state => ({
            nodes: state.nodes.map(n => 
              n.id === nodeId 
                ? { 
                    ...n, 
                    data: { 
                      ...n.data, 
                      status,
                      lastExecutionTime: Date.now(),
                      executionCount: (n.data.executionCount || 0) + 1
                    }
                  }
                : n
            ),
          }))
        },
        
        // --- 断点管理 ---
        toggleBreakpoint: (nodeId: string) => {
          set(state => {
            const newBreakpoints = new Set(state.breakpoints)
            const wasBreakpointSet = newBreakpoints.has(nodeId);
            
            if (wasBreakpointSet) {
              newBreakpoints.delete(nodeId)
            } else {
              newBreakpoints.add(nodeId)
            }
            
            // 如果已连接到调试器，发送消息
            if (state.isDebuggerConnected && state.debuggerClient) {
              const command = wasBreakpointSet ? 'clear_breakpoint' : 'set_breakpoint';
              state.debuggerClient.send({ 
                type: command, 
                payload: { nodeId } 
              });
            }
            
            return {
              breakpoints: newBreakpoints,
              nodes: state.nodes.map(n => 
                n.id === nodeId 
                  ? { ...n, data: { ...n.data, breakpoint: !wasBreakpointSet } }
                  : n
              ),
            }
          })
        },

        // --- 发送调试命令 ---
        sendDebuggerCommand: (command: string, payload?: any) => {
          const state = get();
          if (state.isDebuggerConnected && state.debuggerClient) {
            console.log("Sending command to debugger:", command, payload);
            // 通过 WebSocket 客户端发送命令
            state.debuggerClient.send({ type: command, payload });
          } else {
            console.warn("Cannot send command, debugger not connected");
          }
        },
        
        // 边操作
        addEdge: (edge: BehaviorTreeEdge) => {
          set(state => ({
            edges: [...state.edges, edge],
          }))
        },
        
        updateEdge: (edgeId: string, updates: Partial<BehaviorTreeEdge>) => {
          set(state => ({
            edges: state.edges.map(e => 
              e.id === edgeId ? { ...e, ...updates } : e
            ),
          }))
        },
        
        deleteEdge: (edgeId: string) => {
          set(state => ({
            edges: state.edges.filter(e => e.id !== edgeId),
            selectedEdgeIds: state.selectedEdgeIds.filter(id => id !== edgeId),
          }))
        },
        
        // 选择操作
        setSelectedNodes: (nodeIds: string[]) => {
          set({ selectedNodeIds: nodeIds })
        },
        
        setSelectedEdges: (edgeIds: string[]) => {
          set({ selectedEdgeIds: edgeIds })
        },
        
        clearSelection: () => {
          set({ selectedNodeIds: [], selectedEdgeIds: [] })
        },
        
        // 黑板操作
        setBlackboardValue: (key: string, value: any, type: BlackboardEntry['type'], source?: string) => {
          const entry: BlackboardEntry = {
            key,
            value,
            type,
            timestamp: Date.now(),
            source,
          }
          
          set(state => ({
            blackboard: {
              ...state.blackboard,
              [key]: entry,
            },
            blackboardHistory: {
              ...state.blackboardHistory,
              [key]: [...(state.blackboardHistory[key] || []), entry],
            },
          }))
        },
        
        deleteBlackboardKey: (key: string) => {
          set(state => {
            const { [key]: deleted, ...remainingBlackboard } = state.blackboard
            return { blackboard: remainingBlackboard }
          })
        },
        
        clearBlackboard: () => {
          set({ blackboard: {}, blackboardHistory: {} })
        },
        
        // 调试操作
        // --- 连接管理 ---
        connectToDebugger: (url: string) => {
          console.log("Connecting to debugger at", url);
          set({ 
            debugState: DebugState.CONNECTING, 
            debuggerConnectionError: null 
          });
          
          // 创建 Mock WebSocket 客户端实例
          const client = new MockWebSocketClient(url);
          
          // 设置回调函数
          client.onOpen(() => {
            console.log("Connected to debugger");
            set({ 
              debugState: DebugState.CONNECTED, 
              isDebuggerConnected: true,
              debuggerConnectionError: null,
              debuggerClient: client // 保存客户端实例
            });
          });
          
          client.onClose(() => {
            console.log("Disconnected from debugger");
            set({ 
              debugState: DebugState.DISCONNECTED, 
              isDebuggerConnected: false,
              debuggerConnectionError: null,
              debuggerClient: null // 清除客户端实例
            });
          });
          
          client.onError((error: string) => {
            console.error("Debugger connection error:", error);
            set({ 
              debugState: DebugState.DISCONNECTED, 
              isDebuggerConnected: false,
              debuggerConnectionError: error,
              debuggerClient: null // 清除客户端实例
            });
          });
          
          // 处理接收到的消息
          client.onMessage((message: DebuggerMessage) => {
            console.log("Received message from debugger:", message);
            const { type, payload } = message;
            
            switch (type) {
              case 'status_update':
                // 更新节点状态
                get().actions.setNodeStatus(payload.nodeId, payload.status);
                break;
                
              case 'blackboard_update':
                // 更新黑板
                get().actions.setBlackboardValue(payload.key, payload.value, payload.type);
                break;
                
              case 'execution_event':
                // 添加执行事件
                get().actions.addExecutionEvent({
                  nodeId: payload.nodeId,
                  type: payload.type,
                  status: payload.status,
                  // blackboardSnapshot 可以从 payload 中获取，如果有的话
                });
                break;
                
              case 'ack':
                // 处理确认消息，例如设置断点的确认
                console.log("Received ACK:", payload);
                break;
                
              default:
                console.warn("Unknown message type:", type);
            }
          });
          
          // 启动连接
          client.connect();
        },

        disconnectFromDebugger: () => {
          console.log("Disconnecting from debugger");
          const state = get();
          if (state.debuggerClient) {
            state.debuggerClient.disconnect();
          }
          // 状态更新在 onClose 回调中处理
        },

        startExecution: () => {
          const state = get();
          if (state.isDebuggerConnected && state.debuggerClient) {
            console.log("Execution started/resumed");
            set({ debugState: DebugState.RUNNING });
            // 通过 WebSocket 客户端发送开始命令
            state.debuggerClient.send({ type: 'start' });
          }
        },
        
        pauseExecution: () => {
          const state = get();
          if (state.isDebuggerConnected && state.debuggerClient) {
            console.log("Execution paused");
            set({ debugState: DebugState.PAUSED });
            // 通过 WebSocket 客户端发送暂停命令
            state.debuggerClient.send({ type: 'pause' });
          }
        },
        
        stopExecution: () => {
          const state = get();
          if (state.isDebuggerConnected && state.debuggerClient) {
            console.log("Execution stopped");
            set({ 
              debugState: DebugState.STOPPED,
              currentExecutingNode: null,
            });
            // 通过 WebSocket 客户端发送停止命令
            state.debuggerClient.send({ type: 'stop' });
          }
        },
        
        stepExecution: () => {
          const state = get();
          if (state.isDebuggerConnected && state.debuggerClient) {
            console.log("Execution stepped");
            set({ debugState: DebugState.STEPPING });
            // 通过 WebSocket 客户端发送步进命令
            state.debuggerClient.send({ type: 'step' });
          }
        },
        
        setExecutionSpeed: (speed: number) => {
          if (get().isDebuggerConnected) {
            const newSpeed = Math.max(0.1, Math.min(5.0, speed));
            set({ executionSpeed: newSpeed });
            console.log("Mock: Execution speed set to", newSpeed);
          }
        },
        
        // 模拟导入的子树执行
        simulateSubtree: () => {
          const state = get();
          console.log("Starting subtree simulation with nodes:", state.nodes);
          
          // 清除之前的执行事件
          state.actions.clearExecutionEvents();
          
          // 启动模拟执行
          const cleanup = simulateSubtreeExecution(
            state.nodes,
            (nodeId, status) => {
              // 更新节点状态
              state.actions.setNodeStatus(nodeId, status);
              
              // 添加执行事件
              state.actions.addExecutionEvent({
                nodeId,
                type: 'tick',
                status
              });
            },
            () => {
              // 模拟完成后的回调
              console.log("Subtree simulation completed");
              // 可以在这里添加完成后的操作，比如显示通知等
            }
          );
          
          // 可以将cleanup函数存储在状态中，以便在需要时停止模拟
          // set({ subtreeSimulationCleanup: cleanup });
        },
        
        // 事件记录
        addExecutionEvent: (event: Omit<ExecutionEvent, 'id' | 'timestamp'>) => {
          const newEvent: ExecutionEvent = {
            ...event,
            id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
          }
          
          set(state => ({
            executionEvents: [...state.executionEvents, newEvent],
          }))
        },
        
        clearExecutionEvents: () => {
          set({ executionEvents: [] })
        },
        
        // 时间轴操作
        setTimelinePosition: (position: number) => {
          set({ timelinePosition: position })
        },
        
        setTimelineRange: (range: [number, number]) => {
          set({ timelineRange: range })
        },
        
        toggleReplay: () => {
          set(state => ({ isReplaying: !state.isReplaying }))
        },
        
        // UI 操作
        toggleMinimap: () => {
          set(state => ({ showMinimap: !state.showMinimap }))
        },
        
        toggleGrid: () => {
          set(state => ({ showGrid: !state.showGrid }))
        },
        
        toggleSnapToGrid: () => {
          set(state => ({ snapToGrid: !state.snapToGrid }))
        },
        
        setPanelSize: (panelId: string, size: number) => {
          set(state => ({
            panelSizes: {
              ...state.panelSizes,
              [panelId]: size,
            },
          }))
        },
        
        // 批量操作
        importData: (nodes: BehaviorTreeNode[], edges: BehaviorTreeEdge[]) => {
          set(state => {
            if (!state.currentSession) {
              return { nodes, edges };
            }
            const modifiedAt = Date.now();
            // 通知 MockWebSocketClient 更新节点列表
            if (state.debuggerClient) {
              state.debuggerClient.setNodes(nodes.map(n => n.id));
            }
            return {
              nodes,
              edges,
              sessions: state.sessions.map(s =>
                s.id === state.currentSession.id
                  ? { ...s, nodes, edges, blackboard: state.blackboard, modifiedAt }
                  : s
              ),
              currentSession: {
                ...state.currentSession,
                nodes,
                edges,
                blackboard: state.blackboard,
                modifiedAt,
              },
            };
          });
        },
        
        exportData: () => {
          const state = get()
          return { nodes: state.nodes, edges: state.edges }
        },
        
        resetToDefaults: () => {
          const defaultSession = createDefaultSession()
          set({
            currentSession: defaultSession,
            sessions: [defaultSession],
            activeSessionId: defaultSession.id,
            nodes: defaultSession.nodes,
            edges: defaultSession.edges,
            blackboard: {},
            blackboardHistory: {},
            debugState: DebugState.STOPPED,
            breakpoints: new Set(),
            currentExecutingNode: null,
            executionEvents: [],
            executionSpeed: 1.0,
            timelinePosition: 0,
            timelineRange: [0, 100],
            isReplaying: false,
            selectedNodeIds: [],
            selectedEdgeIds: [],
          })
        },
      },
    }
  })
)

// 选择器 hooks
export const useCurrentSession = () => useBehaviorTreeStore(state => state.currentSession)
export const useNodes = () => useBehaviorTreeStore(state => state.nodes)
export const useEdges = () => useBehaviorTreeStore(state => state.edges)
export const useBlackboard = () => useBehaviorTreeStore(state => state.blackboard)
export const useDebugState = () => useBehaviorTreeStore(state => state.debugState)
export const useIsDebuggerConnected = () => useBehaviorTreeStore(state => state.isDebuggerConnected)
export const useDebuggerConnectionError = () => useBehaviorTreeStore(state => state.debuggerConnectionError)
export const useExecutionEvents = () => useBehaviorTreeStore(state => state.executionEvents)
export const useSelectedNodes = () => useBehaviorTreeStore(state => state.selectedNodeIds)
export const useSelectedEdges = () => useBehaviorTreeStore(state => state.selectedEdgeIds)
export const useActions = () => useBehaviorTreeStore(state => state.actions)