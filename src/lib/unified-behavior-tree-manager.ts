// src/lib/unified-behavior-tree-manager.ts
import { Node, Edge } from "reactflow";
import { BehaviorTreeNode, BehaviorTreeEdge, NodeStatus } from '@/store/behavior-tree-store';

/**
 * 行为树原始数据结构（解析后的中间格式）
 */
export interface BehaviorTreeData {
  id: string;                    // 行为树唯一标识
  name: string;                  // 行为树名称
  sourceType: 'file' | 'remote'; // 数据来源
  sourceHash: string;            // 数据哈希，用于缓存
  xmlContent: string;            // 原始XML内容
  nodes: Node[];                 // ReactFlow节点
  edges: Edge[];                 // ReactFlow边
  metadata: {                    // 元数据
    nodeDefinitions: Record<string, any>;  // 节点定义
    treeDefinitions: Record<string, any>;  // 子树定义
    layoutApplied: boolean;      // 是否已应用布局
    lastParsed: Date;           // 最后解析时间
  };
}

/**
 * 行为树运行时数据（用于前端显示）
 */
export interface BehaviorTreeRuntimeData {
  id: string;
  nodes: BehaviorTreeNode[];     // 包含状态信息的节点
  edges: BehaviorTreeEdge[];     // 包含类型信息的边
  metadata: BehaviorTreeData['metadata'];
}

/**
 * 统一的行为树管理器
 */
class UnifiedBehaviorTreeManager {
  private static instance: UnifiedBehaviorTreeManager;
  private parsedTrees: Map<string, BehaviorTreeData> = new Map();
  private runtimeTrees: Map<string, BehaviorTreeRuntimeData> = new Map();

  private constructor() {}

  public static getInstance(): UnifiedBehaviorTreeManager {
    if (!UnifiedBehaviorTreeManager.instance) {
      UnifiedBehaviorTreeManager.instance = new UnifiedBehaviorTreeManager();
    }
    return UnifiedBehaviorTreeManager.instance;
  }

  /**
   * 统一的XML解析入口
   * @param xmlContent XML内容
   * @param sourceType 数据来源
   * @param treeId 可选的树ID
   * @returns 解析后的行为树数据
   */
  public async parseXML(
    xmlContent: string,
    sourceType: 'file' | 'remote',
    treeId?: string
  ): Promise<BehaviorTreeData> {
    // 生成内容哈希用于缓存
    const sourceHash = this.generateHash(xmlContent);
    const finalTreeId = treeId || `tree_${sourceHash.substring(0, 8)}`;

    // 检查缓存
    const cached = this.parsedTrees.get(finalTreeId);
    if (cached && cached.sourceHash === sourceHash) {
      console.log('[BehaviorTreeManager] 使用缓存的解析结果:', finalTreeId);
      return cached;
    }

    console.log('[BehaviorTreeManager] 开始解析XML:', {
      treeId: finalTreeId,
      sourceType,
      contentLength: xmlContent.length
    });

    try {
      // 使用global-xml-processor进行解析
      const { globalXmlProcessor } = await import('@/lib/global-xml-processor');
      const parseResult = globalXmlProcessor.parseXML(xmlContent);

      if (parseResult.error) {
        throw new Error(`XML解析失败: ${parseResult.error}`);
      }

      // 构建行为树数据
      const behaviorTreeData: BehaviorTreeData = {
        id: finalTreeId,
        name: this.extractTreeName(xmlContent) || finalTreeId,
        sourceType,
        sourceHash,
        xmlContent,
        nodes: parseResult.nodes,
        edges: parseResult.edges,
        metadata: {
          nodeDefinitions: {},
          treeDefinitions: {},
          layoutApplied: false,
          lastParsed: new Date()
        }
      };

      // 缓存解析结果
      this.parsedTrees.set(finalTreeId, behaviorTreeData);

      console.log('[BehaviorTreeManager] XML解析完成:', {
        treeId: finalTreeId,
        nodeCount: parseResult.nodes.length,
        edgeCount: parseResult.edges.length
      });

      return behaviorTreeData;
    } catch (error) {
      console.error('[BehaviorTreeManager] XML解析失败:', error);
      throw error;
    }
  }

  /**
   * 获取运行时数据（转换为包含状态的格式）
   * @param treeId 行为树ID
   * @returns 运行时数据
   */
  public getRuntimeData(treeId: string): BehaviorTreeRuntimeData | null {
    // 检查运行时缓存
    const cached = this.runtimeTrees.get(treeId);
    if (cached) {
      return cached;
    }

    // 从解析数据转换
    const parsedData = this.parsedTrees.get(treeId);
    if (!parsedData) {
      return null;
    }

    const runtimeData: BehaviorTreeRuntimeData = {
      id: treeId,
      nodes: parsedData.nodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          status: NodeStatus.IDLE,
          breakpoint: false
        }
      })) as BehaviorTreeNode[],
      edges: parsedData.edges.map(edge => ({
        ...edge,
        type: edge.type || 'default'
      })) as BehaviorTreeEdge[],
      metadata: parsedData.metadata
    };

    // 缓存运行时数据
    this.runtimeTrees.set(treeId, runtimeData);
    return runtimeData;
  }

  /**
   * 应用布局
   * @param treeId 行为树ID
   * @returns 应用布局后的节点
   */
  public async applyLayout(treeId: string): Promise<BehaviorTreeNode[]> {
    const runtimeData = this.getRuntimeData(treeId);
    if (!runtimeData) {
      throw new Error(`行为树不存在: ${treeId}`);
    }

    const { applyBehaviorTreeLayout } = await import('@/lib/behavior-tree-layout');
    const layoutedNodes = applyBehaviorTreeLayout(runtimeData.nodes, runtimeData.edges);

    // 更新运行时数据
    runtimeData.nodes = layoutedNodes;
    runtimeData.metadata.layoutApplied = true;
    this.runtimeTrees.set(treeId, runtimeData);

    // 同时更新解析数据
    const parsedData = this.parsedTrees.get(treeId);
    if (parsedData) {
      parsedData.metadata.layoutApplied = true;
    }

    console.log('[BehaviorTreeManager] 布局应用完成:', treeId);
    return layoutedNodes;
  }

  /**
   * 获取所有行为树列表
   */
  public getAllTrees(): BehaviorTreeData[] {
    return Array.from(this.parsedTrees.values());
  }

  /**
   * 清除缓存
   */
  public clearCache(treeId?: string): void {
    if (treeId) {
      this.parsedTrees.delete(treeId);
      this.runtimeTrees.delete(treeId);
      console.log('[BehaviorTreeManager] 已清除缓存:', treeId);
    } else {
      this.parsedTrees.clear();
      this.runtimeTrees.clear();
      console.log('[BehaviorTreeManager] 已清除所有缓存');
    }
  }

  /**
   * 生成内容哈希
   */
  private generateHash(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * 从XML中提取行为树名称
   */
  private extractTreeName(xmlContent: string): string | null {
    const match = xmlContent.match(/<BehaviorTree[^>]+ID\s*=\s*["']([^"']+)["']/);
    return match ? match[1] : null;
  }
}

// 导出单例实例
export const behaviorTreeManager = UnifiedBehaviorTreeManager.getInstance();

// 导出便捷函数
export async function parseXMLUnified(
  xmlContent: string,
  sourceType: 'file' | 'remote',
  treeId?: string
): Promise<BehaviorTreeData> {
  return behaviorTreeManager.parseXML(xmlContent, sourceType, treeId);
}

export function getRuntimeData(treeId: string): BehaviorTreeRuntimeData | null {
  return behaviorTreeManager.getRuntimeData(treeId);
}

export async function applyLayoutUnified(treeId: string): Promise<BehaviorTreeNode[]> {
  return behaviorTreeManager.applyLayout(treeId);
}
