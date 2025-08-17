import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
    ContextMenuSeparator,
} from "@/components/ui/context-menu"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import {
    Play,
    Pause,
    Square,
    StepForward,
    Trash2,
    Plus,
    Settings,
    Circle,
    CircleCheck,
    Target,
    Clock,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Download,
    Upload,
    RotateCcw
} from "lucide-react"
import {
    breakpointManager,
    Breakpoint,
    BreakpointType,
    DebugSessionState,
    BreakpointHitEvent
} from "@/core/debugger/breakpoint-manager"
import { useBehaviorTreeStore } from "@/core/store/behavior-tree-store"
import { useToast } from "@/hooks/use-toast"

// 断点类型图标映射
const breakpointTypeIcons = {
    [BreakpointType.ALWAYS]: <Circle className="h-4 w-4 text-red-500" />,
    [BreakpointType.ON_ENTRY]: <Target className="h-4 w-4 text-blue-500" />,
    [BreakpointType.ON_EXIT]: <Target className="h-4 w-4 text-orange-500" />,
    [BreakpointType.ON_SUCCESS]: <CheckCircle className="h-4 w-4 text-green-500" />,
    [BreakpointType.ON_FAILURE]: <XCircle className="h-4 w-4 text-red-500" />,
    [BreakpointType.CONDITIONAL]: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
}

// 断点类型名称映射
const breakpointTypeNames = {
    [BreakpointType.ALWAYS]: "总是中断",
    [BreakpointType.ON_ENTRY]: "进入时中断",
    [BreakpointType.ON_EXIT]: "退出时中断",
    [BreakpointType.ON_SUCCESS]: "成功时中断",
    [BreakpointType.ON_FAILURE]: "失败时中断",
    [BreakpointType.CONDITIONAL]: "条件断点",
}

// 调试会话状态图标
const sessionStateIcons = {
    [DebugSessionState.STOPPED]: <Square className="h-4 w-4 text-gray-500" />,
    [DebugSessionState.RUNNING]: <Play className="h-4 w-4 text-green-500" />,
    [DebugSessionState.PAUSED]: <Pause className="h-4 w-4 text-yellow-500" />,
    [DebugSessionState.STEPPING]: <StepForward className="h-4 w-4 text-blue-500" />,
}

// 添加断点对话框
function AddBreakpointDialog({
    nodeId,
    open,
    onOpenChange
}: {
    nodeId?: string
    open: boolean
    onOpenChange: (open: boolean) => void
}) {
    const [type, setType] = useState<BreakpointType>(BreakpointType.ALWAYS)
    const [condition, setCondition] = useState("")
    const [maxHits, setMaxHits] = useState("")
    const [logMessage, setLogMessage] = useState("")
    const { toast } = useToast()

    const handleSubmit = () => {
        if (!nodeId) return

        const options: any = {}
        if (condition.trim()) options.condition = condition.trim()
        if (maxHits.trim()) options.maxHits = parseInt(maxHits)
        if (logMessage.trim()) options.logMessage = logMessage.trim()

        breakpointManager.addBreakpoint(nodeId, type, options)

        toast({
            title: "断点已添加",
            description: `已在节点 ${nodeId} 添加${breakpointTypeNames[type]}`,
        })

        // 重置表单
        setType(BreakpointType.ALWAYS)
        setCondition("")
        setMaxHits("")
        setLogMessage("")
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>添加断点</DialogTitle>
                    <DialogDescription>
                        为节点 {nodeId} 配置断点设置
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="type" className="text-right">
                            类型
                        </Label>
                        <Select value={type} onValueChange={(value) => setType(value as BreakpointType)}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(breakpointTypeNames).map(([key, name]) => (
                                    <SelectItem key={key} value={key}>
                                        <div className="flex items-center gap-2">
                                            {breakpointTypeIcons[key as BreakpointType]}
                                            {name}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {type === BreakpointType.CONDITIONAL && (
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="condition" className="text-right">
                                条件
                            </Label>
                            <Input
                                id="condition"
                                value={condition}
                                onChange={(e) => setCondition(e.target.value)}
                                placeholder="例: status === 'success'"
                                className="col-span-3"
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="maxHits" className="text-right">
                            最大命中
                        </Label>
                        <Input
                            id="maxHits"
                            type="number"
                            value={maxHits}
                            onChange={(e) => setMaxHits(e.target.value)}
                            placeholder="不限制"
                            className="col-span-3"
                        />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="logMessage" className="text-right">
                            日志消息
                        </Label>
                        <Input
                            id="logMessage"
                            value={logMessage}
                            onChange={(e) => setLogMessage(e.target.value)}
                            placeholder="可选的日志消息"
                            className="col-span-3"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button type="submit" onClick={handleSubmit}>
                        添加断点
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

// 断点列表项
function BreakpointItem({ breakpoint }: { breakpoint: Breakpoint }) {
    const { nodes } = useBehaviorTreeStore()
    const { toast } = useToast()

    const node = nodes.find(n => n.id === breakpoint.nodeId)
    const nodeLabel = node?.data?.label || breakpoint.nodeId

    const handleToggle = () => {
        breakpointManager.toggleBreakpoint(breakpoint.id)
    }

    const handleRemove = () => {
        breakpointManager.removeBreakpoint(breakpoint.id)
        toast({
            title: "断点已移除",
            description: `已移除节点 ${nodeLabel} 的断点`,
        })
    }

    return (
        <ContextMenu>
            <ContextMenuTrigger asChild>
                <div className={`flex items-center gap-3 p-2 rounded-md hover:bg-accent/50 ${!breakpoint.enabled ? 'opacity-50' : ''
                    }`}>
                    <div className="flex items-center gap-2">
                        {breakpointTypeIcons[breakpoint.type]}
                        <Switch
                            checked={breakpoint.enabled}
                            onCheckedChange={handleToggle}
                            size="sm"
                        />
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate">{nodeLabel}</span>
                            {breakpoint.hitCount > 0 && (
                                <Badge variant="secondary" className="text-xs">
                                    {breakpoint.hitCount}
                                </Badge>
                            )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {breakpointTypeNames[breakpoint.type]}
                            {breakpoint.condition && ` • ${breakpoint.condition}`}
                        </div>
                    </div>

                    <div className="flex items-center gap-1">
                        {breakpoint.lastHit && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Clock className="h-3 w-3 text-muted-foreground" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        最后命中: {new Date(breakpoint.lastHit).toLocaleTimeString()}
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                    </div>
                </div>
            </ContextMenuTrigger>
            <ContextMenuContent>
                <ContextMenuItem onClick={handleToggle}>
                    {breakpoint.enabled ? '禁用' : '启用'}断点
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem onClick={handleRemove} className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    删除断点
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    )
}

// 调试控制栏
function DebugControls() {
    const [sessionState, setSessionState] = useState<DebugSessionState>(DebugSessionState.STOPPED)
    const [pausedNode, setPausedNode] = useState<string | null>(null)
    const { toast } = useToast()

    useEffect(() => {
        const unsubscribe = breakpointManager.subscribeSessionState((state, node) => {
            setSessionState(state)
            setPausedNode(node || null)
        })
        return unsubscribe
    }, [])

    const handleStart = () => {
        breakpointManager.startDebugSession()
        toast({
            title: "调试会话已开始",
            description: "断点调试功能已激活",
        })
    }

    const handlePause = () => {
        breakpointManager.pauseExecution()
    }

    const handleContinue = () => {
        breakpointManager.continueExecution()
    }

    const handleStep = () => {
        breakpointManager.stepExecution()
    }

    const handleStop = () => {
        breakpointManager.stopExecution()
        toast({
            title: "调试会话已停止",
            description: "断点调试功能已停用",
        })
    }

    return (
        <div className="flex items-center gap-2 p-2 border-b">
            <div className="flex items-center gap-1">
                {sessionStateIcons[sessionState]}
                <span className="text-sm font-medium">
                    {sessionState === DebugSessionState.STOPPED && "已停止"}
                    {sessionState === DebugSessionState.RUNNING && "运行中"}
                    {sessionState === DebugSessionState.PAUSED && "已暂停"}
                    {sessionState === DebugSessionState.STEPPING && "单步执行"}
                </span>
                {pausedNode && (
                    <Badge variant="outline" className="text-xs">
                        {pausedNode}
                    </Badge>
                )}
            </div>

            <div className="ml-auto flex items-center gap-1">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleStart}
                                disabled={sessionState === DebugSessionState.RUNNING}
                            >
                                <Play className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>开始调试</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={sessionState === DebugSessionState.PAUSED ? handleContinue : handlePause}
                                disabled={sessionState === DebugSessionState.STOPPED}
                            >
                                {sessionState === DebugSessionState.PAUSED ? (
                                    <Play className="h-4 w-4" />
                                ) : (
                                    <Pause className="h-4 w-4" />
                                )}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            {sessionState === DebugSessionState.PAUSED ? '继续' : '暂停'}
                        </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleStep}
                                disabled={sessionState === DebugSessionState.STOPPED}
                            >
                                <StepForward className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>单步执行</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleStop}
                                disabled={sessionState === DebugSessionState.STOPPED}
                            >
                                <Square className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>停止调试</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
        </div>
    )
}

// 主断点面板组件
export function BreakpointPanel() {
    const [breakpoints, setBreakpoints] = useState<Breakpoint[]>([])
    const [hitEvents, setHitEvents] = useState<BreakpointHitEvent[]>([])
    const [addDialogOpen, setAddDialogOpen] = useState(false)
    const [selectedNodeId, setSelectedNodeId] = useState<string>()
    const { toast } = useToast()

    useEffect(() => {
        // 订阅断点变化
        const unsubscribeBreakpoints = breakpointManager.subscribeBreakpoints(setBreakpoints)

        // 订阅断点命中事件
        const unsubscribeHitEvents = breakpointManager.subscribeHitEvents((event) => {
            setHitEvents(prev => [...prev, event])
            toast({
                title: "断点命中",
                description: `节点 ${event.nodeId} 在 ${event.nodeStatus} 状态时命中断点`,
            })
        })

        // 初始化数据
        setBreakpoints(breakpointManager.getAllBreakpoints())
        setHitEvents(breakpointManager.getHitEvents())

        return () => {
            unsubscribeBreakpoints()
            unsubscribeHitEvents()
        }
    }, [toast])

    const handleClearAll = () => {
        breakpointManager.clearAllBreakpoints()
        toast({
            title: "已清除所有断点",
            description: "所有断点已被移除",
        })
    }

    const handleExport = () => {
        const json = breakpointManager.exportBreakpoints()
        const blob = new Blob([json], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'breakpoints.json'
        a.click()
        URL.revokeObjectURL(url)

        toast({
            title: "断点配置已导出",
            description: "断点配置已保存到文件",
        })
    }

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (e) => {
            const json = e.target?.result as string
            if (breakpointManager.importBreakpoints(json)) {
                toast({
                    title: "断点配置已导入",
                    description: "断点配置已成功加载",
                })
            } else {
                toast({
                    title: "导入失败",
                    description: "断点配置文件格式错误",
                    variant: "destructive",
                })
            }
        }
        reader.readAsText(file)
        event.target.value = '' // 重置文件输入
    }

    const stats = breakpointManager.getBreakpointStats()

    return (
        <div className="h-full flex flex-col">
            {/* 调试控制栏 */}
            <DebugControls />

            {/* 断点统计 */}
            <div className="p-3 border-b">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">断点管理</span>
                    <div className="flex items-center gap-1">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setAddDialogOpen(true)}
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>添加断点</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={handleExport}
                                        disabled={breakpoints.length === 0}
                                    >
                                        <Download className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>导出断点配置</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <label>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            asChild
                                        >
                                            <span>
                                                <Upload className="h-4 w-4" />
                                            </span>
                                        </Button>
                                        <input
                                            type="file"
                                            accept=".json"
                                            onChange={handleImport}
                                            className="hidden"
                                        />
                                    </label>
                                </TooltipTrigger>
                                <TooltipContent>导入断点配置</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={handleClearAll}
                                        disabled={breakpoints.length === 0}
                                    >
                                        <RotateCcw className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>清除所有断点</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>总计: {stats.total}</span>
                    <span>启用: {stats.enabled}</span>
                    <span>命中: {stats.hitCount}</span>
                </div>
            </div>

            {/* 断点列表 */}
            <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                    {breakpoints.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">暂无断点</p>
                            <p className="text-xs">右键节点或点击上方按钮添加断点</p>
                        </div>
                    ) : (
                        breakpoints.map((breakpoint) => (
                            <BreakpointItem key={breakpoint.id} breakpoint={breakpoint} />
                        ))
                    )}
                </div>
            </ScrollArea>

            {/* 断点命中历史 */}
            {hitEvents.length > 0 && (
                <>
                    <Separator />
                    <div className="p-2">
                        <div className="text-sm font-medium mb-2">命中历史</div>
                        <ScrollArea className="h-32">
                            <div className="space-y-1">
                                {hitEvents.slice(-10).reverse().map((event, index) => (
                                    <div key={index} className="text-xs p-2 rounded bg-accent/30">
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium">{event.nodeId}</span>
                                            <Badge variant="outline" className="text-xs">
                                                {event.nodeStatus}
                                            </Badge>
                                        </div>
                                        <div className="text-muted-foreground">
                                            {new Date(event.timestamp).toLocaleTimeString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                </>
            )}

            {/* 添加断点对话框 */}
            <AddBreakpointDialog
                nodeId={selectedNodeId}
                open={addDialogOpen}
                onOpenChange={setAddDialogOpen}
            />
        </div>
    )
}