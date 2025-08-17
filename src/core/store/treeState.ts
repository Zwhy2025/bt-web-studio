
import { StateCreator } from 'zustand';
import { behaviorTreeManager, toggleSubtreeExpansion } from '@/core/bt/unified-behavior-tree-manager';
import { BehaviorTreeState, BehaviorTreeNode, BehaviorTreeEdge, NodeStatus } from './behavior-tree-store';

export interface TreeSlice {
  nodes: BehaviorTreeNode[];
  edges: BehaviorTreeEdge[];
  selectedNodeIds: string[];
  selectedEdgeIds: string[];
  expandedSubTrees: Set<string>;
  actions: {
    addNode: (node: BehaviorTreeNode) => void;
    updateNode: (nodeId: string, updates: Partial<BehaviorTreeNode>) => void;
    deleteNode: (nodeId: string) => void;
    setNodeStatus: (nodeId: string, status: NodeStatus) => void;
    addEdge: (edge: BehaviorTreeEdge) => void;
    updateEdge: (edgeId: string, updates: Partial<BehaviorTreeEdge>) => void;
    deleteEdge: (edgeId: string) => void;
    setSelectedNodes: (nodeIds: string[]) => void;
    setSelectedEdges: (edgeIds: string[]) => void;
    clearSelection: () => void;
    toggleSubTreeExpansion: (nodeId: string) => void;
    setSubTreeExpanded: (nodeId: string, expanded: boolean) => void;
    importData: (nodes: BehaviorTreeNode[], edges: BehaviorTreeEdge[], options?: { merge: boolean }) => void;
    exportData: () => { nodes: BehaviorTreeNode[]; edges: BehaviorTreeEdge[] };
  };
}

export const createTreeSlice: StateCreator<
  BehaviorTreeState,
  [],
  [],
  TreeSlice
> = (set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeIds: [],
  selectedEdgeIds: [],
  expandedSubTrees: new Set(),
  actions: {
    addNode: (node) => {
      set((state) => ({ nodes: [...state.nodes, node] }));
    },
    updateNode: (nodeId, updates) => {
      set((state) => ({
        nodes: state.nodes.map((n) => (n.id === nodeId ? { ...n, ...updates } : n)),
      }));
    },
    deleteNode: (nodeId) => {
      set((state) => ({
        nodes: state.nodes.filter((n) => n.id !== nodeId),
        edges: state.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
        selectedNodeIds: state.selectedNodeIds.filter((id) => id !== nodeId),
      }));
    },
    setNodeStatus: (nodeId, status) => {
      set((state) => ({
        nodes: state.nodes.map((n) =>
          n.id === nodeId
            ? {
              ...n,
              data: {
                ...n.data,
                status,
                lastExecutionTime: Date.now(),
                executionCount: (n.data.executionCount || 0) + 1,
              },
            }
            : n
        ),
      }));
    },
    addEdge: (edge) => {
      set((state) => ({ edges: [...state.edges, edge] }));
    },
    updateEdge: (edgeId, updates) => {
      set((state) => ({
        edges: state.edges.map((e) => (e.id === edgeId ? { ...e, ...updates } : e)),
      }));
    },
    deleteEdge: (edgeId) => {
      set((state) => ({
        edges: state.edges.filter((e) => e.id !== edgeId),
        selectedEdgeIds: state.selectedEdgeIds.filter((id) => id !== edgeId),
      }));
    },
    setSelectedNodes: (nodeIds) => {
      set({ selectedNodeIds: nodeIds });
    },
    setSelectedEdges: (edgeIds) => {
      set({ selectedEdgeIds: edgeIds });
    },
    clearSelection: () => {
      set({ selectedNodeIds: [], selectedEdgeIds: [] });
    },
    toggleSubTreeExpansion: (subtreeId) => {
      set(state => {
        if (!state.currentSession) {
          console.error('❌ No current session');
          return state;
        }

        const subtreeRefNode = state.nodes.find(node =>
          node.type === 'subtree' && (node.data.subtreeId === subtreeId || node.id === subtreeId || node.data.label?.includes(subtreeId))
        );

        if (!subtreeRefNode) {
          console.error(`❌ Subtree reference node not found: ${subtreeId}`);
          return state;
        }

        const parentTreeId = state.currentSession.id;
        const manager = behaviorTreeManager;

        if (!manager.getTree(parentTreeId)) {
          const treeData = {
            id: parentTreeId,
            name: state.currentSession.name || parentTreeId,
            sourceType: 'file' as const,
            sourceHash: Date.now().toString(),
            xmlContent: '',
            nodes: state.nodes,
            edges: state.edges,
            metadata: { nodeDefinitions: {}, treeDefinitions: {}, layoutApplied: true, lastParsed: new Date() }
          };
          manager.registerTree(treeData);
        }

        const actualSubtreeId = subtreeRefNode.data.subtreeId || subtreeId;

        if (!manager.getTree(actualSubtreeId)) {
          const tempSubtreeData = {
            id: actualSubtreeId,
            name: actualSubtreeId,
            sourceType: 'file' as const,
            sourceHash: Date.now().toString(),
            xmlContent: '',
            nodes: [{ id: `${actualSubtreeId}_root`, position: { x: 0, y: 0 }, data: { label: `${actualSubtreeId} Root`, status: NodeStatus.IDLE }, type: 'control-sequence' }],
            edges: [],
            metadata: { nodeDefinitions: {}, treeDefinitions: {}, layoutApplied: true, lastParsed: new Date() }
          };
          manager.registerTree(tempSubtreeData);
        }

        const currentExpanded = (subtreeRefNode.data as any).isExpanded || false;
        const newExpanded = !currentExpanded;
        const result = toggleSubtreeExpansion(parentTreeId, subtreeRefNode.id, newExpanded);

        if (result) {
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
          return state;
        }
      });
    },
    setSubTreeExpanded: (nodeId, expanded) => {
      const state = get();
      if (!state.currentSession) return;

      const node = state.nodes.find(n => n.id === nodeId);
      if (!node || !node.data.isSubtreeReference) return;

      const subtreeId = node.data.subtreeId;
      if (!subtreeId) return;

      const subtree = behaviorTreeManager.getTree(subtreeId);
      if (!subtree) return;

      const currentTreeId = `session_${state.currentSession.id}`;
      let currentTree = behaviorTreeManager.getTree(currentTreeId);

      if (!currentTree) {
        const currentTreeData = {
          id: currentTreeId,
          name: state.currentSession.name,
          sourceType: 'file' as const,
          sourceHash: Date.now().toString(),
          xmlContent: '',
          nodes: state.nodes.map(n => ({ ...n })),
          edges: state.edges.map(e => ({ ...e })),
          metadata: { nodeDefinitions: {}, treeDefinitions: {}, layoutApplied: true, lastParsed: new Date() }
        };
        behaviorTreeManager.registerTree(currentTreeData);
      } else {
        currentTree.nodes = state.nodes.map(n => ({ ...n }));
        currentTree.edges = state.edges.map(e => ({ ...e }));
      }

      const result = toggleSubtreeExpansion(currentTreeId, nodeId, expanded);

      if (result) {
        const newExpandedSubTrees = new Set(state.expandedSubTrees);
        if (expanded) {
          newExpandedSubTrees.add(nodeId);
        } else {
          newExpandedSubTrees.delete(nodeId);
        }

        set({ nodes: result.nodes, edges: result.edges, expandedSubTrees: newExpandedSubTrees });

        if (state.currentSession) {
          get().actions.importData(result.nodes, result.edges);
        }
      }
    },
    importData: (nodes, edges, options = { merge: true }) => {
      set((state) => {
        if (!state.currentSession) {
          return { nodes, edges };
        }

        // 如果options.merge为false，则直接使用传入的节点和边
        // 这样可以确保删除操作能正确执行
        if (!options.merge) {
          const modifiedAt = Date.now();
          if (state.debuggerClient) {
            state.debuggerClient.setNodes(nodes.map((n) => n.id));
          }

          return {
            nodes,
            edges,
            sessions: state.sessions.map((s) =>
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
        }

        // 合并新节点与现有节点，避免覆盖未更改的节点
        const updatedNodes = state.nodes.map(existingNode => {
          const updatedNode = nodes.find(n => n.id === existingNode.id);
          return updatedNode ? updatedNode : existingNode;
        });

        // 添加新节点（在现有节点中不存在的）
        const newNodes = nodes.filter(n => !state.nodes.some(existing => existing.id === n.id));
        const finalNodes = [...updatedNodes, ...newNodes];

        const modifiedAt = Date.now();
        if (state.debuggerClient) {
          state.debuggerClient.setNodes(finalNodes.map((n) => n.id));
        }

        return {
          nodes: finalNodes,
          edges,
          sessions: state.sessions.map((s) =>
            s.id === state.currentSession!.id
              ? { ...s, nodes: finalNodes, edges, blackboard: state.blackboard, modifiedAt }
              : s
          ),
          currentSession: {
            ...state.currentSession,
            nodes: finalNodes,
            edges,
            blackboard: state.blackboard,
            modifiedAt,
          },
        };
      });
    },
    exportData: () => {
      const state = get();
      return { nodes: state.nodes, edges: state.edges };
    },
  },
});
