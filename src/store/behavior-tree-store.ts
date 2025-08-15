import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { Node, Edge } from 'reactflow'

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
      
      debugState: DebugState.STOPPED,
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
            set({
              currentSession: session,
              activeSessionId: sessionId,
              nodes: session.nodes,
              edges: session.edges,
              blackboard: session.blackboard,
              selectedNodeIds: [],
              selectedEdgeIds: [],
            })
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
        
        toggleBreakpoint: (nodeId: string) => {
          set(state => {
            const newBreakpoints = new Set(state.breakpoints)
            if (newBreakpoints.has(nodeId)) {
              newBreakpoints.delete(nodeId)
            } else {
              newBreakpoints.add(nodeId)
            }
            
            return {
              breakpoints: newBreakpoints,
              nodes: state.nodes.map(n => 
                n.id === nodeId 
                  ? { ...n, data: { ...n.data, breakpoint: newBreakpoints.has(nodeId) } }
                  : n
              ),
            }
          })
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
        startExecution: () => {
          set({ debugState: DebugState.RUNNING })
        },
        
        pauseExecution: () => {
          set({ debugState: DebugState.PAUSED })
        },
        
        stopExecution: () => {
          set({ 
            debugState: DebugState.STOPPED,
            currentExecutingNode: null,
          })
        },
        
        stepExecution: () => {
          set({ debugState: DebugState.STEPPING })
        },
        
        setExecutionSpeed: (speed: number) => {
          set({ executionSpeed: Math.max(0.1, Math.min(5.0, speed)) })
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
          const state = get()
          set({ 
            nodes, 
            edges,
            // 同时更新当前会话的数据
            currentSession: state.currentSession ? {
              ...state.currentSession,
              nodes,
              edges,
              modifiedAt: Date.now()
            } : null
          })
          
          // 更新会话列表中的当前会话
          if (state.currentSession) {
            const updatedSessions = state.sessions.map(s => 
              s.id === state.currentSession?.id 
                ? { ...s, nodes, edges, modifiedAt: Date.now() }
                : s
            )
            set({ sessions: updatedSessions })
          }
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
export const useExecutionEvents = () => useBehaviorTreeStore(state => state.executionEvents)
export const useSelectedNodes = () => useBehaviorTreeStore(state => state.selectedNodeIds)
export const useSelectedEdges = () => useBehaviorTreeStore(state => state.selectedEdgeIds)
export const useActions = () => useBehaviorTreeStore(state => state.actions)