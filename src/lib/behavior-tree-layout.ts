/**
 * 行为树专用布局算法
 * 实现类似Groot2的层次化布局
 */

import { Node, Edge } from 'reactflow';

export interface LayoutConfig {
  nodeWidth: number;
  nodeHeight: number;
  horizontalSpacing: number;
  verticalSpacing: number;
}

const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  nodeWidth: 200,
  nodeHeight: 60,
  horizontalSpacing: 50,
  verticalSpacing: 100,
};

/**
 * 计算行为树布局
 * @param nodes 节点数组
 * @param edges 边数组
 * @param config 布局配置
 * @returns 布局后的节点数组
 */
export function calculateBehaviorTreeLayout(
  nodes: Node[],
  edges: Edge[],
  config: LayoutConfig = DEFAULT_LAYOUT_CONFIG
): Node[] {
  if (nodes.length === 0) return nodes;

  // 构建树结构
  const nodeMap = new Map<string, Node>();
  const childrenMap = new Map<string, string[]>();
  const parentMap = new Map<string, string>();
  
  // 初始化映射
  nodes.forEach(node => {
    nodeMap.set(node.id, node);
    childrenMap.set(node.id, []);
  });

  // 构建父子关系
  edges.forEach(edge => {
    const children = childrenMap.get(edge.source) || [];
    children.push(edge.target);
    childrenMap.set(edge.source, children);
    parentMap.set(edge.target, edge.source);
  });

  // 找到根节点（没有父节点的节点）
  const rootNodes = nodes.filter(node => !parentMap.has(node.id));
  
  if (rootNodes.length === 0) {
    console.warn('No root node found, using first node as root');
    return nodes;
  }

  const rootNode = rootNodes[0];
  
  // 计算每个节点的层级和位置
  const layoutedNodes = new Map<string, Node>();
  const levelWidths = new Map<number, number>();
  
  // 第一遍：计算每个层级的宽度
  function calculateLevelWidths(nodeId: string, level: number): number {
    const children = childrenMap.get(nodeId) || [];
    
    if (children.length === 0) {
      // 叶子节点
      return config.nodeWidth;
    }
    
    // 递归计算子节点的总宽度
    let totalChildWidth = 0;
    children.forEach(childId => {
      totalChildWidth += calculateLevelWidths(childId, level + 1);
    });
    
    // 加上子节点之间的间距
    const childSpacing = (children.length - 1) * config.horizontalSpacing;
    const subtreeWidth = Math.max(config.nodeWidth, totalChildWidth + childSpacing);
    
    // 更新层级最大宽度
    const currentLevelWidth = levelWidths.get(level) || 0;
    levelWidths.set(level, Math.max(currentLevelWidth, subtreeWidth));
    
    return subtreeWidth;
  }
  
  calculateLevelWidths(rootNode.id, 0);
  
  // 第二遍：实际布局节点
  function layoutNode(nodeId: string, level: number, centerX: number): void {
    const node = nodeMap.get(nodeId);
    if (!node) return;
    
    const children = childrenMap.get(nodeId) || [];
    const y = level * (config.nodeHeight + config.verticalSpacing);
    
    // 设置当前节点位置
    const layoutedNode: Node = {
      ...node,
      position: {
        x: centerX - config.nodeWidth / 2,
        y: y
      }
    };
    layoutedNodes.set(nodeId, layoutedNode);
    
    if (children.length === 0) return;
    
    // 计算子节点的总宽度
    let totalChildWidth = 0;
    const childWidths: number[] = [];
    
    children.forEach(childId => {
      const childWidth = calculateSubtreeWidth(childId);
      childWidths.push(childWidth);
      totalChildWidth += childWidth;
    });
    
    // 计算子节点的起始位置
    const totalSpacing = (children.length - 1) * config.horizontalSpacing;
    const totalWidth = totalChildWidth + totalSpacing;
    let currentX = centerX - totalWidth / 2;
    
    // 布局子节点
    children.forEach((childId, index) => {
      const childCenterX = currentX + childWidths[index] / 2;
      layoutNode(childId, level + 1, childCenterX);
      currentX += childWidths[index] + config.horizontalSpacing;
    });
  }
  
  // 计算子树宽度的辅助函数
  function calculateSubtreeWidth(nodeId: string): number {
    const children = childrenMap.get(nodeId) || [];
    
    if (children.length === 0) {
      return config.nodeWidth;
    }
    
    let totalChildWidth = 0;
    children.forEach(childId => {
      totalChildWidth += calculateSubtreeWidth(childId);
    });
    
    const childSpacing = (children.length - 1) * config.horizontalSpacing;
    return Math.max(config.nodeWidth, totalChildWidth + childSpacing);
  }
  
  // 从根节点开始布局
  const rootWidth = calculateSubtreeWidth(rootNode.id);
  layoutNode(rootNode.id, 0, rootWidth / 2);
  
  // 返回布局后的节点数组
  return Array.from(layoutedNodes.values());
}

/**
 * 自动应用行为树布局到ReactFlow
 * @param nodes 当前节点
 * @param edges 当前边
 * @param config 布局配置
 * @returns 布局后的节点
 */
export function applyBehaviorTreeLayout(
  nodes: Node[],
  edges: Edge[],
  config?: Partial<LayoutConfig>
): Node[] {
  const finalConfig = { ...DEFAULT_LAYOUT_CONFIG, ...config };
  return calculateBehaviorTreeLayout(nodes, edges, finalConfig);
}
