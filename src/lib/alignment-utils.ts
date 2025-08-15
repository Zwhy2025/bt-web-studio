import { Node } from 'reactflow';

export interface AlignmentGuide {
  id: string;
  type: 'vertical' | 'horizontal';
  position: number;
  nodes: string[]; // 参与对齐的节点ID
}

export interface SnapResult {
  x: number;
  y: number;
  guides: AlignmentGuide[];
  snappedToGrid?: boolean;
}

export interface SelectionBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

// 网格吸附配置
export const GRID_SIZE = 20;
export const SNAP_THRESHOLD = 15; // 吸附阈值（像素）
export const NODE_WIDTH = 180;
export const NODE_HEIGHT = 60;

/**
 * 将坐标吸附到网格
 */
export function snapToGrid(x: number, y: number): { x: number; y: number } {
  return {
    x: Math.round(x / GRID_SIZE) * GRID_SIZE,
    y: Math.round(y / GRID_SIZE) * GRID_SIZE,
  };
}

/**
 * 计算选择框的边界
 */
export function getSelectionBounds(nodes: Node[]): SelectionBounds | null {
  if (nodes.length === 0) return null;

  const positions = nodes.map(node => {
    // 优先使用节点的实际尺寸，如果没有则使用默认值
    const width = node.width || NODE_WIDTH;
    const height = node.height || NODE_HEIGHT;
    
    return {
      left: node.position.x,
      right: node.position.x + width,
      top: node.position.y,
      bottom: node.position.y + height,
    };
  });

  const left = Math.min(...positions.map(p => p.left));
  const right = Math.max(...positions.map(p => p.right));
  const top = Math.min(...positions.map(p => p.top));
  const bottom = Math.max(...positions.map(p => p.bottom));

  return {
    left,
    right,
    top,
    bottom,
    width: right - left,
    height: bottom - top,
    centerX: left + (right - left) / 2,
    centerY: top + (bottom - top) / 2,
  };
}

/**
 * 检查点是否在矩形内
 */
export function isPointInRect(
  point: { x: number; y: number },
  rect: { x: number; y: number; width: number; height: number }
): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

/**
 * 橡皮框选择 - 获取框选范围内的节点
 */
export function getNodesInSelectionBox(
  nodes: Node[],
  selectionBox: { x: number; y: number; width: number; height: number }
): Node[] {
  return nodes.filter(node => {
    // 优先使用节点的实际尺寸，如果没有则使用默认值
    const width = node.width || NODE_WIDTH;
    const height = node.height || NODE_HEIGHT;
    
    const nodeRect = {
      x: node.position.x,
      y: node.position.y,
      width,
      height,
    };

    // 检查节点是否与选择框相交
    return !(
      nodeRect.x > selectionBox.x + selectionBox.width ||
      nodeRect.x + nodeRect.width < selectionBox.x ||
      nodeRect.y > selectionBox.y + selectionBox.height ||
      nodeRect.y + nodeRect.height < selectionBox.y
    );
  });
}

/**
 * 计算节点的对齐参考线
 */
export function calculateAlignmentGuides(
  draggingNode: Node,
  otherNodes: Node[],
  snapToGridEnabled = true
): SnapResult {
  const guides: AlignmentGuide[] = [];
  let snappedX = draggingNode.position.x;
  let snappedY = draggingNode.position.y;

  // 获取拖拽节点的实际尺寸
  const nodeWidth = draggingNode.width || NODE_WIDTH;
  const nodeHeight = draggingNode.height || NODE_HEIGHT;

  // 当前拖拽节点的边界
  const dragLeft = draggingNode.position.x;
  const dragRight = draggingNode.position.x + nodeWidth;
  const dragTop = draggingNode.position.y;
  const dragBottom = draggingNode.position.y + nodeHeight;
  const dragCenterX = draggingNode.position.x + nodeWidth / 2;
  const dragCenterY = draggingNode.position.y + nodeHeight / 2;

  // 收集所有可能的对齐位置
  const verticalAlignments: { position: number; nodes: string[] }[] = [];
  const horizontalAlignments: { position: number; nodes: string[] }[] = [];

  // 遍历其他节点，计算对齐位置
  otherNodes.forEach((node) => {
    if (node.id === draggingNode.id) return;

    // 获取当前节点的实际尺寸
    const currentNodeWidth = node.width || NODE_WIDTH;
    const currentNodeHeight = node.height || NODE_HEIGHT;

    const nodeLeft = node.position.x;
    const nodeRight = node.position.x + currentNodeWidth;
    const nodeTop = node.position.y;
    const nodeBottom = node.position.y + currentNodeHeight;
    const nodeCenterX = node.position.x + currentNodeWidth / 2;
    const nodeCenterY = node.position.y + currentNodeHeight / 2;

    // 垂直对齐线（X轴）
    const verticalCandidates = [
      { pos: nodeLeft, type: 'left' },
      { pos: nodeRight, type: 'right' },
      { pos: nodeCenterX, type: 'center' },
    ];

    verticalCandidates.forEach(({ pos }) => {
      const existing = verticalAlignments.find((v) => Math.abs(v.position - pos) < 1);
      if (existing) {
        existing.nodes.push(node.id);
      } else {
        verticalAlignments.push({ position: pos, nodes: [node.id] });
      }
    });

    // 水平对齐线（Y轴）
    const horizontalCandidates = [
      { pos: nodeTop, type: 'top' },
      { pos: nodeBottom, type: 'bottom' },
      { pos: nodeCenterY, type: 'center' },
    ];

    horizontalCandidates.forEach(({ pos }) => {
      const existing = horizontalAlignments.find((h) => Math.abs(h.position - pos) < 1);
      if (existing) {
        existing.nodes.push(node.id);
      } else {
        horizontalAlignments.push({ position: pos, nodes: [node.id] });
      }
    });
  });

  // 检查垂直吸附
  let bestVerticalSnap: { position: number; distance: number; nodes: string[]; alignType: string } | null = null;
  verticalAlignments.forEach(({ position, nodes }) => {
    // 检查左对齐
    const leftDistance = Math.abs(dragLeft - position);
    if (leftDistance <= SNAP_THRESHOLD && leftDistance < 5) { // 更严格的阈值
      if (!bestVerticalSnap || leftDistance < bestVerticalSnap.distance) {
        bestVerticalSnap = { position: position, distance: leftDistance, nodes, alignType: 'left' };
      }
    }

    // 检查右对齐
    const rightDistance = Math.abs(dragRight - position);
    if (rightDistance <= SNAP_THRESHOLD && rightDistance < 5) {
      const snapPosition = position - nodeWidth;
      if (!bestVerticalSnap || rightDistance < bestVerticalSnap.distance) {
        bestVerticalSnap = { position: snapPosition, distance: rightDistance, nodes, alignType: 'right' };
      }
    }

    // 检查中心对齐
    const centerDistance = Math.abs(dragCenterX - position);
    if (centerDistance <= SNAP_THRESHOLD && centerDistance < 5) {
      const snapPosition = position - nodeWidth / 2;
      if (!bestVerticalSnap || centerDistance < bestVerticalSnap.distance) {
        bestVerticalSnap = { position: snapPosition, distance: centerDistance, nodes, alignType: 'center' };
      }
    }
  });

  // 检查水平吸附
  let bestHorizontalSnap: { position: number; distance: number; nodes: string[]; alignType: string } | null = null;
  horizontalAlignments.forEach(({ position, nodes }) => {
    // 检查顶部对齐
    const topDistance = Math.abs(dragTop - position);
    if (topDistance <= SNAP_THRESHOLD && topDistance < 5) { // 更严格的阈值
      if (!bestHorizontalSnap || topDistance < bestHorizontalSnap.distance) {
        bestHorizontalSnap = { position: position, distance: topDistance, nodes, alignType: 'top' };
      }
    }

    // 检查底部对齐
    const bottomDistance = Math.abs(dragBottom - position);
    if (bottomDistance <= SNAP_THRESHOLD && bottomDistance < 5) {
      const snapPosition = position - nodeHeight;
      if (!bestHorizontalSnap || bottomDistance < bestHorizontalSnap.distance) {
        bestHorizontalSnap = { position: snapPosition, distance: bottomDistance, nodes, alignType: 'bottom' };
      }
    }

    // 检查中心对齐
    const centerDistance = Math.abs(dragCenterY - position);
    if (centerDistance <= SNAP_THRESHOLD && centerDistance < 5) {
      const snapPosition = position - nodeHeight / 2;
      if (!bestHorizontalSnap || centerDistance < bestHorizontalSnap.distance) {
        bestHorizontalSnap = { position: snapPosition, distance: centerDistance, nodes, alignType: 'center' };
      }
    }
  });

  // 应用吸附
  if (bestVerticalSnap) {
    snappedX = bestVerticalSnap.position;
    // 找到实际的对齐位置来显示参考线
    const alignPosition = verticalAlignments.find(v => 
      Math.abs(v.position - (bestVerticalSnap.position + nodeWidth / 2)) < 1 ||
      Math.abs(v.position - bestVerticalSnap.position) < 1 ||
      Math.abs(v.position - (bestVerticalSnap.position + nodeWidth)) < 1
    )?.position || bestVerticalSnap.position + nodeWidth / 2;
    
    guides.push({
      id: `vertical-${alignPosition}`,
      type: 'vertical',
      position: alignPosition,
      nodes: bestVerticalSnap.nodes,
    });
  }

  if (bestHorizontalSnap) {
    snappedY = bestHorizontalSnap.position;
    // 找到实际的对齐位置来显示参考线
    const alignPosition = horizontalAlignments.find(h => 
      Math.abs(h.position - (bestHorizontalSnap.position + nodeHeight / 2)) < 1 ||
      Math.abs(h.position - bestHorizontalSnap.position) < 1 ||
      Math.abs(h.position - (bestHorizontalSnap.position + nodeHeight)) < 1
    )?.position || bestHorizontalSnap.position + nodeHeight / 2;
    
    guides.push({
      id: `horizontal-${alignPosition}`,
      type: 'horizontal',
      position: alignPosition,
      nodes: bestHorizontalSnap.nodes,
    });
  }

  // 网格吸附（如果没有节点吸附或者启用了网格优先）
  if (snapToGridEnabled && (!bestVerticalSnap || !bestHorizontalSnap)) {
    const gridSnap = snapToGrid(
      bestVerticalSnap ? snappedX : draggingNode.position.x,
      bestHorizontalSnap ? snappedY : draggingNode.position.y
    );

    if (!bestVerticalSnap) {
      snappedX = gridSnap.x;
    }
    if (!bestHorizontalSnap) {
      snappedY = gridSnap.y;
    }
  }

  return {
    x: snappedX,
    y: snappedY,
    guides,
  };
}

/**
 * 批量对齐节点
 */
export function alignNodes(
  selectedNodes: Node[],
  alignType: 'left' | 'right' | 'center' | 'top' | 'bottom' | 'middle' | 'distribute-horizontal' | 'distribute-vertical'
): Node[] {
  if (selectedNodes.length < 2) return selectedNodes;

  switch (alignType) {
    case 'left': {
      const leftMost = Math.min(...selectedNodes.map(n => n.position.x));
      return selectedNodes.map(node => ({
        ...node,
        position: { ...node.position, x: leftMost }
      }));
    }

    case 'right': {
      const rightMost = Math.max(...selectedNodes.map(n => {
        const nodeWidth = n.width || NODE_WIDTH;
        return n.position.x + nodeWidth;
      }));
      return selectedNodes.map(node => {
        const nodeWidth = node.width || NODE_WIDTH;
        return {
          ...node,
          position: { ...node.position, x: rightMost - nodeWidth }
        };
      });
    }

    case 'center': {
      const centers = selectedNodes.map(n => {
        const nodeWidth = n.width || NODE_WIDTH;
        return n.position.x + nodeWidth / 2;
      });
      const avgCenter = centers.reduce((sum, c) => sum + c, 0) / centers.length;
      return selectedNodes.map(node => {
        const nodeWidth = node.width || NODE_WIDTH;
        return {
          ...node,
          position: { ...node.position, x: avgCenter - nodeWidth / 2 }
        };
      });
    }

    case 'top': {
      const topMost = Math.min(...selectedNodes.map(n => n.position.y));
      return selectedNodes.map(node => ({
        ...node,
        position: { ...node.position, y: topMost }
      }));
    }

    case 'bottom': {
      const bottomMost = Math.max(...selectedNodes.map(n => {
        const nodeHeight = n.height || NODE_HEIGHT;
        return n.position.y + nodeHeight;
      }));
      return selectedNodes.map(node => {
        const nodeHeight = node.height || NODE_HEIGHT;
        return {
          ...node,
          position: { ...node.position, y: bottomMost - nodeHeight }
        };
      });
    }

    case 'middle': {
      const middles = selectedNodes.map(n => {
        const nodeHeight = n.height || NODE_HEIGHT;
        return n.position.y + nodeHeight / 2;
      });
      const avgMiddle = middles.reduce((sum, m) => sum + m, 0) / middles.length;
      return selectedNodes.map(node => {
        const nodeHeight = node.height || NODE_HEIGHT;
        return {
          ...node,
          position: { ...node.position, y: avgMiddle - nodeHeight / 2 }
        };
      });
    }

    case 'distribute-horizontal': {
      const sorted = [...selectedNodes].sort((a, b) => a.position.x - b.position.x);
      const leftMost = sorted[0].position.x;
      const lastNodeWidth = sorted[sorted.length - 1].width || NODE_WIDTH;
      const rightMost = sorted[sorted.length - 1].position.x + lastNodeWidth;
      const totalWidth = rightMost - leftMost;
      const spacing = totalWidth / (sorted.length - 1);

      return sorted.map((node, index) => ({
        ...node,
        position: { ...node.position, x: leftMost + spacing * index }
      }));
    }

    case 'distribute-vertical': {
      const sorted = [...selectedNodes].sort((a, b) => a.position.y - b.position.y);
      const topMost = sorted[0].position.y;
      const lastNodeHeight = sorted[sorted.length - 1].height || NODE_HEIGHT;
      const bottomMost = sorted[sorted.length - 1].position.y + lastNodeHeight;
      const totalHeight = bottomMost - topMost;
      const spacing = totalHeight / (sorted.length - 1);

      return sorted.map((node, index) => ({
        ...node,
        position: { ...node.position, y: topMost + spacing * index }
      }));
    }

    default:
      return selectedNodes;
  }
}
