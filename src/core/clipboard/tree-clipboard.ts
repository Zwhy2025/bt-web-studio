import type { Node, Edge } from 'reactflow';

const PASTE_OFFSET = { x: 20, y: 20 };

/**
 * 序列化节点和边为剪贴板格式
 */
export function serializeToClipboard(
  nodes: Node[],
  edges: Edge[]
): { nodes: Node[]; edges: Edge[] } {
  return {
    nodes: JSON.parse(JSON.stringify(nodes)),
    edges: JSON.parse(JSON.stringify(edges)),
  };
}

/**
 * 从剪贴板数据反序列化（直接返回，clone 由 cloneWithNewIds 负责）
 */
export function deserializeFromClipboard(data: {
  nodes: Node[];
  edges: Edge[];
}): { nodes: Node[]; edges: Edge[] } {
  return {
    nodes: JSON.parse(JSON.stringify(data.nodes)),
    edges: JSON.parse(JSON.stringify(data.edges)),
  };
}

/**
 * 为节点和边生成新 ID，并偏移位置
 */
export function cloneWithNewIds(
  nodes: Node[],
  edges: Edge[],
  offset: { x: number; y: number } = PASTE_OFFSET
): { nodes: Node[]; edges: Edge[] } {
  const idMap = new Map<string, string>();

  const newNodes: Node[] = nodes.map((node) => {
    const newId = `node-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    idMap.set(node.id, newId);
    return {
      ...JSON.parse(JSON.stringify(node)),
      id: newId,
      position: {
        x: (node.position?.x ?? 0) + offset.x,
        y: (node.position?.y ?? 0) + offset.y,
      },
    };
  });

  const newEdges: Edge[] = edges
    .filter((e) => idMap.has(e.source) && idMap.has(e.target))
    .map((edge) => ({
      ...JSON.parse(JSON.stringify(edge)),
      id: `edge-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      source: idMap.get(edge.source)!,
      target: idMap.get(edge.target)!,
    }));

  return { nodes: newNodes, edges: newEdges };
}
