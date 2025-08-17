import { Node } from "reactflow"
import { NodeStatus, NodeExecutionEvent } from "./node-state-manager"

// 断点类型
export enum BreakpointType {
    ALWAYS = "always",           // 总是中断
    ON_ENTRY = "on_entry",       // 进入时中断
    ON_EXIT = "on_exit",         // 退出时中断
    ON_SUCCESS = "on_success",   // 成功时中断
    ON_FAILURE = "on_failure",   // 失败时中断
    CONDITIONAL = "conditional"   // 条件断点
}

// 断点信息
export interface Breakpoint {
    id: string
    nodeId: string
    type: BreakpointType
    enabled: boolean
    condition?: string           // 条件表达式
    hitCount: number            // 命中次数
    maxHits?: number            // 最大命中次数
    logMessage?: string         // 日志消息
    createdAt: number
    lastHit?: number
}

// 断点命中事件
export interface BreakpointHitEvent {
    breakpointId: string
    nodeId: string
    timestamp: number
    nodeStatus: NodeStatus
    executionData?: Record<string, any>
    stackTrace?: string[]
}

// 调试会话状态
export enum DebugSessionState {
    STOPPED = "stopped",
    RUNNING = "running",
    PAUSED = "paused",
    STEPPING = "stepping"
}

// 断点管理器
export class BreakpointManager {
    private breakpoints = new Map<string, Breakpoint>()
    private sessionState: DebugSessionState = DebugSessionState.STOPPED
    private currentPausedNode: string | null = null
    private hitEvents: BreakpointHitEvent[] = []

    // 监听器
    private breakpointListeners = new Set<(breakpoints: Breakpoint[]) => void>()
    private sessionStateListeners = new Set<(state: DebugSessionState, pausedNode?: string) => void>()
    private hitEventListeners = new Set<(event: BreakpointHitEvent) => void>()

    // 订阅断点变化
    subscribeBreakpoints(listener: (breakpoints: Breakpoint[]) => void) {
        this.breakpointListeners.add(listener)
        return () => this.breakpointListeners.delete(listener)
    }

    // 订阅会话状态变化
    subscribeSessionState(listener: (state: DebugSessionState, pausedNode?: string) => void) {
        this.sessionStateListeners.add(listener)
        return () => this.sessionStateListeners.delete(listener)
    }

    // 订阅断点命中事件
    subscribeHitEvents(listener: (event: BreakpointHitEvent) => void) {
        this.hitEventListeners.add(listener)
        return () => this.hitEventListeners.delete(listener)
    }

    // 添加断点
    addBreakpoint(
        nodeId: string,
        type: BreakpointType = BreakpointType.ALWAYS,
        options: {
            condition?: string
            maxHits?: number
            logMessage?: string
        } = {}
    ): string {
        const id = `bp-${nodeId}-${Date.now()}`
        const breakpoint: Breakpoint = {
            id,
            nodeId,
            type,
            enabled: true,
            hitCount: 0,
            createdAt: Date.now(),
            ...options
        }

        this.breakpoints.set(id, breakpoint)
        this.notifyBreakpointListeners()
        return id
    }

    // 移除断点
    removeBreakpoint(breakpointId: string): boolean {
        const removed = this.breakpoints.delete(breakpointId)
        if (removed) {
            this.notifyBreakpointListeners()
        }
        return removed
    }

    // 移除节点的所有断点
    removeNodeBreakpoints(nodeId: string): number {
        let removedCount = 0
        for (const [id, bp] of this.breakpoints) {
            if (bp.nodeId === nodeId) {
                this.breakpoints.delete(id)
                removedCount++
            }
        }
        if (removedCount > 0) {
            this.notifyBreakpointListeners()
        }
        return removedCount
    }

    // 切换断点启用状态
    toggleBreakpoint(breakpointId: string): boolean {
        const breakpoint = this.breakpoints.get(breakpointId)
        if (breakpoint) {
            breakpoint.enabled = !breakpoint.enabled
            this.notifyBreakpointListeners()
            return breakpoint.enabled
        }
        return false
    }

    // 切换节点断点（如果存在则移除，不存在则添加）
    toggleNodeBreakpoint(nodeId: string): boolean {
        const existingBreakpoints = this.getNodeBreakpoints(nodeId)

        if (existingBreakpoints.length > 0) {
            // 移除所有断点
            existingBreakpoints.forEach(bp => this.removeBreakpoint(bp.id))
            return false
        } else {
            // 添加新断点
            this.addBreakpoint(nodeId)
            return true
        }
    }

    // 获取节点的断点
    getNodeBreakpoints(nodeId: string): Breakpoint[] {
        return Array.from(this.breakpoints.values()).filter(bp => bp.nodeId === nodeId)
    }

    // 检查节点是否有断点
    hasBreakpoint(nodeId: string): boolean {
        return this.getNodeBreakpoints(nodeId).some(bp => bp.enabled)
    }

    // 获取所有断点
    getAllBreakpoints(): Breakpoint[] {
        return Array.from(this.breakpoints.values())
    }

    // 清除所有断点
    clearAllBreakpoints(): void {
        this.breakpoints.clear()
        this.notifyBreakpointListeners()
    }

    // 检查是否应该在节点处暂停
    shouldPauseAtNode(nodeId: string, status: NodeStatus, executionData?: Record<string, any>): boolean {
        if (this.sessionState !== DebugSessionState.RUNNING) {
            return false
        }

        const nodeBreakpoints = this.getNodeBreakpoints(nodeId).filter(bp => bp.enabled)

        for (const breakpoint of nodeBreakpoints) {
            if (this.shouldTriggerBreakpoint(breakpoint, status, executionData)) {
                this.hitBreakpoint(breakpoint, status, executionData)
                return true
            }
        }

        return false
    }

    // 判断是否应该触发断点
    private shouldTriggerBreakpoint(
        breakpoint: Breakpoint,
        status: NodeStatus,
        executionData?: Record<string, any>
    ): boolean {
        // 检查最大命中次数
        if (breakpoint.maxHits && breakpoint.hitCount >= breakpoint.maxHits) {
            return false
        }

        // 根据断点类型判断
        switch (breakpoint.type) {
            case BreakpointType.ALWAYS:
                return true

            case BreakpointType.ON_ENTRY:
                return status === NodeStatus.RUNNING

            case BreakpointType.ON_EXIT:
                return status === NodeStatus.SUCCESS || status === NodeStatus.FAILURE

            case BreakpointType.ON_SUCCESS:
                return status === NodeStatus.SUCCESS

            case BreakpointType.ON_FAILURE:
                return status === NodeStatus.FAILURE

            case BreakpointType.CONDITIONAL:
                return this.evaluateCondition(breakpoint.condition, executionData)

            default:
                return false
        }
    }

    // 评估条件表达式（简单实现）
    private evaluateCondition(condition?: string, executionData?: Record<string, any>): boolean {
        if (!condition) return true

        try {
            // 简单的条件评估，实际项目中应该使用更安全的表达式解析器
            // 这里只是演示，支持简单的比较操作
            if (executionData) {
                // 替换变量
                let expr = condition
                for (const [key, value] of Object.entries(executionData)) {
                    expr = expr.replace(new RegExp(`\\b${key}\\b`, 'g'), JSON.stringify(value))
                }

                // 简单的安全评估
                if (/^[\d\s+\-*/()><=!&|"']+$/.test(expr)) {
                    return eval(expr)
                }
            }
            return false
        } catch (error) {
            console.warn("断点条件评估失败:", condition, error)
            return false
        }
    }

    // 命中断点
    private hitBreakpoint(breakpoint: Breakpoint, status: NodeStatus, executionData?: Record<string, any>): void {
        breakpoint.hitCount++
        breakpoint.lastHit = Date.now()

        const hitEvent: BreakpointHitEvent = {
            breakpointId: breakpoint.id,
            nodeId: breakpoint.nodeId,
            timestamp: Date.now(),
            nodeStatus: status,
            executionData
        }

        this.hitEvents.push(hitEvent)
        this.pauseExecution(breakpoint.nodeId)

        // 通知监听器
        this.hitEventListeners.forEach(listener => listener(hitEvent))

        // 输出日志消息
        if (breakpoint.logMessage) {
            console.log(`[断点] ${breakpoint.logMessage}`, { nodeId: breakpoint.nodeId, status, executionData })
        }
    }

    // 暂停执行
    pauseExecution(nodeId: string): void {
        this.sessionState = DebugSessionState.PAUSED
        this.currentPausedNode = nodeId
        this.notifySessionStateListeners()
    }

    // 继续执行
    continueExecution(): void {
        this.sessionState = DebugSessionState.RUNNING
        this.currentPausedNode = null
        this.notifySessionStateListeners()
    }

    // 单步执行
    stepExecution(): void {
        this.sessionState = DebugSessionState.STEPPING
        this.currentPausedNode = null
        this.notifySessionStateListeners()
    }

    // 停止执行
    stopExecution(): void {
        this.sessionState = DebugSessionState.STOPPED
        this.currentPausedNode = null
        this.notifySessionStateListeners()
    }

    // 开始调试会话
    startDebugSession(): void {
        this.sessionState = DebugSessionState.RUNNING
        this.currentPausedNode = null
        this.hitEvents = []

        // 重置所有断点的命中计数
        for (const breakpoint of this.breakpoints.values()) {
            breakpoint.hitCount = 0
            breakpoint.lastHit = undefined
        }

        this.notifySessionStateListeners()
        this.notifyBreakpointListeners()
    }

    // 获取当前会话状态
    getSessionState(): DebugSessionState {
        return this.sessionState
    }

    // 获取当前暂停的节点
    getCurrentPausedNode(): string | null {
        return this.currentPausedNode
    }

    // 获取断点命中历史
    getHitEvents(): BreakpointHitEvent[] {
        return [...this.hitEvents]
    }

    // 导出断点配置
    exportBreakpoints(): string {
        const breakpoints = Array.from(this.breakpoints.values())
        return JSON.stringify(breakpoints, null, 2)
    }

    // 导入断点配置
    importBreakpoints(json: string): boolean {
        try {
            const breakpoints: Breakpoint[] = JSON.parse(json)
            this.breakpoints.clear()

            for (const bp of breakpoints) {
                this.breakpoints.set(bp.id, bp)
            }

            this.notifyBreakpointListeners()
            return true
        } catch (error) {
            console.error("导入断点配置失败:", error)
            return false
        }
    }

    // 通知断点监听器
    private notifyBreakpointListeners(): void {
        const breakpoints = this.getAllBreakpoints()
        this.breakpointListeners.forEach(listener => listener(breakpoints))
    }

    // 通知会话状态监听器
    private notifySessionStateListeners(): void {
        this.sessionStateListeners.forEach(listener =>
            listener(this.sessionState, this.currentPausedNode || undefined)
        )
    }

    // 获取断点统计信息
    getBreakpointStats(): {
        total: number
        enabled: number
        disabled: number
        hitCount: number
    } {
        const breakpoints = this.getAllBreakpoints()
        return {
            total: breakpoints.length,
            enabled: breakpoints.filter(bp => bp.enabled).length,
            disabled: breakpoints.filter(bp => !bp.enabled).length,
            hitCount: breakpoints.reduce((sum, bp) => sum + bp.hitCount, 0)
        }
    }
}

// 全局断点管理器实例
export const breakpointManager = new BreakpointManager()