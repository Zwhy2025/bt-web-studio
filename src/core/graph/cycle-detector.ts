import type { Node, Edge } from 'reactflow';

/**
 * 检查添加边 source -> target 是否会形成回路
 * @param sourceId 源节点 ID
 * @param targetId 目标节点 ID
 * @param edges 当前边列表
 * @param nodes 当前节点列表（用于扩展，当前未使用）
 * @returns true 表示会形成回路或违反规则，应拒绝连接
 */
export function wouldCreateCycle(
  sourceId: string,
  targetId: string,
  edges: Edge[],
  _nodes: Node[]
): boolean {
  // 如果目标节点是根节点，则不允许连接
  if (targetId === 'root') {
    return true;
  }

  // 检查是否直接连接到自己的父节点（形成双向连接）
  const isDirectParent = edges.some(
    (edge) => edge.source === targetId && edge.target === sourceId
  );
  if (isDirectParent) {
    return true;
  }

  // 检查是否会形成间接回路：从 source 出发，若可达 target 则存在回路
  const visited = new Set<string>();
  const stack: string[] = [sourceId];

  while (stack.length > 0) {
    const currentId = stack.pop()!;
    if (currentId === targetId) {
      return true; // 发现回路
    }
    if (visited.has(currentId)) {
      continue;
    }
    visited.add(currentId);

    edges
      .filter((edge) => edge.source === currentId)
      .forEach((edge) => stack.push(edge.target));
  }

  return false;
}
