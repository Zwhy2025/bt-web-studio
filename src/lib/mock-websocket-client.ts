// 模拟 WebSocket 客户端，用于在没有真实后端的情况下测试调试功能

// 定义消息类型
export interface DebuggerMessage {
  type: 'status_update' | 'blackboard_update' | 'execution_event' | 'ack';
  payload: any;
}

// 回调函数类型
type OnMessageCallback = (message: DebuggerMessage) => void;
type OnOpenCallback = () => void;
type OnCloseCallback = () => void;
type OnErrorCallback = (error: string) => void;

export class MockWebSocketClient {
  private url: string;
  private onMessageCallback: OnMessageCallback | null = null;
  private onOpenCallback: OnOpenCallback | null = null;
  private onCloseCallback: OnCloseCallback | null = null;
  private onErrorCallback: OnErrorCallback | null = null;
  private isConnected: boolean = false;
  private mockIntervalId: NodeJS.Timeout | null = null;
  private executionState: 'stopped' | 'running' | 'paused' = 'stopped'; // 新增：模拟执行状态
  private currentNodes: string[] = ['root']; // 新增：存储当前节点ID列表，默认包含root
  private executionCounter: number = 0; // 用于跟踪执行步骤

  constructor(url: string) {
    this.url = url;
  }

  // 设置当前节点列表
  setNodes(nodeIds: string[]) {
    this.currentNodes = nodeIds;
  }

  // 设置回调函数
  onMessage(callback: OnMessageCallback) {
    this.onMessageCallback = callback;
  }

  onOpen(callback: OnOpenCallback) {
    this.onOpenCallback = callback;
  }

  onClose(callback: OnCloseCallback) {
    this.onCloseCallback = callback;
  }

  onError(callback: OnErrorCallback) {
    this.onErrorCallback = callback;
  }

  // 连接到调试器 (模拟)
  connect() {
    console.log(`[MockWebSocketClient] Connecting to ${this.url}`);
    
    // 模拟连接延迟
    setTimeout(() => {
      this.isConnected = true;
      this.executionState = 'stopped'; // 连接后重置状态
      this.executionCounter = 0;
      if (this.onOpenCallback) {
        this.onOpenCallback();
      }
      
      // 启动模拟消息发送
      this.startMockMessages();
    }, 1500); // 模拟1.5秒连接时间
  }

  // 断开连接
  disconnect() {
    console.log(`[MockWebSocketClient] Disconnecting from ${this.url}`);
    this.isConnected = false;
    this.executionState = 'stopped';
    this.executionCounter = 0;
    
    if (this.mockIntervalId) {
      clearInterval(this.mockIntervalId);
      this.mockIntervalId = null;
    }
    
    if (this.onCloseCallback) {
      this.onCloseCallback();
    }
  }

  // 发送消息到调试器 (模拟)
  send(message: any) {
    if (!this.isConnected) {
      console.warn('[MockWebSocketClient] Not connected, cannot send message');
      return;
    }
    
    console.log('[MockWebSocketClient] Sending message:', message);
    
    // 处理执行控制命令
    if (message.type === 'start') {
      this.executionState = 'running';
      console.log('[MockWebSocketClient] Execution started');
      // 发送状态更新消息来反映状态变化
      this.sendStatusUpdate('running');
    } else if (message.type === 'pause') {
      this.executionState = 'paused';
      console.log('[MockWebSocketClient] Execution paused');
      // 发送状态更新消息来反映状态变化
      this.sendStatusUpdate('paused');
    } else if (message.type === 'stop') {
      this.executionState = 'stopped';
      console.log('[MockWebSocketClient] Execution stopped');
      // 发送状态更新消息来反映状态变化
      this.sendStatusUpdate('stopped');
      // 清除所有节点状态
      this.clearAllNodeStatuses();
    } else if (message.type === 'step') {
      this.executionState = 'running'; // Step 开始时设置为运行
      console.log('[MockWebSocketClient] Execution stepped');
      // 模拟单步执行的效果
      this.sendMockStepEvent();
      // 步进后自动暂停
      setTimeout(() => {
        this.executionState = 'paused';
        this.sendStatusUpdate('paused');
      }, 300);
    }
    
    // 模拟处理发送的消息，例如 ack
    if (message.type === 'set_breakpoint' || message.type === 'clear_breakpoint') {
      // 模拟立即确认
      if (this.onMessageCallback) {
        this.onMessageCallback({
          type: 'ack',
          payload: {
            originalMessageId: message.id, // 假设消息有 ID
            success: true
          }
        });
      }
    }
  }

  // 发送状态更新消息
  private sendStatusUpdate(status: string) {
    if (this.onMessageCallback) {
      this.onMessageCallback({
        type: 'status_update',
        payload: {
          nodeId: 'root',
          status: status,
          timestamp: Date.now()
        }
      });
    }
  }

  // 清除所有节点状态
  private clearAllNodeStatuses() {
    const callback = this.onMessageCallback;
    if (callback && this.currentNodes.length > 0) {
      this.currentNodes.forEach(nodeId => {
        callback({
          type: 'status_update',
          payload: {
            nodeId: nodeId,
            status: 'idle',
            timestamp: Date.now()
          }
        });
      });
    }
  }

  // 模拟单步执行事件
  private sendMockStepEvent() {
    // 发送一个模拟的执行事件或状态更新
    if (this.onMessageCallback && this.currentNodes.length > 0) {
      // 随机选择一个节点
      const nodeId = this.currentNodes[Math.floor(Math.random() * this.currentNodes.length)];
      
      // 更符合实际行为树执行的节点状态概率分布
      const statusProbabilities = [
        { status: 'running', probability: 0.7 },
        { status: 'success', probability: 0.2 },
        { status: 'failure', probability: 0.1 }
      ];
      
      // 根据概率分布选择状态
      const rand = Math.random();
      let cumulativeProbability = 0;
      let selectedStatus = 'running'; // 默认状态
      
      for (const { status, probability } of statusProbabilities) {
        cumulativeProbability += probability;
        if (rand <= cumulativeProbability) {
          selectedStatus = status;
          break;
        }
      }
      
      // 发送节点状态更新
      this.onMessageCallback({
        type: 'status_update',
        payload: {
          nodeId: nodeId,
          status: selectedStatus,
          timestamp: Date.now()
        }
      });
      
      // 发送执行事件
      this.onMessageCallback({
        type: 'execution_event',
        payload: {
          nodeId: nodeId,
          type: 'tick',
          status: selectedStatus,
          timestamp: Date.now()
        }
      });
    }
  }

  // 启动模拟消息流
  private startMockMessages() {
    console.log('[MockWebSocketClient] Starting mock messages');
    if (this.mockIntervalId) {
      clearInterval(this.mockIntervalId);
    }
    
    // 更符合实际行为树执行的节点状态概率分布
    const statusProbabilities = [
      { status: 'running', probability: 0.7 },
      { status: 'success', probability: 0.2 },
      { status: 'failure', probability: 0.1 }
    ];
    
    const mockBlackboardKeys = ['health', 'target', 'ammo', 'state', 'position', 'energy'];
    const mockBlackboardValues = [100, 'enemy1', 30, 'patrolling', true, false, 
                                {x: 10, y: 20}, 'idle', 'moving', 'attacking'];
    
    this.mockIntervalId = setInterval(() => {
      if (!this.isConnected) {
        console.log('[MockWebSocketClient] Not connected, skipping message');
        return;
      }
      
      // 只有在运行状态下才发送模拟消息
      if (this.executionState !== 'running') {
        console.log('[MockWebSocketClient] Not in running state, current state:', this.executionState);
        return;
      }
      
      console.log('[MockWebSocketClient] Sending mock message, executionCounter:', this.executionCounter);
      this.executionCounter++;
      
      // 每隔几秒发送不同类型的消息
      if (this.executionCounter % 5 === 1) {
        // 发送节点状态更新
        // 从当前节点列表中随机选择一个
        if (this.currentNodes.length > 0) {
          const nodeId = this.currentNodes[Math.floor(Math.random() * this.currentNodes.length)];
          
          // 根据概率分布选择状态
          const rand = Math.random();
          let cumulativeProbability = 0;
          let selectedStatus = 'running'; // 默认状态
          
          for (const { status, probability } of statusProbabilities) {
            cumulativeProbability += probability;
            if (rand <= cumulativeProbability) {
              selectedStatus = status;
              break;
            }
          }
          
          if (this.onMessageCallback) {
            this.onMessageCallback({
              type: 'status_update',
              payload: {
                nodeId,
                status: selectedStatus,
                timestamp: Date.now()
              }
            });
          }
        }
      } else if (this.executionCounter % 5 === 2) {
        // 发送黑板更新
        const key = mockBlackboardKeys[Math.floor(Math.random() * mockBlackboardKeys.length)];
        const value = mockBlackboardValues[Math.floor(Math.random() * mockBlackboardValues.length)];
        const type = typeof value;
        
        if (this.onMessageCallback) {
          this.onMessageCallback({
            type: 'blackboard_update',
            payload: {
              key,
              value,
              type,
              timestamp: Date.now()
            }
          });
        }
      } else if (this.executionCounter % 5 === 3) {
        // 发送执行事件
        if (this.currentNodes.length > 0) {
          const nodeId = this.currentNodes[Math.floor(Math.random() * this.currentNodes.length)];
          const eventTypes = ['enter', 'exit', 'tick'];
          const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
          
          // 根据概率分布选择状态
          const rand = Math.random();
          let cumulativeProbability = 0;
          let selectedStatus = 'running'; // 默认状态
          
          for (const { status, probability } of statusProbabilities) {
            cumulativeProbability += probability;
            if (rand <= cumulativeProbability) {
              selectedStatus = status;
              break;
            }
          }
          
          if (this.onMessageCallback) {
            this.onMessageCallback({
              type: 'execution_event',
              payload: {
                nodeId,
                type: eventType,
                status: selectedStatus,
                timestamp: Date.now()
              }
            });
          }
        }
      }
      // 其他情况不发送消息，模拟真实世界的不规律性
      
    }, 1000); // 每1秒尝试发送一次消息，使模拟更流畅
  }
}