// src/lib/xml-parser.ts
import { BehaviorTreeNode, BehaviorTreeEdge, NodeStatus } from '@/store/behavior-tree-store';

// 定义 XML 解析后的行为树节点结构
interface ParsedTreeNode {
  id: string;
  name: string;
  type: string;
  attributes: Record<string, string>;
  children: ParsedTreeNode[];
}

/**
 * 将 XML 字符串解析为节点和边
 * @param xmlString - XML 字符串
 * @returns 包含节点和边的Promise
 */
export async function parseXmlToBehaviorTree(xmlString: string): Promise<{ nodes: BehaviorTreeNode[], edges: BehaviorTreeEdge[] }> {
  // 为了在浏览器环境中解析 XML，我们可以使用 DOMParser
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
  
  // 检查解析错误
  const parserError = xmlDoc.querySelector('parsererror');
  if (parserError) {
    throw new Error(`XML解析错误: ${parserError.textContent}`);
  }
  
  // 查找根行为树元素
  const rootTree = xmlDoc.querySelector('root');
  if (!rootTree) {
    throw new Error('未找到根 <root> 元素');
  }
  
  // 解析树的主要信息
  const mainTree = rootTree.querySelector('BehaviorTree');
  if (!mainTree) {
    throw new Error('未找到 <BehaviorTree> 元素');
  }
  
  // 获取树的名称
  const treeName = mainTree.getAttribute('ID') || 'DefaultTree';
  
  // 递归解析节点
  const parsedNodes: ParsedTreeNode[] = [];
  const edges: BehaviorTreeEdge[] = [];
  
  // 从 mainTree 的直接子元素开始解析
  const rootNodeElement = mainTree.firstElementChild;
  if (rootNodeElement) {
    // 为根节点分配一个 ID（如果XML中没有提供）
    const rootXmlNodeId = rootNodeElement.getAttribute('_node_uid') || rootNodeElement.getAttribute('ID') || `node-${Date.now()}`;
    
    // 解析根节点
    const parsedRootNode = parseXmlNode(rootNodeElement, rootXmlNodeId);
    parsedNodes.push(parsedRootNode);
    
    // 递归解析子节点并创建边
    parseChildNodes(rootNodeElement, rootXmlNodeId, parsedNodes, edges);
  }
  
  // 将解析后的节点转换为 BehaviorTreeNode 格式
  const nodes: BehaviorTreeNode[] = parsedNodes.map(node => {
    // 将 XML 节点类型映射到 ReactFlow 节点类型
    // 这里需要根据你的实际节点类型定义进行调整
    let nodeType = 'unknown';
    if (node.type.startsWith('Action')) {
      nodeType = 'action';
    } else if (node.type.startsWith('Condition')) {
      nodeType = 'condition';
    } else if (node.type.startsWith('Control')) {
      if (node.type.includes('Sequence')) {
        nodeType = 'control-sequence';
      } else if (node.type.includes('Fallback') || node.type.includes('Selector')) {
        nodeType = 'control-fallback';
      } else if (node.type.includes('Parallel')) {
        nodeType = 'control-parallel';
      } else {
        nodeType = 'control';
      }
    } else if (node.type.startsWith('Decorator')) {
      nodeType = 'decorator';
    } else if (node.type.startsWith('SubTree')) {
      nodeType = 'subtree';
    }
    
    return {
      id: node.id,
      type: nodeType,
      position: { x: 0, y: 0 }, // 初始位置，后续可以进行自动布局
      data: {
        label: `${node.name} (${node.type})`,
        status: NodeStatus.IDLE,
        parameters: node.attributes,
        description: node.attributes._description || ''
      }
    };
  });
  
  return { nodes, edges };
}

/**
 * 递归解析 XML 节点
 * @param element - 当前XML元素
 * @param id - 节点ID
 * @returns 解析后的节点对象
 */
function parseXmlNode(element: Element, id: string): ParsedTreeNode {
  const nodeName = element.tagName;
  const nodeType = element.tagName;
  
  // 提取属性
  const attributes: Record<string, string> = {};
  for (let i = 0; i < element.attributes.length; i++) {
    const attr = element.attributes[i];
    attributes[attr.name] = attr.value;
  }
  
  return {
    id,
    name: nodeName,
    type: nodeType,
    attributes,
    children: []
  };
}

/**
 * 递归解析子节点并创建边
 * @param parentElement - 父XML元素
 * @param parentId - 父节点ID
 * @param nodes - 节点数组（用于添加新解析的节点）
 * @param edges - 边数组（用于添加新创建的边）
 */
function parseChildNodes(
  parentElement: Element, 
  parentId: string, 
  nodes: ParsedTreeNode[], 
  edges: BehaviorTreeEdge[]
) {
  // 遍历所有直接子元素
  for (let i = 0; i < parentElement.children.length; i++) {
    const childElement = parentElement.children[i];
    // 为子节点分配ID
    const childId = childElement.getAttribute('_node_uid') || childElement.getAttribute('ID') || `node-${Date.now()}-${i}`;
    
    // 解析子节点
    const parsedChildNode = parseXmlNode(childElement, childId);
    nodes.push(parsedChildNode);
    
    // 创建从父节点到子节点的边
    const edge: BehaviorTreeEdge = {
      id: `edge-${parentId}-${childId}`,
      source: parentId,
      target: childId,
      type: 'smoothstep', // 或者其他你使用的边类型
      animated: false,
      data: {
        executionCount: 0,
        lastExecutionTime: 0
      }
    };
    edges.push(edge);
    
    // 递归解析子节点的子节点
    parseChildNodes(childElement, childId, nodes, edges);
  }
}