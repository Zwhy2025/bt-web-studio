import { useBehaviorTreeStore } from '@/store/behavior-tree-store';

// 模拟的调试事件数据
// 使用字符串字面量代替 NodeStatus 枚举以避免导入时序问题
const mockEvents = [
  { nodeId: 'root', status: 'running' as const, delay: 1000 },
  { nodeId: 'action-1723734567890', status: 'running' as const, delay: 500 },
  { nodeId: 'action-1723734567890', status: 'success' as const, delay: 1000 },
  { nodeId: 'condition-1723734567891', status: 'running' as const, delay: 500 },
  { nodeId: 'condition-1723734567891', status: 'failure' as const, delay: 1000 },
  { nodeId: 'control-selector-1723734567892', status: 'running' as const, delay: 500 },
  { nodeId: 'action-1723734567893', status: 'running' as const, delay: 500 },
  { nodeId: 'action-1723734567893', status: 'success' as const, delay: 1000 },
  { nodeId: 'control-selector-1723734567892', status: 'success' as const, delay: 500 },
  { nodeId: 'root', status: 'success' as const, delay: 500 },
];

let eventIndex = 0;
let intervalId: NodeJS.Timeout | null = null;

// 启动模拟调试会话
export const startMockDebugSession = () => {
  const { actions } = useBehaviorTreeStore.getState();
  
  if (intervalId) {
    clearInterval(intervalId);
  }
  
  console.log("Mock Debug Session Started");
  
  intervalId = setInterval(() => {
    if (eventIndex >= mockEvents.length) {
      // 循环播放或停止
      eventIndex = 0; 
      // 或者停止: clearInterval(intervalId); intervalId = null; return;
    }
    
    const event = mockEvents[eventIndex];
    console.log("Mock Event:", event);
    
    // 更新节点状态
    actions.setNodeStatus(event.nodeId, event.status);
    
    // 如果是 SUCCESS 或 FAILURE，也更新黑板（模拟）
    if (event.status === 'success' || event.status === 'failure') {
      actions.setBlackboardValue(
        `last_result_${event.nodeId}`, 
        event.status, 
        'string', 
        event.nodeId
      );
    }
    
    eventIndex++;
  }, 2000); // 每2秒一个事件
};

// 停止模拟调试会话
export const stopMockDebugSession = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log("Mock Debug Session Stopped");
  }
};