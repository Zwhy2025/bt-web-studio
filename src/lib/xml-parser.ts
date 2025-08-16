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
  try {
    // 添加详细的调试信息
    console.log('[XML Parser] Starting XML parse, input length:', xmlString?.length || 0);
    console.log('[XML Parser] XML content preview:', xmlString?.substring(0, 200) || 'EMPTY');
    
    // 检查输入是否为空或无效
    if (!xmlString || xmlString.trim().length === 0) {
      console.error('[XML Parser] Empty or null XML string received');
      throw new Error('XML字符串为空或无效');
    }
    
    // 为了在浏览器环境中解析 XML，我们可以使用 DOMParser
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString.trim(), 'text/xml');
    
    // 检查解析错误
    const parserError = xmlDoc.querySelector('parsererror');
    if (parserError) {
      console.error('[XML Parser] DOMParser error:', parserError.textContent);
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
  
  // 提取 TreeNodesModel 中的节点定义信息（包括子树定义）
  const treeNodesModel = rootTree.querySelector('TreeNodesModel');
  const nodeDefinitions: Record<string, any> = {};
  
  if (treeNodesModel) {
    // 解析所有节点定义
    const nodeElements = treeNodesModel.querySelectorAll('Action, Condition, Control, Decorator, SubTree');
    nodeElements.forEach(element => {
      const nodeId = element.getAttribute('ID');
      if (nodeId) {
        const ports: any[] = [];
        // 提取输入端口
        const inputPorts = element.querySelectorAll('input_port');
        inputPorts.forEach(port => {
          ports.push({
            type: 'input',
            name: port.getAttribute('name') || '',
            dataType: port.getAttribute('type') || '',
            default: port.getAttribute('default') || '',
            description: port.textContent || ''
          });
        });
        
        // 提取输出端口
        const outputPorts = element.querySelectorAll('output_port');
        outputPorts.forEach(port => {
          ports.push({
            type: 'output',
            name: port.getAttribute('name') || '',
            dataType: port.getAttribute('type') || '',
            default: port.getAttribute('default') || '',
            description: port.textContent || ''
          });
        });
        
        // 提取输入输出端口
        const inoutPorts = element.querySelectorAll('inout_port');
        inoutPorts.forEach(port => {
          ports.push({
            type: 'inout',
            name: port.getAttribute('name') || '',
            dataType: port.getAttribute('type') || '',
            default: port.getAttribute('default') || '',
            description: port.textContent || ''
          });
        });
        
        nodeDefinitions[nodeId] = {
          id: nodeId,
          type: element.tagName,
          ports
        };
      }
    });
  }
  
  // 递归解析节点
  const parsedNodes: ParsedTreeNode[] = [];
  const edges: BehaviorTreeEdge[] = [];
  
  // 节点ID计数器，确保唯一性
  const nodeIdCounter = { value: 1 };
  
  // 从 mainTree 的直接子元素开始解析
  const rootNodeElement = mainTree.firstElementChild;
  if (rootNodeElement) {
    // 为根节点分配一个 ID（如果XML中没有提供）
    const rootXmlNodeId = rootNodeElement.getAttribute('_uid') || rootNodeElement.getAttribute('_node_uid') || rootNodeElement.getAttribute('ID') || `root-node`;
    
    console.log(`[XML Parser] Root node ID: ${rootXmlNodeId}, type: ${rootNodeElement.tagName}`);
    
    // 解析根节点
    const parsedRootNode = parseXmlNode(rootNodeElement, rootXmlNodeId);
    parsedNodes.push(parsedRootNode);
    
    // 递归解析子节点并创建边
    parseChildNodes(rootNodeElement, rootXmlNodeId, parsedNodes, edges, nodeIdCounter);
  }
  
  // 将解析后的节点转换为 BehaviorTreeNode 格式
  const nodes: BehaviorTreeNode[] = parsedNodes.map(node => {
    // 改进的节点类型映射，支持更多BehaviorTree.CPP标准节点
    let nodeType = 'unknown';
    const nodeTypeLower = node.type.toLowerCase();
    
    // 直接匹配标准BehaviorTree.CPP节点类型
    if (node.type === 'Sequence' || nodeTypeLower.includes('sequence')) {
      nodeType = nodeTypeLower.includes('reactive') ? 'ReactiveSequence' : 
                 node.type.includes('*') ? 'Sequence*' : 'Sequence';
    } else if (node.type === 'Fallback' || node.type === 'Selector' || nodeTypeLower.includes('fallback') || nodeTypeLower.includes('selector')) {
      nodeType = nodeTypeLower.includes('reactive') ? 'ReactiveFallback' : 
                 node.type.includes('*') ? 'Fallback*' : 'Fallback';
    } else if (node.type === 'Parallel' || nodeTypeLower.includes('parallel')) {
      nodeType = 'Parallel';
    } else if (node.type === 'Inverter' || nodeTypeLower.includes('inverter') || node.type === 'NOT') {
      nodeType = 'Inverter';
    } else if (nodeTypeLower.includes('retry')) {
      nodeType = 'Retry';
    } else if (nodeTypeLower.includes('repeat')) {
      nodeType = 'Repeat';
    } else if (nodeTypeLower.includes('timeout')) {
      nodeType = 'Timeout';
    } else if (nodeTypeLower.includes('delay')) {
      nodeType = 'Delay';
    } else if (nodeTypeLower.includes('forcesuccess') || nodeTypeLower.includes('alwayssuccess')) {
      nodeType = 'ForceSuccess';
    } else if (nodeTypeLower.includes('forcefailure') || nodeTypeLower.includes('alwaysfailure')) {
      nodeType = 'ForceFailure';
    } else if (nodeTypeLower.includes('subtree')) {
      nodeType = 'subtree';
    } else if (nodeTypeLower.includes('script')) {
      nodeType = 'Script';
    } else if (nodeTypeLower.includes('setblackboard')) {
      nodeType = 'SetBlackboard';
    } else if (nodeTypeLower.includes('checkblackboard')) {
      nodeType = 'CheckBlackboard';
    } else if (nodeTypeLower.includes('compareblackboard')) {
      nodeType = 'CompareBlackboard';
    } else if (nodeTypeLower.includes('sleep')) {
      nodeType = 'Sleep';
    } else if (nodeTypeLower.includes('log')) {
      nodeType = 'Log';
    } else if (nodeTypeLower.includes('switch')) {
      nodeType = 'Switch';
    } else if (nodeTypeLower.includes('ifthenelse')) {
      nodeType = 'IfThenElse';
    } else if (nodeTypeLower.includes('whiledoelse')) {
      nodeType = 'WhileDoElse';
    } else if (nodeTypeLower.includes('manualselector')) {
      nodeType = 'ManualSelector';
    } else if (nodeTypeLower.includes('action') || (!nodeTypeLower.includes('condition') && !nodeTypeLower.includes('control') && !nodeTypeLower.includes('decorator'))) {
      // 对于未知的节点类型，根据常见模式进行分类
      if (nodeTypeLower.includes('door') || nodeTypeLower.includes('position') || nodeTypeLower.includes('move') || nodeTypeLower.includes('pass')) {
        nodeType = 'action'; // 用户自定义的Action节点
      } else if (nodeTypeLower.includes('is') || nodeTypeLower.includes('check') || nodeTypeLower.includes('has')) {
        nodeType = 'condition'; // 用户自定义的Condition节点
      } else {
        nodeType = 'action'; // 默认为action类型
      }
    } else if (nodeTypeLower.includes('condition')) {
      nodeType = 'condition';
    } else if (nodeTypeLower.includes('decorator')) {
      nodeType = 'decorator';
    }
    
    console.log(`[XML Parser] Mapped node type '${node.type}' -> '${nodeType}'`);
    
    // 特殊处理子树节点
    const isSubtreeNode = nodeType === 'subtree';
    const subtreeData: any = {
      label: node.name || node.type,
      subtitle: node.attributes._description || Object.keys(node.attributes).length > 0 ? `${Object.keys(node.attributes).length} params` : undefined,
      status: NodeStatus.IDLE,
      parameters: node.attributes,
      description: node.attributes._description || '',
      breakpoint: false
    };
    
    // 如果是子树节点，添加子树相关属性
    if (isSubtreeNode) {
      subtreeData.isSubtreeReference = true;
      subtreeData.subtreeId = node.attributes.ID || node.attributes.name || 'UnknownSubtree';
      // 提取子树参数（除了特殊属性外的所有属性）
      const { ID, name, _uid, _fullpath, _description, ...subtreeParams } = node.attributes;
      subtreeData.subtreeParameters = subtreeParams;
      
      // 如果有节点定义信息，添加端口信息
      if (nodeDefinitions[subtreeData.subtreeId]) {
        subtreeData.subtreeDefinition = nodeDefinitions[subtreeData.subtreeId];
      }
    }
    
    return {
      id: node.id,
      type: nodeType,
      position: { x: 0, y: 0 }, // 初始位置，后续可以进行自动布局
      data: subtreeData
    };
  });
  
  console.log(`[XML Parser] Successfully parsed ${nodes.length} nodes and ${edges.length} edges`);
  return { nodes, edges };
  } catch (error) {
    console.error('[XML Parser] Failed to parse tree XML:', error);
    throw error;
  }
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
  edges: BehaviorTreeEdge[],
  nodeIdCounter: { value: number }
) {
  // 遍历所有直接子元素
  for (let i = 0; i < parentElement.children.length; i++) {
    const childElement = parentElement.children[i];
    
    // 为子节点分配唯一ID，优先使用XML中的_uid属性
    let childId = childElement.getAttribute('_uid') || childElement.getAttribute('_node_uid') || childElement.getAttribute('ID');
    if (!childId) {
      childId = `node-${nodeIdCounter.value++}`;
    }
    
    console.log(`[XML Parser] Child node: ${childElement.tagName} with ID: ${childId}, parent: ${parentId}`);
    
    // 检查是否已经存在此节点ID（防止重复）
    const existingNode = nodes.find(n => n.id === childId);
    if (existingNode) {
      console.warn(`[XML Parser] Duplicate node ID detected: ${childId}, skipping...`);
      continue;
    }
    
    // 解析子节点
    const parsedChildNode = parseXmlNode(childElement, childId);
    nodes.push(parsedChildNode);
    
    // 创建从父节点到子节点的边
    const edge: BehaviorTreeEdge = {
      id: `edge-${parentId}-${childId}`,
      source: parentId,
      target: childId,
      type: 'smoothstep',
      animated: false,
      data: {
        executionCount: 0,
        lastExecutionTime: 0
      }
    };
    edges.push(edge);
    
    console.log(`[XML Parser] Created edge: ${parentId} -> ${childId}`);
    
    // 递归解析子节点的子节点，但不解析SubTree节点的子节点
    // SubTree节点引用其他行为树，不应在此处递归解析
    if (childElement.tagName !== 'SubTree') {
      parseChildNodes(childElement, childId, nodes, edges, nodeIdCounter);
    }
  }
}