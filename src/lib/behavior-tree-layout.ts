import { BehaviorTreeNode, BehaviorTreeEdge } from '@/store/behavior-tree-store';
import { Node, Edge } from 'reactflow';

/**
 * 行为树专用布局算法
 * 使用分层布局，确保父子节点有清晰的层级关系
 */
export function applyBehaviorTreeLayout(nodes: BehaviorTreeNode[], edges: BehaviorTreeEdge[]): BehaviorTreeNode[] {
  // 创建节点映射以便快速查找
  const nodeMap = new Map<string, BehaviorTreeNode>();
  nodes.forEach(node => nodeMap.set(node.id, node));
  
  // 创建邻接表表示树结构
  const childrenMap = new Map<string, string[]>();
  const parentMap = new Map<string, string>();
  
  edges.forEach(edge => {
    // 初始化子节点数组
    if (!childrenMap.has(edge.source)) {
      childrenMap.set(edge.source, []);
    }
    childrenMap.get(edge.source)!.push(edge.target);
    parentMap.set(edge.target, edge.source);
  });
  
  // 计算每个节点的深度
  const depthMap = new Map<string, number>();
  
  function calculateDepth(nodeId: string, depth: number = 0): number {
    if (depthMap.has(nodeId)) {
      return depthMap.get(nodeId)!;
    }
    
    depthMap.set(nodeId, depth);
    
    const children = childrenMap.get(nodeId) || [];
    let maxChildDepth = depth;
    
    children.forEach(childId => {
      const childDepth = calculateDepth(childId, depth + 1);
      maxChildDepth = Math.max(maxChildDepth, childDepth);
    });
    
    return maxChildDepth;
  }
  
  // 找到根节点（没有父节点的节点）
  const rootNodes = nodes.filter(node => !parentMap.has(node.id));
  
  // 计算所有节点的深度
  rootNodes.forEach(rootNode => {
    calculateDepth(rootNode.id, 0);
  });
  
  // 按深度分组节点
  const nodesByDepth = new Map<number, BehaviorTreeNode[]>();
  
  nodes.forEach(node => {
    const depth = depthMap.get(node.id) || 0;
    if (!nodesByDepth.has(depth)) {
      nodesByDepth.set(depth, []);
    }
    nodesByDepth.get(depth)!.push(node);
  });
  
  // 设置节点位置
  const layoutedNodes: BehaviorTreeNode[] = [];
  const levelHeight = 120; // 每层之间的垂直间距
  const nodeWidth = 220; // 节点宽度
  const nodeHeight = 80; // 节点高度
  
  // 按深度逐层布局
  Array.from(nodesByDepth.keys())
    .sort((a, b) => a - b)
    .forEach(depth => {
      const nodesAtDepth = nodesByDepth.get(depth) || [];
      const levelWidth = nodesAtDepth.length * nodeWidth + (nodesAtDepth.length - 1) * 50;
      const startX = -levelWidth / 2;
      
      nodesAtDepth.forEach((node, index) => {
        layoutedNodes.push({
          ...node,
          position: {
            x: startX + index * (nodeWidth + 50),
            y: depth * levelHeight
          }
        });
      });
    });
  
  return layoutedNodes;
}