/**
 * 子树展开/折叠 - 纯函数实现
 * 直接基于 nodes/edges 计算，不依赖 manager 运行时状态，避免重复和同步问题
 */
import type { BehaviorTreeNode, BehaviorTreeEdge } from '@/core/store/behavior-tree-types';

export interface SubtreeDefinition {
  nodes: BehaviorTreeNode[];
  edges: BehaviorTreeEdge[];
}

export interface SubtreeExpansionResult {
  nodes: BehaviorTreeNode[];
  edges: BehaviorTreeEdge[];
}

/**
 * 计算展开/折叠后的节点和边
 * @param nodes 当前节点列表（来自 store）
 * @param edges 当前边列表（来自 store）
 * @param subtreeRefNode 子树引用节点
 * @param subtreeDef 子树定义（来自 manager.getTree）
 * @param expand true=展开，false=折叠
 */
export function computeSubtreeExpansion(
  nodes: BehaviorTreeNode[],
  edges: BehaviorTreeEdge[],
  subtreeRefNode: BehaviorTreeNode,
  subtreeDef: SubtreeDefinition,
  expand: boolean
): SubtreeExpansionResult {
  const subtreeRefNodeId = subtreeRefNode.id;

  if (expand) {
    // 展开：先移除可能存在的旧子树节点（幂等），再添加
    const baseNodes = nodes.filter(
      (n) => !(n.data as any)?.parentSubtreeRef || (n.data as any).parentSubtreeRef !== subtreeRefNodeId
    );
    const baseEdges = edges.filter(
      (e) => !(e.data as any)?.parentSubtreeRef || (e.data as any).parentSubtreeRef !== subtreeRefNodeId
    );

    const subtreeNodes = subtreeDef.nodes.map((node) => ({
      ...node,
      id: `${subtreeRefNodeId}_${node.id}`,
      data: {
        ...node.data,
        isSubtreeChild: true,
        parentSubtreeRef: subtreeRefNodeId,
        originalId: node.id,
      },
      position: {
        x: subtreeRefNode.position.x + node.position.x,
        y: subtreeRefNode.position.y + 100 + node.position.y,
      },
    }));

    const subtreeEdges = subtreeDef.edges.map((edge) => ({
      ...edge,
      id: `${subtreeRefNodeId}_${edge.id}`,
      source: `${subtreeRefNodeId}_${edge.source}`,
      target: `${subtreeRefNodeId}_${edge.target}`,
      data: {
        ...edge.data,
        isSubtreeChild: true,
        parentSubtreeRef: subtreeRefNodeId,
      },
    }));

    const subtreeRootNode = subtreeNodes.find(
      (n) => (n.data as any).originalId === subtreeDef.nodes[0]?.id
    );
    if (subtreeRootNode) {
      subtreeEdges.push({
        id: `${subtreeRefNodeId}_connection`,
        source: subtreeRefNodeId,
        target: subtreeRootNode.id,
        sourceHandle: 'out',
        targetHandle: 'in',
        data: {
          executionCount: 0,
          lastExecutionTime: 0,
          isSubtreeConnection: true,
          parentSubtreeRef: subtreeRefNodeId,
        },
      } as BehaviorTreeEdge);
    }

    // 更新引用节点的 isExpanded
    const updatedRefNode = {
      ...subtreeRefNode,
      data: { ...subtreeRefNode.data, isExpanded: true },
    };
    const refNodeIndex = baseNodes.findIndex((n) => n.id === subtreeRefNodeId);
    const finalNodes =
      refNodeIndex >= 0
        ? baseNodes.map((n, i) => (i === refNodeIndex ? updatedRefNode : n))
        : [...baseNodes, updatedRefNode];

    return {
      nodes: [...finalNodes, ...subtreeNodes],
      edges: [...baseEdges, ...subtreeEdges],
    };
  } else {
    // 折叠：移除子树节点
    const filteredNodes = nodes.filter(
      (n) => !(n.data as any)?.parentSubtreeRef || (n.data as any).parentSubtreeRef !== subtreeRefNodeId
    );
    const filteredEdges = edges.filter(
      (e) => !(e.data as any)?.parentSubtreeRef || (e.data as any).parentSubtreeRef !== subtreeRefNodeId
    );

    const updatedRefNode = {
      ...subtreeRefNode,
      data: { ...subtreeRefNode.data, isExpanded: false },
    };
    const refNodeIndex = filteredNodes.findIndex((n) => n.id === subtreeRefNodeId);
    const finalNodes =
      refNodeIndex >= 0
        ? filteredNodes.map((n, i) => (i === refNodeIndex ? updatedRefNode : n))
        : filteredNodes;

    return { nodes: finalNodes, edges: filteredEdges };
  }
}
