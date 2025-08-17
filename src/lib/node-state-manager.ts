import { Node, Edge } from "reactflow"

// 节点执行状态枚举
export enum NodeStatus {
    IDLE = "idle",
    RUNNING = "running",
    SUCCESS = "success",
    FAILURE = "failure",
    SKIPPED = "skipped"
}

// 节点执行事件类型
export interface NodeExecutionEvent {
    nodeId: string
    timestamp: number
    status: NodeStatus
    duration?: number
    message?: string
    data?: Record<string, any>
}

// 执行历史记录
export interface ExecutionHistory {
    sessionId: string
    startTime: number
    endTime?: number
    events: NodeExecutionEvent[]
    totalDuration: number
    finalStatus: NodeStatus
}

// 节点状态管理器
export class NodeStateManager {
    private currentStates = new Map<string, NodeStatus>()
    private executionHistory: ExecutionHistory[] = []
    private currentExecution: ExecutionHistory | null = null
    private listeners = new Set<(states: Map<string, NodeStatus>) => void>()
    private historyListeners = new Set<(history: ExecutionHistory[]) => void>()

    // 订阅状态变化
    subscribe(listener: (states: Map<string, NodeStatus>) => void) {
        this.listeners.add(listener)
        return () => this.listeners.delete(listener)
    }

    // 订阅历史记录变化
    subscribeHistory(listener: (history: ExecutionHistory[]) => void) {
        this.historyListeners.add(listener)
        return () => this.historyListeners.delete(listener)
    }

    // 开始新的执行会话
    startExecution(sessionId: string) {
        this.currentExecution = {
            sessionId,
            startTime: Date.now(),
            events: [],
            totalDuration: 0,
            finalStatus: NodeStatus.RUNNING
        }
        this.currentStates.clear()
        this.notifyListeners()
    }

    // 结束当前执行会话
    endExecution(finalStatus: NodeStatus = NodeStatus.SUCCESS) {
        if (this.currentExecution) {
            this.currentExecution.endTime = Date.now()
            this.currentExecution.totalDuration = this.currentExecution.endTime - this.currentExecution.startTime
            this.currentExecution.finalStatus = finalStatus

            this.executionHistory.push({ ...this.currentExecution })
            this.currentExecution = null

            // 清除所有节点状态
            this.currentStates.clear()
            this.notifyListeners()
            this.notifyHistoryListeners()
        }
    }

    // 更新节点状态
    updateNodeStatus(nodeId: string, status: NodeStatus, message?: string, data?: Record<string, any>) {
        const previousStatus = this.currentStates.get(nodeId)
        this.currentStates.set(nodeId, status)

        // 记录执行事件
        if (this.currentExecution) {
            const event: NodeExecutionEvent = {
                nodeId,
                timestamp: Date.now(),
                status,
                message,
                data
            }

            // 计算持续时间（如果从运行状态转换）
            if (previousStatus === NodeStatus.RUNNING && status !== NodeStatus.RUNNING) {
                const runningEvent = this.currentExecution.events
                    .slice()
                    .reverse()
                    .find(e => e.nodeId === nodeId && e.status === NodeStatus.RUNNING)

                if (runningEvent) {
                    event.duration = event.timestamp - runningEvent.timestamp
                }
            }

            this.currentExecution.events.push(event)
        }

        this.notifyListeners()
    }

    // 批量更新节点状态
    updateMultipleNodeStatus(updates: Array<{ nodeId: string; status: NodeStatus; message?: string; data?: Record<string, any> }>) {
        updates.forEach(({ nodeId, status, message, data }) => {
            this.currentStates.set(nodeId, status)

            if (this.currentExecution) {
                this.currentExecution.events.push({
                    nodeId,
                    timestamp: Date.now(),
                    status,
                    message,
                    data
                })
            }
        })

        this.notifyListeners()
    }

    // 获取节点当前状态
    getNodeStatus(nodeId: string): NodeStatus {
        return this.currentStates.get(nodeId) || NodeStatus.IDLE
    }

    // 获取所有节点状态
    getAllStates(): Map<string, NodeStatus> {
        return new Map(this.currentStates)
    }

    // 获取执行历史
    getExecutionHistory(): ExecutionHistory[] {
        return [...this.executionHistory]
    }

    // 获取当前执行会话
    getCurrentExecution(): ExecutionHistory | null {
        return this.currentExecution ? { ...this.currentExecution } : null
    }

    // 清除历史记录
    clearHistory() {
        this.executionHistory = []
        this.notifyHistoryListeners()
    }

    // 重置所有状态
    reset() {
        this.currentStates.clear()
        this.currentExecution = null
        this.notifyListeners()
    }

    // 模拟执行行为树（用于演示）
    async simulateExecution(nodes: Node[], edges: Edge[], speed: number = 1000) {
        if (!nodes.length) return

        const sessionId = `simulation-${Date.now()}`
        this.startExecution(sessionId)

        try {
            // 找到根节点
            const rootNode = nodes.find(n => !edges.some(e => e.target === n.id))
            if (!rootNode) {
                throw new Error("未找到根节点")
            }

            // 递归执行节点
            const result = await this.executeNodeRecursively(rootNode.id, nodes, edges, speed)
            this.endExecution(result)
        } catch (error) {
            console.error("执行模拟失败:", error)
            this.endExecution(NodeStatus.FAILURE)
        }
    }

    // 递归执行节点
    private async executeNodeRecursively(nodeId: string, nodes: Node[], edges: Edge[], speed: number): Promise<NodeStatus> {
        const node = nodes.find(n => n.id === nodeId)
        if (!node) return NodeStatus.FAILURE

        // 开始执行节点
        this.updateNodeStatus(nodeId, NodeStatus.RUNNING, `开始执行 ${node.data?.label || nodeId}`)

        // 模拟执行时间
        await new Promise(resolve => setTimeout(resolve, speed))

        // 获取子节点
        const childEdges = edges.filter(e => e.source === nodeId)
        const childNodes = childEdges.map(e => nodes.find(n => n.id === e.target)).filter(Boolean) as Node[]

        let result: NodeStatus = NodeStatus.SUCCESS

        // 根据节点类型执行不同的逻辑
        const nodeType = node.type || 'action'

        switch (nodeType) {
            case 'Sequence':
            case 'control-sequence':
                // 顺序执行所有子节点，任一失败则整体失败
                for (const childNode of childNodes) {
                    const childResult = await this.executeNodeRecursively(childNode.id, nodes, edges, speed)
                    if (childResult !== NodeStatus.SUCCESS) {
                        result = childResult
                        break
                    }
                }
                break

            case 'Fallback':
            case 'Selector':
            case 'control-selector':
                // 依次执行子节点，任一成功则整体成功
                result = NodeStatus.FAILURE
                for (const childNode of childNodes) {
                    const childResult = await this.executeNodeRecursively(childNode.id, nodes, edges, speed)
                    if (childResult === NodeStatus.SUCCESS) {
                        result = NodeStatus.SUCCESS
                        break
                    }
                }
                break

            case 'Parallel':
                // 并行执行所有子节点
                const childPromises = childNodes.map(childNode =>
                    this.executeNodeRecursively(childNode.id, nodes, edges, speed)
                )
                const childResults = await Promise.all(childPromises)

                // 简单策略：所有成功才成功
                result = childResults.every(r => r === NodeStatus.SUCCESS)
                    ? NodeStatus.SUCCESS
                    : NodeStatus.FAILURE
                break

            case 'Inverter':
                // 反转子节点结果
                if (childNodes.length > 0) {
                    const childResult = await this.executeNodeRecursively(childNodes[0].id, nodes, edges, speed)
                    result = childResult === NodeStatus.SUCCESS ? NodeStatus.FAILURE : NodeStatus.SUCCESS
                }
                break

            case 'ForceSuccess':
                // 强制成功
                for (const childNode of childNodes) {
                    await this.executeNodeRecursively(childNode.id, nodes, edges, speed)
                }
                result = NodeStatus.SUCCESS
                break

            case 'ForceFailure':
                // 强制失败
                for (const childNode of childNodes) {
                    await this.executeNodeRecursively(childNode.id, nodes, edges, speed)
                }
                result = NodeStatus.FAILURE
                break

            default:
                // 叶子节点（Action/Condition）- 随机成功或失败
                result = Math.random() > 0.3 ? NodeStatus.SUCCESS : NodeStatus.FAILURE
                break
        }

        // 更新节点最终状态
        this.updateNodeStatus(nodeId, result, `执行完成: ${result}`)

        return result
    }

    // 通知状态监听器
    private notifyListeners() {
        this.listeners.forEach(listener => listener(this.getAllStates()))
    }

    // 通知历史监听器
    private notifyHistoryListeners() {
        this.historyListeners.forEach(listener => listener(this.getExecutionHistory()))
    }

    // 从时间点恢复状态（用于时间轴回放）
    restoreStateAtTime(timestamp: number) {
        if (!this.currentExecution) return

        // 清除当前状态
        this.currentStates.clear()

        // 重放到指定时间点的所有事件
        const eventsUntilTime = this.currentExecution.events.filter(e => e.timestamp <= timestamp)

        eventsUntilTime.forEach(event => {
            this.currentStates.set(event.nodeId, event.status)
        })

        this.notifyListeners()
    }

    // 获取指定时间范围内的事件
    getEventsInTimeRange(startTime: number, endTime: number): NodeExecutionEvent[] {
        if (!this.currentExecution) return []

        return this.currentExecution.events.filter(
            event => event.timestamp >= startTime && event.timestamp <= endTime
        )
    }
}

// 全局节点状态管理器实例
export const nodeStateManager = new NodeStateManager()