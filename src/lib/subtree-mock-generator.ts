import { BehaviorTreeNode, NodeStatus } from '@/store/behavior-tree-store';

// 模拟的调试事件数据
// 为导入的子树生成顺序执行的模拟事件
export interface MockEvent {
  nodeId: string;
  status: NodeStatus;
  delay: number;
}

// 为导入的子树生成模拟事件序列
export const generateMockEventsForSubtree = (nodes: BehaviorTreeNode[]): MockEvent[] => {
  const events: MockEvent[] = [];
  
  // 过滤出有意义的节点（排除根节点和一些特殊节点）
  const meaningfulNodes = nodes.filter(node => 
    node.id !== 'root' && 
    node.type !== 'subtree'
  );
  
  // 为每个节点生成运行和完成事件
  meaningfulNodes.forEach((node, index) => {
    // 添加节点开始运行的事件
    events.push({
      nodeId: node.id,
      status: NodeStatus.RUNNING,
      delay: 500 // 0.5秒后开始运行
    });
    
    // 根据节点类型和位置添加不同的完成状态
    // 前面的节点更可能是成功，后面的节点根据概率分布
    const successProbability = Math.max(0.7, 0.9 - (index * 0.05));
    const isSuccess = Math.random() < successProbability;
    
    events.push({
      nodeId: node.id,
      status: isSuccess ? NodeStatus.SUCCESS : NodeStatus.FAILURE,
      delay: 1000 + Math.random() * 2000 // 1-3秒后完成
    });
  });
  
  // 如果没有有意义的节点，至少添加根节点的事件
  if (meaningfulNodes.length === 0) {
    const rootNode = nodes.find(node => node.id === 'root');
    if (rootNode) {
      events.push({
        nodeId: rootNode.id,
        status: NodeStatus.RUNNING,
        delay: 500
      });
      
      events.push({
        nodeId: rootNode.id,
        status: NodeStatus.SUCCESS,
        delay: 2000
      });
    }
  }
  
  return events;
};

// 模拟执行导入的子树
export const simulateSubtreeExecution = (
  nodes: BehaviorTreeNode[], 
  onNodeStatusUpdate: (nodeId: string, status: NodeStatus) => void,
  onSimulationComplete: () => void
) => {
  const events = generateMockEventsForSubtree(nodes);
  let eventIndex = 0;
  let timeoutId: NodeJS.Timeout | null = null;
  
  console.log("Starting subtree simulation with events:", events);
  
  const executeNextEvent = () => {
    if (eventIndex >= events.length) {
      // 模拟完成
      console.log("Subtree simulation completed");
      onSimulationComplete();
      return;
    }
    
    const event = events[eventIndex];
    console.log(`Executing mock event ${eventIndex + 1}/${events.length}:`, event);
    
    // 更新节点状态
    onNodeStatusUpdate(event.nodeId, event.status);
    
    eventIndex++;
    
    // 设置下一个事件的定时器
    timeoutId = setTimeout(executeNextEvent, event.delay);
  };
  
  // 开始执行第一个事件
  timeoutId = setTimeout(executeNextEvent, 100);
  
  // 返回清理函数
  return () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  };
};