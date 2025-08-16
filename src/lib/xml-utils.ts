import { Node, Edge } from "reactflow";
import { parseXML as globalParseXML } from "@/lib/global-xml-processor";

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

/** 
 * 解析BehaviorTree.CPP XML字符串为ReactFlow节点和边
 * @param xmlString BehaviorTree.CPP XML字符串
 * @returns 解析后的节点和边数据
 */
export function parseXML(xmlString: string): { nodes: Node[], edges: Edge[], error?: string } {
  return globalParseXML(xmlString);
}

// 读取demo.xml文件内容
let demoXmlContent: string | null = null;
try {
  // 在浏览器环境中通过fetch读取
  if (typeof window !== 'undefined') {
    fetch('/demo.xml')
      .then(response => response.text())
      .then(text => {
        demoXmlContent = text;
      })
      .catch(error => {
        console.error('Failed to load demo.xml:', error);
      });
  }
} catch (error) {
  console.error('Error loading demo.xml:', error);
}

/**
 * 示例/测试XML - 用于开发和测试
 */
export const sampleXML = `<root BTCPP_format="4">
    <BehaviorTree ID="MainTree" _fullpath="">
        <Sequence name="Sequence" _uid="1">
            <Script name="Script" _uid="2" code="door_open:=false"/>
            <UpdatePosition name="UpdatePosition" _uid="3" pos="{pos_2D}"/>
            <Fallback name="Fallback" _uid="4">
                <Inverter name="Inverter" _uid="5">
                    <IsDoorClosed name="IsDoorClosed" _uid="6"/>
                </Inverter>
                <SubTree ID="DoorClosed" _fullpath="DoorClosed::7" _uid="7" door_open="{door_open}"/>
            </Fallback>
            <PassThroughDoor name="PassThroughDoor" _uid="13"/>
        </Sequence>
    </BehaviorTree>
    <BehaviorTree ID="DoorClosed" _fullpath="DoorClosed::7">
        <Fallback name="tryOpen" _uid="8" _onSuccess="door_open:=true">
            <OpenDoor name="OpenDoor" _uid="9"/>
            <RetryUntilSuccessful name="RetryUntilSuccessful" _uid="10" num_attempts="5">
                <PickLock name="PickLock" _uid="11"/>
            </RetryUntilSuccessful>
            <SmashDoor name="SmashDoor" _uid="12"/>
        </Fallback>
    </BehaviorTree>
    <TreeNodesModel>
        <Action ID="AlwaysFailure"/>
        <Action ID="AlwaysSuccess"/>
        <Control ID="AsyncFallback"/>
        <Control ID="AsyncSequence"/>
        <Decorator ID="Delay">
            <input_port name="delay_msec" type="unsigned int">Tick the child after a few milliseconds</input_port>
        </Decorator>
        <Control ID="Fallback"/>
        <Decorator ID="ForceFailure"/>
        <Decorator ID="ForceSuccess"/>
        <Control ID="IfThenElse"/>
        <Decorator ID="Inverter"/>
        <Condition ID="IsDoorClosed"/>
        <Decorator ID="KeepRunningUntilFailure"/>
        <Decorator ID="LoopBool">
            <output_port name="value" type="bool"/>
            <input_port name="if_empty" type="BT::NodeStatus" default="SUCCESS">Status to return if queue is empty: SUCCESS, FAILURE, SKIPPED</input_port>
            <inout_port name="queue" type="std::shared_ptr&lt;std::deque&lt;bool, std::allocator&lt;bool&gt; &gt; &gt;"/>
        </Decorator>
        <Decorator ID="LoopDouble">
            <output_port name="value" type="double"/>
            <input_port name="if_empty" type="BT::NodeStatus" default="SUCCESS">Status to return if queue is empty: SUCCESS, FAILURE, SKIPPED</input_port>
            <inout_port name="queue" type="std::shared_ptr&lt;std::deque&lt;double, std::allocator&lt;double&gt; &gt; &gt;"/>
        </Decorator>
        <Decorator ID="LoopInt">
            <output_port name="value" type="int"/>
            <input_port name="if_empty" type="BT::NodeStatus" default="SUCCESS">Status to return if queue is empty: SUCCESS, FAILURE, SKIPPED</input_port>
            <inout_port name="queue" type="std::shared_ptr&lt;std::deque&lt;int, std::allocator&lt;int&gt; &gt; &gt;"/>
        </Decorator>
        <Decorator ID="LoopString">
            <output_port name="value" type="std::string"/>
            <input_port name="if_empty" type="BT::NodeStatus" default="SUCCESS">Status to return if queue is empty: SUCCESS, FAILURE, SKIPPED</input_port>
            <inout_port name="queue" type="std::shared_ptr&lt;std::deque&lt;std::__cxx11::basic_string&lt;char, std::char_traits&lt;char&gt;, std::allocator&lt;char&gt; &gt;, std::allocator&lt;std::__cxx11::basic_string&lt;char, std::char_traits&lt;char&gt;, std::allocator&lt;char&gt; &gt; &gt; &gt; &gt;"/>
        </Decorator>
        <Action ID="OpenDoor"/>
        <Control ID="Parallel">
            <input_port name="failure_count" type="int" default="1">number of children that need to fail to trigger a FAILURE</input_port>
            <input_port name="success_count" type="int" default="-1">number of children that need to succeed to trigger a SUCCESS</input_port>
        </Control>
        <Control ID="ParallelAll">
            <input_port name="max_failures" type="int" default="1">If the number of children returning FAILURE exceeds this value, ParallelAll returns FAILURE</input_port>
        </Control>
        <Action ID="PassThroughDoor"/>
        <Action ID="PickLock"/>
        <Decorator ID="Precondition">
            <input_port name="else" type="BT::NodeStatus" default="FAILURE">Return status if condition is false</input_port>
            <input_port name="if" type="std::string"/>
        </Decorator>
        <Control ID="ReactiveFallback"/>
        <Control ID="ReactiveSequence"/>
        <Decorator ID="Repeat">
            <input_port name="num_cycles" type="int">Repeat a successful child up to N times. Use -1 to create an infinite loop.</input_port>
        </Decorator>
        <Decorator ID="RetryUntilSuccessful">
            <input_port name="num_attempts" type="int">Execute again a failing child up to N times. Use -1 to create an infinite loop.</input_port>
        </Decorator>
        <Decorator ID="RunOnce">
            <input_port name="then_skip" type="bool" default="true">If true, skip after the first execution, otherwise return the same NodeStatus returned once by the child.</input_port>
        </Decorator>
        <Action ID="Script">
            <input_port name="code" type="std::string">Piece of code that can be parsed</input_port>
        </Action>
        <Condition ID="ScriptCondition">
            <input_port name="code" type="BT::AnyTypeAllowed">Piece of code that can be parsed. Must return false or true</input_port>
        </Condition>
        <Control ID="Sequence"/>
        <Control ID="SequenceWithMemory"/>
        <Action ID="SetBlackboard">
            <inout_port name="output_key" type="BT::AnyTypeAllowed">Name of the blackboard entry where the value should be written</inout_port>
            <input_port name="value" type="BT::AnyTypeAllowed">Value to be written into the output_key</input_port>
        </Action>
        <Decorator ID="SkipUnlessUpdated">
            <input_port name="entry" type="BT::Any">Entry to check</input_port>
        </Decorator>
        <Action ID="Sleep">
            <input_port name="msec" type="unsigned int"/>
        </Action>
        <Condition ID="SmashDoor"/>
        <SubTree ID="SubTree">
            <input_port name="_autoremap" type="bool" default="false">If true, all the ports with the same name will be remapped</input_port>
        </SubTree>
        <Control ID="Switch2">
            <input_port name="case_2" type="std::string"/>
            <input_port name="case_1" type="std::string"/>
            <input_port name="variable" type="std::string"/>
        </Control>
        <Control ID="Switch3">
            <input_port name="case_3" type="std::string"/>
            <input_port name="case_2" type="std::string"/>
            <input_port name="case_1" type="std::string"/>
            <input_port name="variable" type="std::string"/>
        </Control>
        <Control ID="Switch4">
            <input_port name="case_4" type="std::string"/>
            <input_port name="case_3" type="std::string"/>
            <input_port name="case_2" type="std::string"/>
            <input_port name="case_1" type="std::string"/>
            <input_port name="variable" type="std::string"/>
        </Control>
        <Control ID="Switch5">
            <input_port name="case_5" type="std::string"/>
            <input_port name="case_4" type="std::string"/>
            <input_port name="case_3" type="std::string"/>
            <input_port name="case_2" type="std::string"/>
            <input_port name="case_1" type="std::string"/>
            <input_port name="variable" type="std::string"/>
        </Control>
        <Control ID="Switch6">
            <input_port name="case_5" type="std::string"/>
            <input_port name="case_4" type="std::string"/>
            <input_port name="case_6" type="std::string"/>
            <input_port name="case_3" type="std::string"/>
            <input_port name="case_2" type="std::string"/>
            <input_port name="case_1" type="std::string"/>
            <input_port name="variable" type="std::string"/>
        </Control>
        <Decorator ID="Timeout">
            <input_port name="msec" type="unsigned int">After a certain amount of time, halt() the child if it is still running.</input_port>
        </Decorator>
        <Action ID="UnsetBlackboard">
            <input_port name="key" type="std::string">Key of the entry to remove</input_port>
        </Action>
        <Action ID="UpdatePosition">
            <output_port name="pos" type="Position2D"/>
        </Action>
        <Decorator ID="WaitValueUpdate">
            <input_port name="entry" type="BT::Any">Entry to check</input_port>
        </Decorator>
        <Action ID="WasEntryUpdated">
            <input_port name="entry" type="BT::Any">Entry to check</input_port>
        </Action>
        <Control ID="WhileDoElse"/>
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
export function formatXMLString(xmlString: string): string {
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