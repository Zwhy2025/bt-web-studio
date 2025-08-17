import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { Node, Edge } from 'reactflow'
// 注释掉之前的 mock-debugger-client 导入
// import { startMockDebugSession, stopMockDebugSession } from '@/lib/mock-debugger-client' 
// import { MockWebSocketClient, DebuggerMessage } from '@/lib/mock-websocket-client' // 注释掉旧的导入
import { RealWebSocketClient, DebuggerMessage } from '@/lib/real-websocket-client' // 新增导入
import { simulateSubtreeExecution } from '@/lib/subtree-mock-generator' // 导入子树模拟功能
import { parseXMLUnified, applyLayoutUnified, behaviorTreeManager, handleSubtreeImport, toggleSubtreeExpansion } from '@/lib/unified-behavior-tree-manager';

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
    // 子树相关属性
    subtreeId?: string         // 子树的ID引用
    subtreeParameters?: Record<string, string>  // 子树的参数
    isSubtreeReference?: boolean // 是否为子树引用节点
    isExpanded?: boolean       // 子树是否展开
    // 子树展开时的属性
    isSubtreeChild?: boolean   // 是否为子树的子节点
    parentSubtreeRef?: string  // 父子树引用节点ID
    originalId?: string        // 原始节点ID（用于子树展开时的映射）
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
export interface BehaviorTreeState {
  // 会话管理
  currentSession: ProjectSession | null
  sessions: ProjectSession[]
  activeSessionId: string

  // 树结构
  nodes: BehaviorTreeNode[]
  edges: BehaviorTreeEdge[]

  // 黑板数据
  blackboard: Record<string, BlackboardEntry>
  blackboardHistory: Record<string, BlackboardEntry[]>

  // 调试状态
  debugState: DebugState
  isDebuggerConnected: boolean
  debuggerConnectionError: string | null
  breakpoints: Set<string>
  currentExecutingNode: string | null
  executionEvents: ExecutionEvent[]
  currentEventIndex: number
  executionSpeed: number

  // 连接状态
  isConnected: boolean
  connectionStatus: string

  // 选择状态
  selectedNodeIds: string[]
  selectedEdgeIds: string[]

  // SubTree展开状态
  expandedSubTrees: Set<string>

  // 时间轴状态
  timelinePosition: number
  timelineRange: [number, number]
  isReplaying: boolean
  playbackSpeed: number
  totalDuration: number

  // 回放控制状态
  replayTimer: NodeJS.Timeout | null
  replayStartTime: number

  // UI 状态
  showMinimap: boolean
  showGrid: boolean
  snapToGrid: boolean
  panelSizes: Record<string, number>

  // 新增：WebSocket 客户端实例 (使用 RealWebSocketClient)
  debuggerClient: RealWebSocketClient | null

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

    // SubTree展开/折叠操作
    toggleSubTreeExpansion: (nodeId: string) => void
    setSubTreeExpanded: (nodeId: string, expanded: boolean) => void

    // 黑板操作
    setBlackboardValue: (key: string, value: any, type: BlackboardEntry['type'], source?: string) => void
    deleteBlackboardKey: (key: string) => void
    clearBlackboard: () => void

    // 调试操作
    connectToDebugger: (url: string) => void
    disconnectFromDebugger: () => void
    startExecution: () => void
    pauseExecution: () => void
    stopExecution: () => void
    stepExecution: () => void
    continueExecution: () => void // 新增：继续执行（解锁断点）
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

    // 回放控制操作
    startReplay: () => void
    stopReplay: () => void
    pauseReplay: () => void
    seekToTime: (time: number) => void
    setPlaybackSpeed: (speed: number) => void
    updateNodesForTimePosition: (time: number) => void
    skipForward: (seconds?: number) => void
    skipBackward: (seconds?: number) => void
    seekToStart: () => void
    seekToEnd: () => void

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
      currentEventIndex: 0,
      executionSpeed: 1.0,

      // 连接状态
      isConnected: false,
      connectionStatus: "disconnected",

      // SubTree展开状态
      expandedSubTrees: new Set(),

      timelinePosition: 0,
      timelineRange: [0, 100],
      isReplaying: false,
      playbackSpeed: 1.0,
      totalDuration: 0,

      // 回放控制状态
      replayTimer: null,
      replayStartTime: 0,

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
            // 通知 RealWebSocketClient 更新节点列表
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
              activeSessionId: newActiveSession?.id || '',
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
              const command = wasBreakpointSet ? 'removeBreakpoint' : 'setBreakpoint';
              // 对于 setBreakpoint，我们需要发送节点 UID
              // 对于 removeBreakpoint，我们也需要发送节点 UID
              state.debuggerClient.sendCommand(command, { nodeId: nodeId });
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

        // SubTree展开/折叠操作 - 使用统一的处理逻辑
        toggleSubTreeExpansion: (subtreeId: string) => {
          set(state => {
            if (!state.currentSession) {
              console.error('❌ No current session');
              return state;
            }

            console.log(`🔄 Toggling subtree expansion for: ${subtreeId}`);

            // 查找子树引用节点（在当前树中的引用节点）
            const subtreeRefNode = state.nodes.find(node =>
              node.type === 'subtree' && (
                node.data.subtreeId === subtreeId ||
                node.id === subtreeId ||
                node.data.label?.includes(subtreeId)
              )
            );

            if (!subtreeRefNode) {
              console.error(`❌ Subtree reference node not found: ${subtreeId}`);
              return state;
            }

            console.log(`📍 Found subtree reference node:`, subtreeRefNode);

            // 使用当前会话ID作为父树ID，这样与错误日志中的session ID匹配
            const parentTreeId = state.currentSession.id;
            const manager = behaviorTreeManager;

            // 确保当前会话的树已注册到管理器
            if (!manager.getTree(parentTreeId)) {
              console.log(`🔧 Auto-registering current session tree: ${parentTreeId}`);
              const treeData = {
                id: parentTreeId,
                name: state.currentSession.name || parentTreeId,
                sourceType: 'file' as const,
                sourceHash: Date.now().toString(),
                xmlContent: '',
                nodes: state.nodes,
                edges: state.edges,
                metadata: {
                  nodeDefinitions: {},
                  treeDefinitions: {},
                  layoutApplied: true,
                  lastParsed: new Date()
                }
              };
              manager.registerTree(treeData);
            }

            // 获取实际的子树ID（从引用节点的数据中获取）
            const actualSubtreeId = subtreeRefNode.data.subtreeId || subtreeId;

            // 检查子树是否在管理器中注册，如果没有则尝试从当前解析的数据中提取
            if (!manager.getTree(actualSubtreeId)) {
              console.log(`🔄 Creating minimal subtree structure for: ${actualSubtreeId}`);

              // 创建最小的子树结构（包含一个根节点）
              const tempSubtreeData = {
                id: actualSubtreeId,
                name: actualSubtreeId,
                sourceType: 'file' as const,
                sourceHash: Date.now().toString(),
                xmlContent: '',
                nodes: [
                  {
                    id: `${actualSubtreeId}_root`,
                    position: { x: 0, y: 0 },
                    data: {
                      label: `${actualSubtreeId} Root`,
                      status: NodeStatus.IDLE,
                    },
                    type: 'control-sequence',
                  }
                ],
                edges: [],
                metadata: {
                  nodeDefinitions: {},
                  treeDefinitions: {},
                  layoutApplied: true,
                  lastParsed: new Date()
                }
              };
              manager.registerTree(tempSubtreeData);
              console.log(`✅ Created minimal subtree structure for: ${actualSubtreeId}`);
            }

            // 调用管理器的展开/折叠功能
            const currentExpanded = (subtreeRefNode.data as any).isExpanded || false;
            const newExpanded = !currentExpanded;

            console.log(`🎯 Calling toggleSubtreeExpansion with:`, {
              parentTreeId: parentTreeId,
              subtreeRefNodeId: subtreeRefNode.id,
              expand: newExpanded
            });

            const result = toggleSubtreeExpansion(parentTreeId, subtreeRefNode.id, newExpanded);

            if (result) {
              console.log(`✅ Subtree expansion toggled successfully`);
              return {
                ...state,
                nodes: result.nodes,
                edges: result.edges,
                sessions: state.sessions.map(s =>
                  s.id === state.currentSession!.id
                    ? { ...s, nodes: result.nodes, edges: result.edges, modifiedAt: Date.now() }
                    : s
                ),
                currentSession: {
                  ...state.currentSession,
                  nodes: result.nodes,
                  edges: result.edges,
                  modifiedAt: Date.now(),
                },
              };
            } else {
              console.error(`❌ Failed to toggle subtree expansion`);
              return state;
            }
          });
        },

        setSubTreeExpanded: (nodeId: string, expanded: boolean) => {
          const state = get();
          if (!state.currentSession) return;

          const node = state.nodes.find(n => n.id === nodeId);
          if (!node || !node.data.isSubtreeReference) return;

          // 首先检查子树是否已经在管理器中注册
          const subtreeId = node.data.subtreeId;
          if (!subtreeId) {
            console.error(`❌ Subtree ID not found in node: ${nodeId}`);
            return;
          }

          // 检查子树是否存在于管理器中
          const subtree = behaviorTreeManager.getTree(subtreeId);
          if (!subtree) {
            console.error(`❌ Subtree not found in manager: ${subtreeId}`);
            return;
          }

          // 确保当前会话的树数据已经在管理器中注册
          const currentTreeId = `session_${state.currentSession.id}`;
          let currentTree = behaviorTreeManager.getTree(currentTreeId);

          if (!currentTree) {
            // 如果当前树不在管理器中，先注册它
            console.log(`🔄 Registering current session tree: ${currentTreeId}`);
            const currentTreeData = {
              id: currentTreeId,
              name: state.currentSession.name,
              sourceType: 'file' as const,
              sourceHash: Date.now().toString(),
              xmlContent: '', // 临时空内容
              nodes: state.nodes.map(n => ({ ...n })),
              edges: state.edges.map(e => ({ ...e })),
              metadata: {
                nodeDefinitions: {},
                treeDefinitions: {},
                layoutApplied: true,
                lastParsed: new Date()
              }
            };
            behaviorTreeManager.registerTree(currentTreeData);
            currentTree = currentTreeData;
          } else {
            // 更新现有树的节点和边数据
            currentTree.nodes = state.nodes.map(n => ({ ...n }));
            currentTree.edges = state.edges.map(e => ({ ...e }));
          }

          // 使用统一的子树展开/折叠处理函数
          const result = toggleSubtreeExpansion(
            currentTreeId, // 使用正确的树 ID
            nodeId,
            expanded
          );

          if (result) {
            const newExpandedSubTrees = new Set(state.expandedSubTrees);
            if (expanded) {
              newExpandedSubTrees.add(nodeId);
            } else {
              newExpandedSubTrees.delete(nodeId);
            }

            // 更新状态
            set({
              nodes: result.nodes,
              edges: result.edges,
              expandedSubTrees: newExpandedSubTrees
            });

            // 同步到会话数据
            if (state.currentSession) {
              state.actions.importData(result.nodes, result.edges);
            }
          }
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
          console.log("🔗 Connecting to debugger at", url);
          set({
            debugState: DebugState.CONNECTING,
            debuggerConnectionError: null
          });

          // 创建 Real WebSocket 客户端实例
          const client = new RealWebSocketClient(url);

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
              case 'treeData':
                // 处理树数据
                if (payload && payload.xml) {
                  parseXMLUnified(payload.xml, 'remote', payload.treeId || `remote_${Date.now()}`)
                    .then(async (behaviorTreeData) => {
                      console.log("Parsed tree data:", behaviorTreeData);
                      // 应用行为树专用布局算法
                      const layoutedNodes = await applyLayoutUnified(behaviorTreeData.id);
                      console.log("Applied behavior tree layout:", layoutedNodes);

                      // 获取运行时数据
                      const runtimeData = behaviorTreeManager.getRuntimeData(behaviorTreeData.id);
                      if (!runtimeData) {
                        throw new Error('Failed to get runtime data');
                      }

                      // 更新 Zustand store 中的节点和边
                      set({ nodes: layoutedNodes, edges: runtimeData.edges });
                      // 如果有当前会话，也更新会话数据
                      const state = get();
                      if (state.currentSession) {
                        const updatedSessions = state.sessions.map(s =>
                          s.id === state.currentSession?.id
                            ? {
                              ...s,
                              nodes: layoutedNodes,
                              edges: runtimeData.edges,
                              modifiedAt: Date.now()
                            }
                            : s
                        );
                        set({ sessions: updatedSessions });

                        // 更新当前会话引用
                        set({
                          currentSession: {
                            ...state.currentSession,
                            nodes: layoutedNodes,
                            edges: runtimeData.edges,
                            modifiedAt: Date.now()
                          }
                        });
                      }
                    })
                    .catch((error) => {
                      console.error("Failed to parse tree XML:", error);
                      set({
                        debuggerConnectionError: `Failed to parse tree XML: ${error.message}`
                      });
                    });
                }
                break;

              case 'statusUpdate':
                // 更新节点状态
                if (payload && payload.data) {
                  // Python 代理发送的数据是 msgpack 格式，其中包含一个对象，
                  // 该对象的键是节点 UID，值是状态码
                  const nodeStatusMap = payload.data;
                  Object.entries(nodeStatusMap).forEach(([nodeUid, statusCode]) => {
                    // 将状态码映射到 NodeStatus 枚举
                    let status: NodeStatus;
                    switch (statusCode) {
                      case 0: // SKIPPED or IDLE
                        status = NodeStatus.IDLE;
                        break;
                      case 1: // RUNNING
                        status = NodeStatus.RUNNING;
                        break;
                      case 2: // SUCCESS
                        status = NodeStatus.SUCCESS;
                        break;
                      case 3: // FAILURE
                        status = NodeStatus.FAILURE;
                        break;
                      default:
                        status = NodeStatus.IDLE;
                    }
                    get().actions.setNodeStatus(nodeUid, status);
                  });
                }
                break;

              case 'blackboardUpdate':
                // 更新黑板
                if (payload && payload.data) {
                  // Python 代理发送的数据是 msgpack 格式，其中包含一个对象，
                  // 该对象的键是黑板键名，值是包含类型和值的对象
                  const blackboardData = payload.data;
                  Object.entries(blackboardData).forEach(([key, entry]: [string, any]) => {
                    // entry 应该有 { type: string, value: any } 的结构
                    // 我们需要将 type 字符串映射到 BlackboardEntry 的 type 枚举
                    let type: 'string' | 'number' | 'boolean' | 'object' = 'string';
                    if (entry.type === 'int' || entry.type === 'double') {
                      type = 'number';
                    } else if (entry.type === 'bool') {
                      type = 'boolean';
                    } else if (entry.type === 'str') {
                      type = 'string';
                    } else {
                      type = 'object'; // For other types, treat as object
                    }

                    get().actions.setBlackboardValue(key, entry.value, type);
                  });
                }
                break;

              case 'breakpointReached':
                // 处理断点触发
                if (payload && payload.nodeId) {
                  console.log("Breakpoint reached at node:", payload.nodeId);
                  set({
                    debugState: DebugState.PAUSED,
                    currentExecutingNode: payload.nodeId
                  });
                }
                break;

              case 'breakpointSet':
                // 处理断点设置确认
                console.log("Breakpoint set:", payload);
                break;

              case 'breakpointRemoved':
                // 处理断点移除确认
                console.log("Breakpoint removed:", payload);
                break;

              case 'breakpointUnlocked':
                // 处理断点解锁确认
                console.log("Breakpoint unlocked:", payload);
                // 可能需要更新调试状态
                set({
                  debugState: DebugState.RUNNING,
                  currentExecutingNode: null
                });
                break;

              case 'executionStarted':
                // 处理执行开始确认
                console.log("Execution started:", payload);
                break;

              case 'executionPaused':
                // 处理执行暂停确认
                console.log("Execution paused:", payload);
                break;

              case 'executionStopped':
                // 处理执行停止确认
                console.log("Execution stopped:", payload);
                set({
                  debugState: DebugState.STOPPED,
                  currentExecutingNode: null
                });
                break;

              case 'executionStepped':
                // 处理执行步进确认
                console.log("Execution stepped:", payload);
                // 步进后可能会暂停在下一个节点
                // Python 代理应该会在断点触发时发送 breakpointReached 消息
                break;

              case 'error':
                // 处理错误消息
                console.error("❌ Error from proxy:", payload);

                // Check if this is a protocol state error
                if (payload.message && payload.message.includes('Operation cannot be accomplished in current state')) {
                  console.warn('⚠️ Backend not ready - tree may not be loaded or running');
                  set({
                    debuggerConnectionError: 'Backend not ready: ' + payload.message,
                    debugState: DebugState.DISCONNECTED
                  });
                } else {
                  set({
                    debuggerConnectionError: payload.message || 'Unknown error from proxy'
                  });
                }

                // Enhanced tree data handling with backend state checking
                if (payload.xml && payload.xml.length > 0) {
                  console.log('✅ Tree loaded successfully from backend');
                  // Tree is loaded, we can now safely request status and blackboard
                  setTimeout(() => {
                    const client = get().debuggerClient;
                    if (client) {
                      console.log('🔄 Requesting status and blackboard after tree confirmation');
                      client.sendCommand('getStatus');
                      client.sendCommand('getBlackboard');
                    }
                  }, 500);
                } else {
                  console.warn('⚠️ Empty tree received - backend may not have a tree loaded');
                }
                break;

              case 'subscribed':
                console.log('📡 Subscribed to notifications:', payload);
                break;

              default:
                console.warn("❓ Unknown message type:", type);
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
            state.debuggerClient.sendCommand('start');
          }
        },

        pauseExecution: () => {
          const state = get();
          if (state.isDebuggerConnected && state.debuggerClient) {
            console.log("Execution paused");
            set({ debugState: DebugState.PAUSED });
            // 通过 WebSocket 客户端发送暂停命令
            state.debuggerClient.sendCommand('pause');
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
            state.debuggerClient.sendCommand('stop');
          }
        },

        stepExecution: () => {
          const state = get();
          if (state.isDebuggerConnected && state.debuggerClient) {
            console.log("Execution stepped");
            set({ debugState: DebugState.STEPPING });
            // 通过 WebSocket 客户端发送步进命令
            state.debuggerClient.sendCommand('step');
          }
        },

        continueExecution: () => {
          const state = get();
          if (state.isDebuggerConnected && state.debuggerClient) {
            console.log("Execution continued");
            set({ debugState: DebugState.RUNNING });
            // 通过 WebSocket 客户端发送继续执行命令
            state.debuggerClient.sendCommand('continue');
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
          const state = get();
          if (state.isReplaying) {
            state.actions.stopReplay();
          } else {
            state.actions.startReplay();
          }
        },

        // 回放控制操作
        startReplay: () => {
          const state = get();
          if (state.replayTimer) {
            clearInterval(state.replayTimer);
          }

          // 计算总时长（基于执行事件）
          const totalDuration = state.executionEvents.length > 0
            ? Math.max(...state.executionEvents.map(e => e.timestamp))
            : 10000; // 默认10秒

          const startTime = Date.now();
          const initialPosition = state.timelinePosition;

          const timer = setInterval(() => {
            const currentState = get();
            const elapsed = (Date.now() - startTime) * currentState.playbackSpeed;
            const newPosition = Math.min(initialPosition + elapsed, totalDuration);

            // 更新时间轴位置
            set({ timelinePosition: newPosition });

            // 根据当前时间位置更新节点状态
            currentState.actions.updateNodesForTimePosition(newPosition);

            // 检查是否到达结尾
            if (newPosition >= totalDuration) {
              currentState.actions.stopReplay();
            }
          }, 50); // 每50ms更新一次

          set({
            isReplaying: true,
            replayTimer: timer,
            replayStartTime: startTime,
            totalDuration
          });
        },

        stopReplay: () => {
          const state = get();
          if (state.replayTimer) {
            clearInterval(state.replayTimer);
          }
          set({
            isReplaying: false,
            replayTimer: null,
            replayStartTime: 0
          });
        },

        pauseReplay: () => {
          const state = get();
          if (state.replayTimer) {
            clearInterval(state.replayTimer);
          }
          set({
            isReplaying: false,
            replayTimer: null
          });
        },

        seekToTime: (time: number) => {
          const state = get();
          const clampedTime = Math.max(0, Math.min(time, state.totalDuration));

          set({ timelinePosition: clampedTime });

          // 更新节点状态到指定时间点
          state.actions.updateNodesForTimePosition(clampedTime);
        },

        setPlaybackSpeed: (speed: number) => {
          const clampedSpeed = Math.max(0.1, Math.min(8.0, speed));
          set({ playbackSpeed: clampedSpeed });
        },

        // 根据时间位置更新节点状态
        updateNodesForTimePosition: (time: number) => {
          const state = get();

          // 重置所有节点状态
          const resetNodes = state.nodes.map(node => ({
            ...node,
            data: {
              ...node.data,
              status: NodeStatus.IDLE
            }
          }));

          // 找到当前时间点应该激活的事件
          const activeEvents = state.executionEvents.filter(event =>
            event.timestamp <= time
          );

          // 按时间排序并应用状态
          activeEvents.sort((a, b) => a.timestamp - b.timestamp);

          const updatedNodes = resetNodes.map(node => {
            // 找到该节点最新的状态事件
            const nodeEvents = activeEvents.filter(event => event.nodeId === node.id);
            const latestEvent = nodeEvents[nodeEvents.length - 1];

            if (latestEvent) {
              return {
                ...node,
                data: {
                  ...node.data,
                  status: latestEvent.status
                }
              };
            }

            return node;
          });

          set({ nodes: updatedNodes });
        },

        // 快进/快退操作
        skipForward: (seconds: number = 1) => {
          const state = get();
          const newTime = Math.min(state.timelinePosition + seconds * 1000, state.totalDuration);
          state.actions.seekToTime(newTime);
        },

        skipBackward: (seconds: number = 1) => {
          const state = get();
          const newTime = Math.max(state.timelinePosition - seconds * 1000, 0);
          state.actions.seekToTime(newTime);
        },

        // 跳转到开始/结束
        seekToStart: () => {
          const state = get();
          state.actions.seekToTime(0);
        },

        seekToEnd: () => {
          const state = get();
          state.actions.seekToTime(state.totalDuration);
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
            // 通知 RealWebSocketClient 更新节点列表
            if (state.debuggerClient) {
              state.debuggerClient.setNodes(nodes.map(n => n.id));
            }

            // 更新当前状态
            return {
              nodes,
              edges,
              sessions: state.sessions.map(s =>
                s.id === state.currentSession!.id
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
