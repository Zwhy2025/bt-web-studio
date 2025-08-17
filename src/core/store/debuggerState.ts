import { StateCreator } from 'zustand';
import { RealWebSocketClient, DebuggerMessage } from '@/core/debugger/real-websocket-client';
import { simulateSubtreeExecution } from '@/core/bt/subtree-mock-generator';
import { parseXMLUnified, applyLayoutUnified, behaviorTreeManager } from '@/core/bt/unified-behavior-tree-manager';
import { BehaviorTreeState, DebugState, NodeStatus } from './behavior-tree-store';

export interface DebuggerSlice {
  debugState: DebugState;
  isDebuggerConnected: boolean;
  debuggerConnectionError: string | null;
  breakpoints: Set<string>;
  currentExecutingNode: string | null;
  executionSpeed: number;
  debuggerClient: RealWebSocketClient | null;
  actions: {
    toggleBreakpoint: (nodeId: string) => void;
    connectToDebugger: (url: string) => void;
    disconnectFromDebugger: () => void;
    startExecution: () => void;
    pauseExecution: () => void;
    stopExecution: () => void;
    stepExecution: () => void;
    continueExecution: () => void;
    setExecutionSpeed: (speed: number) => void;
    simulateSubtree: () => void;
  };
}

export const createDebuggerSlice: StateCreator<
  BehaviorTreeState,
  [],
  [],
  DebuggerSlice
> = (set, get) => ({
  debugState: DebugState.DISCONNECTED,
  isDebuggerConnected: false,
  debuggerConnectionError: null,
  breakpoints: new Set(),
  currentExecutingNode: null,
  executionSpeed: 1.0,
  debuggerClient: null,
  actions: {
    toggleBreakpoint: (nodeId) => {
      set((state) => {
        const newBreakpoints = new Set(state.breakpoints);
        const wasBreakpointSet = newBreakpoints.has(nodeId);

        if (wasBreakpointSet) {
          newBreakpoints.delete(nodeId);
        } else {
          newBreakpoints.add(nodeId);
        }

        if (state.isDebuggerConnected && state.debuggerClient) {
          const command = wasBreakpointSet ? 'removeBreakpoint' : 'setBreakpoint';
          state.debuggerClient.sendCommand(command, { nodeId: nodeId });
        }

        return {
          breakpoints: newBreakpoints,
          nodes: state.nodes.map((n) =>
            n.id === nodeId
              ? { ...n, data: { ...n.data, breakpoint: !wasBreakpointSet } }
              : n
          ),
        };
      });
    },
    connectToDebugger: (url) => {
      console.log("🔗 Connecting to debugger at", url);
      set({ debugState: DebugState.CONNECTING, debuggerConnectionError: null });

      const client = new RealWebSocketClient(url);
      
      // Add extra logging for debugging
      console.log("🔧 Created RealWebSocketClient instance");

      client.onOpen(() => {
        console.log("Connected to debugger");
        set({ debugState: DebugState.CONNECTED, isDebuggerConnected: true, debuggerConnectionError: null, debuggerClient: client });
      });

      client.onClose(() => {
        console.log("Disconnected from debugger");
        set({ debugState: DebugState.DISCONNECTED, isDebuggerConnected: false, debuggerConnectionError: null, debuggerClient: null });
      });

      client.onError((error) => {
        console.error("Debugger connection error:", error);
        set({ debugState: DebugState.DISCONNECTED, isDebuggerConnected: false, debuggerConnectionError: error, debuggerClient: null });
      });

      client.onMessage((message: DebuggerMessage) => {
        console.log("Received message from debugger:", message);
        const { type, payload } = message;
        const { actions } = get();

        switch (type) {
          case 'treeData':
            if (payload && payload.xml) {
              // Log the full payload for debugging
              console.log("Full treeData payload:", JSON.stringify(payload, null, 2));
              
              // Check if XML is not empty before parsing
              if (payload.xml.trim().length > 0) {
                parseXMLUnified(payload.xml, 'remote', payload.treeId || `remote_${Date.now()}`)
                  .then(async (behaviorTreeData) => {
                    console.log("Successfully parsed tree data:", behaviorTreeData);
                    const layoutedNodes = await applyLayoutUnified(behaviorTreeData.id);
                    const runtimeData = behaviorTreeManager.getRuntimeData(behaviorTreeData.id);
                    if (!runtimeData) throw new Error('Failed to get runtime data');
                    set({ nodes: layoutedNodes, edges: runtimeData.edges });
                    if (get().currentSession) {
                      actions.importData(layoutedNodes, runtimeData.edges);
                    }
                  })
                  .catch((error) => {
                    console.error("Failed to parse tree XML:", error);
                    set({ debuggerConnectionError: `Failed to parse tree XML: ${error.message}` });
                  });
              } else {
                console.warn("Received empty tree XML, backend may not have a tree loaded");
                // Check if there are other fields in the payload that might contain useful info
                if (payload.header) {
                  console.log("Tree data header:", payload.header);
                }
                // Set a message to inform the user that no tree is loaded
                set({ debuggerConnectionError: "Connected to debugger, but no behavior tree is currently loaded in the backend" });
              }
            } else {
              console.warn("Received treeData message with no XML payload");
              set({ debuggerConnectionError: "Connected to debugger, but received invalid tree data" });
            }
            break;
          case 'statusUpdate':
            if (payload && payload.data) {
              const nodeStatusMap = payload.data;
              Object.entries(nodeStatusMap).forEach(([nodeUid, statusCode]) => {
                let status: NodeStatus;
                switch (statusCode) {
                  case 0: status = NodeStatus.IDLE; break;
                  case 1: status = NodeStatus.RUNNING; break;
                  case 2: status = NodeStatus.SUCCESS; break;
                  case 3: status = NodeStatus.FAILURE; break;
                  default: status = NodeStatus.IDLE;
                }
                actions.setNodeStatus(nodeUid, status);
              });
            }
            break;
          case 'blackboardUpdate':
            if (payload && payload.data) {
              const blackboardData = payload.data;
              Object.entries(blackboardData).forEach(([key, entry]: [string, any]) => {
                let type: 'string' | 'number' | 'boolean' | 'object' = 'string';
                if (['int', 'double'].includes(entry.type)) type = 'number';
                else if (entry.type === 'bool') type = 'boolean';
                else if (entry.type === 'str') type = 'string';
                else type = 'object';
                actions.setBlackboardValue(key, entry.value, type);
              });
            }
            break;
          case 'breakpointReached':
            if (payload && payload.nodeId) {
              set({ debugState: DebugState.PAUSED, currentExecutingNode: payload.nodeId });
            }
            break;
          case 'executionStopped':
            set({ debugState: DebugState.STOPPED, currentExecutingNode: null });
            break;
          case 'subscribed':
            // Handle subscribed message - no action required
            console.log("Successfully subscribed to topic:", payload?.topic || 'unknown');
            break;
          case 'error':
            console.error("Error from debugger:", payload);
            set({ debuggerConnectionError: payload.message || 'Unknown error from proxy' });
            break;
          default:
            console.warn("❓ Unknown message type:", type);
        }
      });

      client.connect();
    },
    disconnectFromDebugger: () => {
      const state = get();
      console.log("Disconnecting from debugger");
      if (state.debuggerClient) {
        state.debuggerClient.disconnect();
      }
      // 确保状态被重置
      set({ 
        debugState: DebugState.DISCONNECTED, 
        isDebuggerConnected: false, 
        debuggerConnectionError: null, 
        debuggerClient: null,
        breakpoints: new Set(),
        currentExecutingNode: null
      });
    },
    startExecution: () => {
      const state = get();
      if (state.isDebuggerConnected && state.debuggerClient) {
        set({ debugState: DebugState.RUNNING });
        state.debuggerClient.sendCommand('start');
      }
    },
    pauseExecution: () => {
      const state = get();
      if (state.isDebuggerConnected && state.debuggerClient) {
        set({ debugState: DebugState.PAUSED });
        state.debuggerClient.sendCommand('pause');
      }
    },
    stopExecution: () => {
      const state = get();
      if (state.isDebuggerConnected && state.debuggerClient) {
        set({ debugState: DebugState.STOPPED, currentExecutingNode: null });
        state.debuggerClient.sendCommand('stop');
      }
    },
    stepExecution: () => {
      const state = get();
      if (state.isDebuggerConnected && state.debuggerClient) {
        set({ debugState: DebugState.STEPPING });
        state.debuggerClient.sendCommand('step');
      }
    },
    continueExecution: () => {
      const state = get();
      if (state.isDebuggerConnected && state.debuggerClient) {
        set({ debugState: DebugState.RUNNING });
        state.debuggerClient.sendCommand('continue');
      }
    },
    setExecutionSpeed: (speed) => {
      if (get().isDebuggerConnected) {
        const newSpeed = Math.max(0.1, Math.min(5.0, speed));
        set({ executionSpeed: newSpeed });
      }
    },
    simulateSubtree: () => {
      const state = get();
      const { actions } = get();
      actions.clearExecutionEvents();
      simulateSubtreeExecution(
        state.nodes,
        (nodeId, status) => {
          actions.setNodeStatus(nodeId, status);
          actions.addExecutionEvent({ nodeId, type: 'tick', status });
        },
        () => {
          console.log("Subtree simulation completed");
        }
      );
    },
  },
});