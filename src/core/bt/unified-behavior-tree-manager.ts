// src/lib/unified-behavior-tree-manager.ts
import { Node, Edge } from "reactflow";
import type { BehaviorTreeNode, BehaviorTreeEdge } from '@/core/store/behavior-tree-store';
import { NodeStatus } from '@/core/store/behavior-tree-store';
import { globalXmlProcessor } from '@/core/bt/global-xml-processor';

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
  private subtreeRelations: Map<string, string[]> = new Map(); // 父树ID -> 子树ID列表

  private constructor() { }

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

      // 提取并注册所有子树定义
      await this.extractAndRegisterSubtrees(xmlContent);

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

    const { applyBehaviorTreeLayout } = await import('@/core/bt/behavior-tree-layout');
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
   * 注册行为树（用于子树管理）
   */
  public registerTree(treeData: BehaviorTreeData): void {
    this.parsedTrees.set(treeData.id, treeData);
    console.log('[BehaviorTreeManager] 已注册行为树:', treeData.id);
  }

  /**
   * 获取行为树
   */
  public getTree(treeId: string): BehaviorTreeData | null {
    return this.parsedTrees.get(treeId) || null;
  }

  /**
   * 建立子树关系
   */
  public addSubtreeRelation(parentTreeId: string, subtreeId: string): void {
    if (!this.subtreeRelations.has(parentTreeId)) {
      this.subtreeRelations.set(parentTreeId, []);
    }
    const subtrees = this.subtreeRelations.get(parentTreeId)!;
    if (!subtrees.includes(subtreeId)) {
      subtrees.push(subtreeId);
      console.log(`[BehaviorTreeManager] 建立子树关系: ${parentTreeId} -> ${subtreeId}`);
    }
  }

  /**
   * 获取子树列表
   */
  public getSubtrees(parentTreeId: string): string[] {
    return this.subtreeRelations.get(parentTreeId) || [];
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
      this.subtreeRelations.delete(treeId);
      console.log('[BehaviorTreeManager] 已清除缓存:', treeId);
    } else {
      this.parsedTrees.clear();
      this.runtimeTrees.clear();
      this.subtreeRelations.clear();
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
   * 提取并注册所有子树定义
   */
  private async extractAndRegisterSubtrees(xmlContent: string): Promise<void> {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlContent, "text/xml");
      const rootElement = xmlDoc.querySelector("root");

      if (!rootElement) return;

      // 获取所有行为树定义
      const behaviorTrees = rootElement.querySelectorAll("BehaviorTree");

      for (const tree of Array.from(behaviorTrees)) {
        const treeId = tree.getAttribute("ID");
        if (!treeId) continue;

        // 跳过主树（已经在主解析中处理）
        if (this.parsedTrees.has(treeId)) continue;

        console.log(`[BehaviorTreeManager] 发现子树定义: ${treeId}`);

        // 解析子树的节点和边
        const subtreeNodes: Node[] = [];
        const subtreeEdges: Edge[] = [];
        let nodeIdCounter = 0;

        // 递归处理子树节点
        const processSubtreeNode = (element: Element, parentId?: string, depth: number = 0): string | undefined => {
          if (!element || element.nodeType !== 1) return;

          const nodeName = element.nodeName;
          const nodeId = element.getAttribute("_uid") || `${treeId}_node_${nodeIdCounter++}`;

          const nodeTypeMap = {
            Action: "action",
            Condition: "condition",
            Sequence: "control-sequence",
            Selector: "control-selector",
            Decorator: "decorator",
            SubTree: "subtree",
          };
          const nodeType = nodeTypeMap[nodeName as keyof typeof nodeTypeMap] || "action";

          // 获取节点属性
          const attributes: Record<string, string> = {};
          Array.from(element.attributes).forEach(attr => {
            attributes[attr.name] = attr.value;
          });

          // 创建节点
          subtreeNodes.push({
            id: nodeId,
            type: nodeType,
            position: { x: 100 + depth * 150, y: 100 + subtreeNodes.length * 80 },
            data: {
              label: nodeName + (attributes.name ? `: ${attributes.name}` : ""),
              attributes
            }
          });

          // 如果有父节点，创建边
          if (parentId) {
            const edgeId = `${treeId}_edge_${parentId}_${nodeId}`;
            subtreeEdges.push({
              id: edgeId,
              source: parentId,
              target: nodeId,
              sourceHandle: "out",
              targetHandle: "in"
            });
          }

          // 处理子节点
          Array.from(element.children).forEach(child => {
            processSubtreeNode(child, nodeId, depth + 1);
          });

          return nodeId;
        };

        // 从子树的根节点开始处理
        const subtreeRoot = tree.firstElementChild;
        if (subtreeRoot) {
          processSubtreeNode(subtreeRoot);
        }

        // 创建子树数据并注册
        const subtreeData: BehaviorTreeData = {
          id: treeId,
          name: treeId,
          sourceType: 'file',
          sourceHash: this.generateHash(xmlContent),
          xmlContent: tree.outerHTML,
          nodes: subtreeNodes,
          edges: subtreeEdges,
          metadata: {
            nodeDefinitions: {},
            treeDefinitions: {},
            layoutApplied: false,
            lastParsed: new Date()
          }
        };

        // 注册子树
        this.parsedTrees.set(treeId, subtreeData);
        console.log(`[BehaviorTreeManager] 已注册子树: ${treeId} (${subtreeNodes.length} 个节点)`);
      }
    } catch (error) {
      console.error('[BehaviorTreeManager] 子树提取失败:', error);
    }
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

// 统一的子树导入处理函数
export async function handleSubtreeImport(
  subtreeData: BehaviorTreeData,
  source: 'file' | 'remote',
  parentTreeId?: string
): Promise<void> {
  console.log(`🌳 Processing subtree import from ${source}:`, subtreeData.id);

  // 1. 注册子树到管理器
  behaviorTreeManager.registerTree(subtreeData);

  // 2. 如果有父树，建立引用关系
  if (parentTreeId) {
    const parentTree = behaviorTreeManager.getTree(parentTreeId);
    if (parentTree) {
      // 查找父树中的子树引用节点并更新
      const subtreeRefNodes = parentTree.nodes.filter(node =>
        node.type === 'subtree' &&
        (node.data.subtreeId === subtreeData.id || node.data.label === subtreeData.id)
      );

      subtreeRefNodes.forEach(refNode => {
        refNode.data.subtreeId = subtreeData.id;
        refNode.data.isSubtreeReference = true;
        refNode.data.label = `SubTree: ${subtreeData.id}`;
        // 确保子树引用节点有正确的展开状态
        refNode.data.isExpanded = false; // 默认折叠
      });

      console.log(`🔗 Updated ${subtreeRefNodes.length} subtree reference nodes in parent tree`);

      // 建立子树关系
      behaviorTreeManager.addSubtreeRelation(parentTreeId, subtreeData.id);
    }
  }

  // 3. 应用布局
  await applyLayoutUnified(subtreeData.id);

  console.log(`✅ Subtree ${subtreeData.id} imported successfully from ${source}`);
}

// 统一的子树展开/折叠处理函数
export function toggleSubtreeExpansion(
  parentTreeId: string,
  subtreeRefNodeId: string,
  expand: boolean
): { nodes: BehaviorTreeNode[], edges: BehaviorTreeEdge[] } | null {
  console.log(`🔄 Toggling subtree expansion: ${subtreeRefNodeId} -> ${expand ? 'expand' : 'collapse'}`);

  // 首先尝试从运行时数据获取
  let parentRuntimeData = behaviorTreeManager.getRuntimeData(parentTreeId);
  if (!parentRuntimeData) {
    // 如果运行时数据不存在，尝试从解析数据获取
    const parsedTree = behaviorTreeManager.getTree(parentTreeId);
    if (!parsedTree) {
      // 尝试查找所有已注册的树，看是否有匹配的
      const allTrees = behaviorTreeManager.getAllTrees();
      const foundTree = allTrees.find(tree =>
        tree.id === parentTreeId ||
        tree.id.includes(parentTreeId) ||
        parentTreeId.includes(tree.id)
      );

      if (foundTree) {
        console.log(`🔍 Found matching tree: ${foundTree.id} for requested: ${parentTreeId}`);
        parentRuntimeData = behaviorTreeManager.getRuntimeData(foundTree.id);
      }

      if (!parentRuntimeData) {
        console.error(`❌ Parent tree not found: ${parentTreeId}. Available trees:`,
          allTrees.map(t => t.id));
        return null;
      }
    } else {
      // 从解析数据创建运行时数据
      parentRuntimeData = behaviorTreeManager.getRuntimeData(parsedTree.id);
    }
  }

  if (!parentRuntimeData) {
    console.error(`❌ Parent runtime data not found: ${parentTreeId}`);
    return null;
  }

  const subtreeRefNode = parentRuntimeData.nodes.find(node => node.id === subtreeRefNodeId);
  if (!subtreeRefNode || !subtreeRefNode.data.isSubtreeReference) {
    console.error(`❌ Subtree reference node not found: ${subtreeRefNodeId}`);
    return null;
  }

  const subtreeId = subtreeRefNode.data.subtreeId;
  if (!subtreeId) {
    console.error(`❌ Subtree ID not found in reference node: ${subtreeRefNodeId}`);
    return null;
  }

  const subtree = behaviorTreeManager.getTree(subtreeId);
  if (!subtree) {
    console.error(`❌ Subtree not found: ${subtreeId}`);
    return null;
  }

  // 更新引用节点的展开状态
  (subtreeRefNode.data as any).isExpanded = expand;

  if (expand) {
    // 已展开则直接返回，避免重复添加
    const alreadyExpanded = parentRuntimeData.nodes.some(
      (n) => (n.data as any)?.parentSubtreeRef === subtreeRefNodeId
    );
    if (alreadyExpanded) {
      console.log(`⏭️ Subtree ${subtreeId} already expanded, skipping`);
      return { nodes: parentRuntimeData.nodes, edges: parentRuntimeData.edges };
    }

    // 展开：将子树节点添加到父树中
    const subtreeNodes = subtree.nodes.map(node => ({
      ...node,
      id: `${subtreeRefNodeId}_${node.id}`, // 添加前缀避免ID冲突
      data: {
        ...node.data,
        isSubtreeChild: true,
        parentSubtreeRef: subtreeRefNodeId,
        originalId: node.id
      },
      position: {
        x: subtreeRefNode.position.x + node.position.x,
        y: subtreeRefNode.position.y + 100 + node.position.y // 在引用节点下方展开
      }
    }));

    const subtreeEdges = subtree.edges.map(edge => ({
      ...edge,
      id: `${subtreeRefNodeId}_${edge.id}`,
      source: `${subtreeRefNodeId}_${edge.source}`,
      target: `${subtreeRefNodeId}_${edge.target}`,
      data: {
        ...edge.data,
        isSubtreeChild: true,
        parentSubtreeRef: subtreeRefNodeId
      }
    }));

    // 添加从引用节点到子树根节点的连接
    const subtreeRootNode = subtreeNodes.find(node =>
      (node.data as any).originalId === subtree.nodes[0]?.id
    );

    if (subtreeRootNode) {
      const connectionEdge: BehaviorTreeEdge = {
        id: `${subtreeRefNodeId}_connection`,
        source: subtreeRefNodeId,
        target: subtreeRootNode.id,
        sourceHandle: 'out',
        targetHandle: 'in',
        data: {
          executionCount: 0,
          lastExecutionTime: 0,
          isSubtreeConnection: true,
          parentSubtreeRef: subtreeRefNodeId
        }
      };
      subtreeEdges.push(connectionEdge);
    }

    // 合并节点和边
    const allNodes = [...parentRuntimeData.nodes, ...subtreeNodes];
    const allEdges = [...parentRuntimeData.edges, ...subtreeEdges];

    // 更新父树数据
    parentRuntimeData.nodes = allNodes as BehaviorTreeNode[];
    parentRuntimeData.edges = allEdges as BehaviorTreeEdge[];

    console.log(`✅ Expanded subtree ${subtreeId} with ${subtreeNodes.length} nodes`);
    return { nodes: allNodes as BehaviorTreeNode[], edges: allEdges as BehaviorTreeEdge[] };

  } else {
    // 折叠：移除子树节点
    const filteredNodes = parentRuntimeData.nodes.filter(node =>
      !(node.data as any).parentSubtreeRef || (node.data as any).parentSubtreeRef !== subtreeRefNodeId
    );

    const filteredEdges = parentRuntimeData.edges.filter(edge =>
      !(edge.data as any)?.parentSubtreeRef || (edge.data as any).parentSubtreeRef !== subtreeRefNodeId
    );

    // 更新父树数据
    parentRuntimeData.nodes = filteredNodes;
    parentRuntimeData.edges = filteredEdges;

    console.log(`✅ Collapsed subtree ${subtreeId}`);
    return { nodes: filteredNodes, edges: filteredEdges };
  }
}