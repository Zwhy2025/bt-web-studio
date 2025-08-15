import { Node, Edge } from "reactflow";

export interface LayoutOptions {
  nodeWidth: number;
  nodeHeight: number;
  horizontalSpacing: number;
  verticalSpacing: number;
  rootX: number;
  rootY: number;
}

const defaultLayoutOptions: LayoutOptions = {
  nodeWidth: 200,
  nodeHeight: 60,
  horizontalSpacing: 80,
  verticalSpacing: 100,
  rootX: 400,
  rootY: 50
};

interface TreeNode {
  id: string;
  children: TreeNode[];
  node: Node;
  x: number;
  y: number;
  width: number;
}

export function autoLayoutTree(nodes: Node[], edges: Edge[], options: Partial<LayoutOptions> = {}): Node[] {
  const opts = { ...defaultLayoutOptions, ...options };
  
  // 构建树结构
  const nodeMap = new Map<string, Node>();
  nodes.forEach(node => nodeMap.set(node.id, node));
  
  // 找到根节点（没有入边的节点）
  const hasIncomingEdge = new Set<string>();
  edges.forEach(edge => hasIncomingEdge.add(edge.target));
  
  const rootNodes = nodes.filter(node => !hasIncomingEdge.has(node.id));
  if (rootNodes.length === 0) {
    // 如果没有根节点，选择第一个节点作为根
    if (nodes.length > 0) {
      rootNodes.push(nodes[0]);
    }
  }
  
  // 构建邻接表
  const adjacencyList = new Map<string, string[]>();
  edges.forEach(edge => {
    if (!adjacencyList.has(edge.source)) {
      adjacencyList.set(edge.source, []);
    }
    adjacencyList.get(edge.source)!.push(edge.target);
  });
  
  // 构建树结构
  function buildTree(nodeId: string, visited = new Set<string>()): TreeNode | null {
    if (visited.has(nodeId)) return null; // 防止循环
    visited.add(nodeId);
    
    const node = nodeMap.get(nodeId);
    if (!node) return null;
    
    const children: TreeNode[] = [];
    const childIds = adjacencyList.get(nodeId) || [];
    
    for (const childId of childIds) {
      const childTree = buildTree(childId, new Set(visited));
      if (childTree) {
        children.push(childTree);
      }
    }
    
    return {
      id: nodeId,
      children,
      node,
      x: 0,
      y: 0,
      width: opts.nodeWidth
    };
  }
  
  // 计算每个子树的宽度
  function calculateSubtreeWidth(tree: TreeNode): number {
    if (tree.children.length === 0) {
      return opts.nodeWidth;
    }
    
    let totalChildWidth = 0;
    tree.children.forEach(child => {
      totalChildWidth += calculateSubtreeWidth(child);
    });
    
    const spacingWidth = (tree.children.length - 1) * opts.horizontalSpacing;
    tree.width = Math.max(opts.nodeWidth, totalChildWidth + spacingWidth);
    return tree.width;
  }
  
  // 布局节点位置
  function layoutTree(tree: TreeNode, x: number, y: number): void {
    tree.x = x;
    tree.y = y;
    
    if (tree.children.length === 0) return;
    
    // 计算子节点的起始位置
    let totalChildWidth = 0;
    tree.children.forEach(child => {
      totalChildWidth += child.width;
    });
    
    const spacingWidth = (tree.children.length - 1) * opts.horizontalSpacing;
    const totalWidth = totalChildWidth + spacingWidth;
    let currentX = x - totalWidth / 2;
    
    tree.children.forEach(child => {
      const childCenterX = currentX + child.width / 2;
      layoutTree(child, childCenterX, y + opts.verticalSpacing);
      currentX += child.width + opts.horizontalSpacing;
    });
  }
  
  // 处理多个根节点
  const layoutedNodes: Node[] = [];
  let currentRootX = opts.rootX;
  
  rootNodes.forEach((rootNode, index) => {
    const tree = buildTree(rootNode.id);
    if (!tree) return;
    
    calculateSubtreeWidth(tree);
    layoutTree(tree, currentRootX, opts.rootY);
    
    // 收集所有节点的新位置
    function collectNodes(tree: TreeNode): void {
      const updatedNode: Node = {
        ...tree.node,
        position: { x: tree.x - opts.nodeWidth / 2, y: tree.y }
      };
      layoutedNodes.push(updatedNode);
      
      tree.children.forEach(child => collectNodes(child));
    }
    
    collectNodes(tree);
    
    // 为下一个根节点留出空间
    currentRootX += tree.width + opts.horizontalSpacing * 2;
  });
  
  // 处理没有被包含在树中的孤立节点
  const processedIds = new Set(layoutedNodes.map(n => n.id));
  const orphanNodes = nodes.filter(n => !processedIds.has(n.id));
  
  orphanNodes.forEach((node, index) => {
    layoutedNodes.push({
      ...node,
      position: {
        x: currentRootX + index * (opts.nodeWidth + opts.horizontalSpacing),
        y: opts.rootY
      }
    });
  });
  
  return layoutedNodes;
}

// 散乱分布功能
export function scatterNodes(nodes: Node[], canvasWidth = 1200, canvasHeight = 800): Node[] {
  const margin = 100;
  
  return nodes.map((node) => {
    const newX = margin + Math.random() * (canvasWidth - 2 * margin);
    const newY = margin + Math.random() * (canvasHeight - 2 * margin);
    
    return {
      ...node,
      position: { x: newX, y: newY }
    };
  });
}
