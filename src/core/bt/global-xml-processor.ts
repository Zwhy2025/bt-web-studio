// src/lib/global-xml-processor.ts
import { Node, Edge } from "reactflow";
import { BehaviorTreeNode, BehaviorTreeEdge } from '@/core/store/behavior-tree-store';

// 全局XML处理类
class GlobalXmlProcessor {
  private static instance: GlobalXmlProcessor;
  private parsedData: {
    nodes: Node[],
    edges: Edge[],
    error?: string
  } | null = null;

  private constructor() { }

  // 获取单例实例
  public static getInstance(): GlobalXmlProcessor {
    if (!GlobalXmlProcessor.instance) {
      GlobalXmlProcessor.instance = new GlobalXmlProcessor();
    }
    return GlobalXmlProcessor.instance;
  }

  // 解析XML字符串
  public parseXML(xmlString: string): { nodes: Node[], edges: Edge[], error?: string } {
    try {
      console.log('[XML Parser] 开始解析XML，长度:', xmlString?.length || 0);
      console.log('[XML Parser] XML前100字符:', xmlString?.substring(0, 100));
      console.log('[XML Parser] XML类型:', typeof xmlString);
      console.log('[XML Parser] XML是否为空:', !xmlString);

      // 创建DOM解析器
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, "text/xml");
      console.log('[XML Parser] DOM解析完成');

      // 检查DOM文档
      console.log('[XML Parser] xmlDoc:', xmlDoc);
      console.log('[XML Parser] xmlDoc.documentElement:', xmlDoc.documentElement);

      // 检查解析错误
      const parseError = xmlDoc.querySelector("parsererror");
      if (parseError) {
        const error = "XML解析错误: " + parseError.textContent;
        this.parsedData = { nodes: [], edges: [], error };
        return this.parsedData;
      }

      // 获取根节点
      const rootElement = xmlDoc.querySelector("root");
      if (!rootElement) {
        const error = "无效的BehaviorTree XML: 缺少root根元素";
        this.parsedData = { nodes: [], edges: [], error };
        return this.parsedData;
      }

      // 获取主行为树
      const mainTree = rootElement.querySelector("BehaviorTree");
      if (!mainTree) {
        const error = "无效的BehaviorTree XML: 缺少BehaviorTree元素";
        this.parsedData = { nodes: [], edges: [], error };
        return this.parsedData;
      }

      // 提取所有行为树定义（包括子树）
      const treeDefinitions: Record<string, Element> = {};
      const behaviorTrees = rootElement.querySelectorAll("BehaviorTree");
      Array.from(behaviorTrees).forEach(tree => {
        const treeId = tree.getAttribute("ID");
        if (treeId) {
          treeDefinitions[treeId] = tree;
        }
      });

      // 提取节点定义信息（包括端口信息）
      const nodeDefinitions: Record<string, any> = {};
      const treeNodesModel = rootElement.querySelector("TreeNodesModel");
      if (treeNodesModel) {
        // 解析所有节点定义
        const nodeElements = treeNodesModel.querySelectorAll('Action, Condition, Control, Decorator, SubTree');
        Array.from(nodeElements).forEach(element => {
          const nodeId = element.getAttribute('ID');
          if (nodeId) {
            const ports: any[] = [];
            // 提取输入端口
            const inputPorts = element.querySelectorAll('input_port');
            Array.from(inputPorts).forEach(port => {
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
            Array.from(outputPorts).forEach(port => {
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
            Array.from(inoutPorts).forEach(port => {
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

      // 提取布局信息（如果有）
      const nodePositions: Record<string, { x: number; y: number }> = {};
      if (treeNodesModel) {
        const nodeModels = treeNodesModel.querySelectorAll("Node");
        Array.from(nodeModels).forEach(node => {
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

      // 辅助函数：安全添加边并去重
      function addEdge(source: string, target: string) {
        const id = `edge_${source}_${target}`;
        if (!edges.find(e => e.id === id)) {
          edges.push({
            id,
            source,
            target,
            sourceHandle: "out",
            targetHandle: "in"
          });
        }
      }
      let nodeIdCounter = 0;

      // 递归处理XML树
      const processNode = (element: Element, parentId?: string, depth: number = 0): string | undefined => {
        // 增加健壮性检查：如果element为空或不是一个元素节点，则直接返回
        if (!element || element.nodeType !== 1) {
          return;
        }
        const nodeName = element.nodeName;
        const nodeId = element.getAttribute("_uid") || `node_${nodeIdCounter++}`;
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

        // 特殊处理子树节点
        if (nodeName === "SubTree") {
          const subtreeId = attributes.ID;
          // 创建子树引用节点
          const subtreeData: any = {
            label: `SubTree: ${subtreeId || "Unknown"}`,
            subtreeId: subtreeId,
            subtreeParameters: { ...attributes },
            isSubtreeReference: true,
            attributes
          };

          // 如果有节点定义信息，添加端口信息
          if (subtreeId && nodeDefinitions[subtreeId]) {
            subtreeData.subtreeDefinition = nodeDefinitions[subtreeId];
          }

          nodes.push({
            id: nodeId,
            type: "subtree",
            position: nodePositions[nodeId] || {
              x: 100 + depth * 150,
              y: 100 + nodes.length * 80
            },
            data: subtreeData
          });

          // 如果有父节点，创建边
          if (parentId) {
            addEdge(parentId, nodeId);
          }

          // 不在初始解析时展开子树内容，只创建引用节点
          // 子树内容将在用户手动展开时动态加载

          return nodeId;
        }

        // 创建普通节点
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
          addEdge(parentId, nodeId);
        }

        // 处理子节点（除了SubTree节点的子节点，因为它们在子树定义中处理）
        if (nodeName !== "SubTree") {
          Array.from(element.children).forEach(child => {
            processNode(child, nodeId, depth + 1);
          });
        }

        return nodeId;
      };

      // 从主树的根节点开始处理
      const rootElementChild = mainTree.firstElementChild;
      if (rootElementChild) {
        processNode(rootElementChild);
      } else {
        const error = "无效的BehaviorTree XML: 缺少根控制节点";
        this.parsedData = { nodes: [], edges: [], error };
        return this.parsedData;
      }

      this.parsedData = { nodes, edges };
      return this.parsedData;
    } catch (error) {
      const errorMessage = `XML解析异常: ${(error as Error).message}`;
      console.error('[XML Parser] 解析异常详情:', error);
      console.error('[XML Parser] 错误消息:', errorMessage);
      console.error('[XML Parser] 错误堆栈:', (error as Error).stack);
      this.parsedData = { nodes: [], edges: [], error: errorMessage };
      return this.parsedData;
    }
  }

  // 获取上次解析的数据
  public getLastParsedData(): { nodes: Node[], edges: Edge[], error?: string } | null {
    return this.parsedData;
  }

  // 清除解析数据
  public clearParsedData(): void {
    this.parsedData = null;
  }
}

// 导出单例实例
export const globalXmlProcessor = GlobalXmlProcessor.getInstance();

// 导出便捷函数
export function parseXML(xmlString: string): { nodes: Node[], edges: Edge[], error?: string } {
  return globalXmlProcessor.parseXML(xmlString);
}

export function getLastParsedData(): { nodes: Node[], edges: Edge[], error?: string } | null {
  return globalXmlProcessor.getLastParsedData();
}

export function clearParsedData(): void {
  globalXmlProcessor.clearParsedData();
}