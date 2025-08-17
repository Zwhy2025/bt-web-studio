// src/lib/xml-parser.ts
import { BehaviorTreeNode, BehaviorTreeEdge, NodeStatus } from '@/store/behavior-tree-store';
import { globalXmlProcessor } from '@/lib/global-xml-processor';

/**
 * 将 XML 字符串解析为节点和边
 * @param xmlString - XML 字符串
 * @returns 包含节点和边的Promise
 */
export async function parseXmlToBehaviorTree(xmlString: string): Promise<{ nodes: BehaviorTreeNode[], edges: BehaviorTreeEdge[] }> {
  try {
    // 使用全局XML处理器解析XML
    const result = globalXmlProcessor.parseXML(xmlString);
    
    if (result.error) {
      throw new Error(result.error);
    }
    
    // 转换节点和边格式
    const nodes: BehaviorTreeNode[] = result.nodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        status: NodeStatus.IDLE,
        breakpoint: false
      }
    })) as BehaviorTreeNode[];
    
    // 直接使用 globalXmlProcessor 返回的边，不需要重新生成
    const edges: BehaviorTreeEdge[] = result.edges.map(edge => ({
      ...edge,
      type: 'default'
    })) as BehaviorTreeEdge[];
    
    return { nodes, edges };
  } catch (error) {
    console.error('[XML Parser] Failed to parse tree XML:', error);
    throw error;
  }
}