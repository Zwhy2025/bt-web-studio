import { useCallback } from 'react';
import { useBehaviorTreeStore } from '@/core/store/behavior-tree-store';

/**
 * Root节点处理Hook
 * 处理Root节点的特殊逻辑和约束
 */
export const useRootNodeHandler = () => {
  const nodes = useBehaviorTreeStore((state) => state.nodes);
  const actions = useBehaviorTreeStore((state) => state.actions);

  /**
   * 设置节点为Root节点
   * @param nodeId 节点ID
   */
  const setAsRootNode = useCallback((nodeId: string) => {
    // 1. 清除其他节点的Root标记
    nodes.forEach((node) => {
      if (node.id !== nodeId && (node.data as any)?.instanceName === 'root') {
        actions.updateNode(node.id, { 
          data: { 
            ...node.data, 
            instanceName: (node.data as any)?.instanceName === 'root' ? '' : (node.data as any)?.instanceName 
          } 
        } as any);
      }
    });

    // 2. 设置当前节点为Root节点
    const targetNode = nodes.find((n) => n.id === nodeId);
    if (targetNode) {
      actions.updateNode(nodeId, { 
        data: { 
          ...targetNode.data, 
          instanceName: 'root',
          modelName: 'Sequence',
          inputs: [] // Root节点不允许有输入端口
        } 
      } as any);
    }
  }, [nodes, actions]);

  /**
   * 检查是否可以设置为Root节点
   * @param nodeId 节点ID
   * @returns 是否可以设置为Root节点
   */
  const canSetAsRoot = useCallback((nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return false;

    // 检查节点类型是否支持作为Root节点
    // 通常Control类型的节点可以作为Root节点
    const category = (node.data as any)?.category;
    return category === 'control' || category === 'subtree';
  }, [nodes]);

  /**
   * 获取Root节点
   * @returns Root节点或null
   */
  const getRootNode = useCallback(() => {
    return nodes.find((node) => (node.data as any)?.instanceName === 'root') || null;
  }, [nodes]);

  /**
   * 检查是否为Root节点
   * @param nodeId 节点ID
   * @returns 是否为Root节点
   */
  const isRootNode = useCallback((nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    return node ? (node.data as any)?.instanceName === 'root' : false;
  }, [nodes]);

  return {
    setAsRootNode,
    canSetAsRoot,
    getRootNode,
    isRootNode
  };
};