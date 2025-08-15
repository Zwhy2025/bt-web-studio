import { Node, Edge } from "reactflow";

/**
 * BehaviorTree.CPP XML格式处理工具
 * 提供XML解析与生成功能，支持与ReactFlow节点/边数据的相互转换
 */

// BehaviorTree节点类型映射
export const NodeTypeMap = {
  Action: "action",
  Condition: "condition",
  Sequence: "control-sequence",
  Selector: "control-selector",
  Decorator: "decorator",
  SubTree: "subtree",
};

// 反向映射
export const ReverseNodeTypeMap: Record<string, string> = Object.entries(NodeTypeMap).reduce(
  (acc, [key, value]) => {
    acc[value] = key;
    return acc;
  },
  {} as Record<string, string>
);

// 节点位置映射（用于保存/恢复布局）
interface NodePositionMap {
  [nodeId: string]: { x: number; y: number };
}

/**
 * 解析BehaviorTree.CPP XML字符串为ReactFlow节点和边
 * @param xmlString BehaviorTree.CPP XML字符串
 * @returns 解析后的节点和边数据
 */
export function parseXML(xmlString: string): { nodes: Node[], edges: Edge[], error?: string } {
  try {
    // 创建DOM解析器
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");
    
    // 检查解析错误
    const parseError = xmlDoc.querySelector("parsererror");
    if (parseError) {
      return { 
        nodes: [], 
        edges: [], 
        error: "XML解析错误: " + parseError.textContent 
      };
    }

    // 获取根节点
    const btRoot = xmlDoc.querySelector("BehaviorTree");
    if (!btRoot) {
      return { 
        nodes: [], 
        edges: [], 
        error: "无效的BehaviorTree XML: 缺少BehaviorTree根元素" 
      };
    }

    // 提取布局信息（如果有）
    const layoutData = xmlDoc.querySelector("TreeNodesModel");
    const nodePositions: NodePositionMap = {};
    
    if (layoutData) {
      const nodeModels = layoutData.querySelectorAll("Node");
      nodeModels.forEach(node => {
        const id = node.getAttribute("ID");
        const x = parseFloat(node.getAttribute("x") || "0");
        const y = parseFloat(node.getAttribute("y") || "0");
        if (id) {
          nodePositions[id] = { x, y };
        }
      });
    }

    // 解析节点和边
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    let nodeIdCounter = 0;
    
    // 递归处理XML树
    function processNode(element: Element, parentId?: string, depth: number = 0): string | undefined {
      const nodeName = element.nodeName;
      const nodeId = `node_${nodeIdCounter++}`;
      const nodeType = NodeTypeMap[nodeName as keyof typeof NodeTypeMap] || "action";
      
      // 获取节点属性
      const attributes: Record<string, string> = {};
      Array.from(element.attributes).forEach(attr => {
        attributes[attr.name] = attr.value;
      });
      
      // 创建节点
      const position = nodePositions[nodeId] || { 
        x: 100 + depth * 150, 
        y: 100 + nodes.length * 80 
      };
      
      nodes.push({
        id: nodeId,
        type: nodeType,
        position,
        data: { 
          label: nodeName + (attributes.name ? `: ${attributes.name}` : ""),
          attributes
        }
      });
      
      // 如果有父节点，创建边
      if (parentId) {
        edges.push({
          id: `edge_${parentId}_${nodeId}`,
          source: parentId,
          target: nodeId,
          sourceHandle: "out",
          targetHandle: "in"
        });
      }
      
      // 处理子节点
      Array.from(element.children).forEach(child => {
        processNode(child, nodeId, depth + 1);
      });
      
      return nodeId;
    }
    
    // 从根节点开始处理
    const rootElement = btRoot.firstElementChild;
    if (rootElement) {
      processNode(rootElement);
    } else {
      return { 
        nodes: [], 
        edges: [], 
        error: "无效的BehaviorTree XML: 缺少根控制节点" 
      };
    }
    
    return { nodes, edges };
  } catch (error) {
    return { 
      nodes: [], 
      edges: [], 
      error: `XML解析异常: ${(error as Error).message}` 
    };
  }
}

/**
 * 示例/测试XML - 用于开发和测试
 */
export const sampleXML = `<?xml version="1.0" encoding="UTF-8"?>
<root>
  <BehaviorTree ID="MainTree">
    <Sequence name="RootSequence">
      <Action name="ScanEnvironment" />
      <Condition name="TargetVisible" />
      <Selector name="ApproachOrSearch">
        <Action name="MoveToTarget" />
        <Action name="SearchTarget" />
      </Selector>
      <Action name="PerformTask" />
    </Sequence>
  </BehaviorTree>
  <TreeNodesModel>
    <Node ID="node_0" x="100" y="100" />
    <Node ID="node_1" x="100" y="200" />
    <Node ID="node_2" x="100" y="300" />
    <Node ID="node_3" x="250" y="300" />
    <Node ID="node_4" x="250" y="400" />
    <Node ID="node_5" x="100" y="500" />
  </TreeNodesModel>
</root>`;

/**
 * 将ReactFlow节点和边数据生成为BehaviorTree.CPP XML字符串
 * @param nodes ReactFlow节点数据
 * @param edges ReactFlow边数据
 * @returns 生成的XML字符串
 */
export function generateXML(nodes: Node[], edges: Edge[]): { xml: string, error?: string } {
  try {
    if (nodes.length === 0) {
      return { 
        xml: "", 
        error: "无法生成XML: 行为树为空，没有任何节点" 
      };
    }

    // 找到根节点（没有入边的节点）
    const targetNodeIds = new Set(edges.map(e => e.target));
    const rootNodes = nodes.filter(node => !targetNodeIds.has(node.id));
    
    if (rootNodes.length === 0) {
      return { 
        xml: "", 
        error: "无法生成XML: 找不到根节点（所有节点都有入边，可能存在循环）" 
      };
    }
    
    if (rootNodes.length > 1) {
      return { 
        xml: "", 
        error: `无法生成XML: 存在多个根节点 (${rootNodes.length}个)，行为树必须只有一个根节点` 
      };
    }

    // 检查是否有孤立节点
    const connectedNodes = new Set([...edges.map(e => e.source), ...edges.map(e => e.target)]);
    const isolatedNodes = nodes.filter(node => !connectedNodes.has(node.id) && node.id !== rootNodes[0].id);
    
    // 创建XML文档
    const xmlDoc = document.implementation.createDocument(null, "root", null);
    const root = xmlDoc.documentElement;
    
    // 创建BehaviorTree元素
    const btElement = xmlDoc.createElement("BehaviorTree");
    btElement.setAttribute("ID", "MainTree");
    root.appendChild(btElement);
    
    // 递归构建XML树
    function buildXmlTree(nodeId: string, parentElement: Element): void {
      const node = nodes.find(n => n.id === nodeId);
      if (!node) return;
      
      // 获取节点类型
      const nodeType = node.type || "action";
      const xmlNodeType = ReverseNodeTypeMap[nodeType] || "Action";
      
      // 创建节点元素
      const nodeElement = xmlDoc.createElement(xmlNodeType);
      
      // 添加属性
      if (node.data?.attributes) {
        Object.entries(node.data.attributes as Record<string, unknown>).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            nodeElement.setAttribute(key, String(value));
          }
        });
      }
      
      // 如果没有name属性但有label，使用label作为name
      if (!nodeElement.hasAttribute("name") && node.data?.label) {
        const label = node.data.label.toString();
        let namePart = label;
        
        // 提取冒号后的部分作为名称
        if (label.includes(":")) {
          namePart = label.split(":").slice(1).join(":").trim();
        }
        
        // 如果名称为空，使用节点类型
        if (!namePart) {
          namePart = xmlNodeType;
        }
        
        nodeElement.setAttribute("name", namePart);
      }
      
      parentElement.appendChild(nodeElement);
      
      // 处理子节点（按照连接顺序排序）
      const childEdges = edges
        .filter(e => e.source === nodeId)
        .sort((a, b) => {
          // 可以根据需要添加排序逻辑，比如按照目标节点的位置
          const nodeA = nodes.find(n => n.id === a.target);
          const nodeB = nodes.find(n => n.id === b.target);
          if (nodeA && nodeB) {
            return nodeA.position.y - nodeB.position.y;
          }
          return 0;
        });
      
      childEdges.forEach(edge => {
        buildXmlTree(edge.target, nodeElement);
      });
    }
    
    // 从根节点开始构建
    buildXmlTree(rootNodes[0].id, btElement);
    
    // 添加布局信息（可选）
    const layoutElement = xmlDoc.createElement("TreeNodesModel");
    nodes.forEach(node => {
      const nodeModel = xmlDoc.createElement("Node");
      nodeModel.setAttribute("ID", node.id);
      nodeModel.setAttribute("x", Math.round(node.position.x).toString());
      nodeModel.setAttribute("y", Math.round(node.position.y).toString());
      layoutElement.appendChild(nodeModel);
    });
    root.appendChild(layoutElement);
    
    // 生成格式化的XML字符串
    const serializer = new XMLSerializer();
    let xmlString = serializer.serializeToString(root);
    
    // 添加XML声明
    xmlString = '<?xml version="1.0" encoding="UTF-8"?>\n' + xmlString;
    
    // 简单格式化
    xmlString = formatXMLString(xmlString);
    
    return { xml: xmlString };
  } catch (error) {
    return { 
      xml: "", 
      error: `XML生成异常: ${(error as Error).message}` 
    };
  }
}

/**
 * 格式化XML字符串
 * @param xmlString 原始XML字符串
 * @returns 格式化后的XML字符串
 */
function formatXMLString(xmlString: string): string {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");
    
    // 检查解析错误
    const parseError = xmlDoc.querySelector("parsererror");
    if (parseError) {
      return xmlString; // 如果解析失败，返回原始字符串
    }
    
    const serializer = new XMLSerializer();
    let formatted = serializer.serializeToString(xmlDoc);
    
    // 移除多余的空白
    formatted = formatted.replace(/>\s+</g, '><');
    
    // 添加换行和缩进
    formatted = formatted.replace(/></g, '>\n<');
    
    const lines = formatted.split('\n');
    let indentLevel = 0;
    const indentedLines = lines.map(line => {
      const trimmed = line.trim();
      if (!trimmed) return '';
      
      // 减少缩进（结束标签）
      if (trimmed.startsWith('</')) {
        indentLevel = Math.max(0, indentLevel - 1);
      }
      
      const indented = '  '.repeat(indentLevel) + trimmed;
      
      // 增加缩进（开始标签，但不是自闭合标签）
      if (trimmed.startsWith('<') && !trimmed.startsWith('</') && !trimmed.endsWith('/>') && !trimmed.includes('<?xml')) {
        indentLevel++;
      }
      
      return indented;
    });
    
    return indentedLines.filter(line => line.trim()).join('\n');
  } catch (e) {
    // 如果格式化失败，返回原始字符串
    return xmlString;
  }
}

