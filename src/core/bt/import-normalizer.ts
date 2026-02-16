import type { Node, Edge } from 'reactflow';

/**
 * 将 XML 导入的节点规范化，使根节点符合编排模式约定：
 * - 根节点 id 固定为 'root'
 * - instanceName 为 'root'
 * - modelName、category 从 XML 正确推断
 * - 根节点无输入端口（inputs: []）
 */
export function normalizeImportedNodesForComposer(
  nodes: Node[],
  edges: Edge[]
): { nodes: Node[]; edges: Edge[] } {
  if (nodes.length === 0) return { nodes, edges };

  const targetIds = new Set(edges.map((e) => e.target));
  const rootNode = nodes.find((n) => !targetIds.has(n.id));
  if (!rootNode) return { nodes, edges };

  const oldRootId = rootNode.id;
  if (oldRootId === 'root') {
    // 已是 root，仅确保 data 完整
    const enrichedRoot = enrichRootNodeData(rootNode);
    const otherNodes = nodes.filter((n) => n.id !== oldRootId);
    return {
      nodes: [enrichedRoot, ...otherNodes],
      edges,
    };
  }

  // 重映射根节点 id 为 'root'
  const enrichedRoot: Node = {
    ...rootNode,
    id: 'root',
    data: {
      ...rootNode.data,
      instanceName: 'root',
      modelName: inferModelName(rootNode),
      category: 'control',
      inputs: [],
      outputs: rootNode.data?.outputs ?? [{ id: 'out', side: 'bottom' }],
    },
  };

  const idMap = new Map<string, string>([[oldRootId, 'root']]);
  const newEdges = edges.map((e) => ({
    ...e,
    source: idMap.get(e.source) ?? e.source,
    target: idMap.get(e.target) ?? e.target,
  }));

  const otherNodes = nodes
    .filter((n) => n.id !== oldRootId)
    .map((n) => ({
      ...n,
      data: enrichNodeData(n.data),
    }));

  return {
    nodes: [enrichedRoot, ...otherNodes],
    edges: newEdges,
  };
}

function inferModelName(node: Node): string {
  const d = node.data as Record<string, any>;
  if (d?.modelName) return d.modelName;
  if (d?.label) {
    const label = String(d.label);
    const m = label.match(/^(\w+)/);
    if (m) return m[1];
  }
  const type = node.type as string;
  if (type === 'control-sequence') return 'Sequence';
  if (type === 'control-selector') return 'Selector';
  if (type === 'action') return 'Action';
  if (type === 'condition') return 'Condition';
  if (type === 'decorator') return 'Decorator';
  if (type === 'subtree') return 'SubTree';
  return 'Sequence';
}

function enrichRootNodeData(node: Node): Node {
  return {
    ...node,
    data: {
      ...node.data,
      instanceName: 'root',
      modelName: (node.data as any)?.modelName ?? inferModelName(node),
      category: 'control',
      inputs: [],
      outputs: (node.data as any)?.outputs ?? [{ id: 'out', side: 'bottom' }],
    },
  };
}

function enrichNodeData(data: Record<string, any> | undefined): Record<string, any> {
  if (!data) return {};
  const label = data.label ?? '';
  const modelName = data.modelName ?? (typeof label === 'string' ? label.split(':')[0]?.trim() : '');
  return {
    ...data,
    modelName: modelName || data.modelName,
    instanceName: data.instanceName ?? data.attributes?.name ?? modelName,
  };
}
