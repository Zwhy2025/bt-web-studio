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
import { useI18n } from "@/hooks/use-i18n"

// 断点类型图标映射
const breakpointTypeIcons = {
    [BreakpointType.ALWAYS]: <Circle className="h-4 w-4 text-red-500" />,
    [BreakpointType.ON_ENTRY]: <Target className="h-4 w-4 text-blue-500" />,
    [BreakpointType.ON_EXIT]: <Target className="h-4 w-4 text-orange-500" />,
    [BreakpointType.ON_SUCCESS]: <CheckCircle className="h-4 w-4 text-green-500" />,
    [BreakpointType.ON_FAILURE]: <XCircle className="h-4 w-4 text-red-500" />,
    [BreakpointType.CONDITIONAL]: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
}

// 断点类型名称映射函数
const getBreakpointTypeName = (type: BreakpointType, t: any) => {
    const names = {
        [BreakpointType.ALWAYS]: t("panels:breakpointTypes.always"),
        [BreakpointType.ON_ENTRY]: t("panels:breakpointTypes.onEntry"),
        [BreakpointType.ON_EXIT]: t("panels:breakpointTypes.onExit"),
        [BreakpointType.ON_SUCCESS]: t("panels:breakpointTypes.onSuccess"),
        [BreakpointType.ON_FAILURE]: t("panels:breakpointTypes.onFailure"),
        [BreakpointType.CONDITIONAL]: t("panels:breakpointTypes.conditional"),
    }
    return names[type]
}

// 调试会话状态图标
const sessionStateIcons = {
    [DebugSessionState.STOPPED]: <Square className="h-4 w-4 text-gray-500" />,
    [DebugSessionState.RUNNING]: <Play className="h-4 w-4 text-green-500" />,
    [DebugSessionState.PAUSED]: <Pause className="h-4 w-4 text-yellow-500" />,
    [DebugSessionState.STEPPING]: <StepForward className="h-4 w-4 text-blue-500" />,
}

// {t("panels:addBreakpoint")}对话框
function AddBreakpointDialog({
    nodeId,
    open,
    onOpenChange
}: {
    nodeId?: string
    open: boolean
    onOpenChange: (open: boolean) => void
}) {
    const { t } = useI18n()
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
            title: t("messages:breakpointAdded"),
            description: `${t("messages:breakpointAddedAt")} ${nodeId} ${t("messages:breakpointAddedType")}${getBreakpointTypeName(type, t)}`,
        })

        // {t("common:reset")}表单
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
                    <DialogTitle>{t("panels:addBreakpoint")}</DialogTitle>
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
                                {Object.values(BreakpointType).map((typeValue) => (
                                    <SelectItem key={typeValue} value={typeValue}>
                                        <div className="flex items-center gap-2">
                                            {breakpointTypeIcons[typeValue as BreakpointType]}
                                            {getBreakpointTypeName(typeValue as BreakpointType, t)}
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
                                placeholder={t("panels:conditionExample")}
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
                            placeholder={t("panels:noLimit")}
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
                            placeholder={t("panels:optionalLogMessage")}
                            className="col-span-3"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button type="submit" onClick={handleSubmit}>
                        {t("panels:addBreakpoint")}
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
            title: t("messages:breakpointRemoved"),
            description: t("messages:breakpointRemovedFrom").replace("{{node}}", nodeLabel),
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
                    {breakpoint.enabled ? '{t("common:disable")}' : '{t("common:enable")}'}断点
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem onClick={handleRemove} className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    {t("panels:removeBreakpoint")}
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
            title: t("messages:debugSessionStarted"),
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
            title: t("messages:debugSessionStopped"),
            description: "断点调试功能已停用",
        })
    }

    return (
        <div className="flex items-center gap-2 p-2 border-b">
            <div className="flex items-center gap-1">
                {sessionStateIcons[sessionState]}
                <span className="text-sm font-medium">
                    {sessionState === DebugSessionState.STOPPED && t("common:stopped")}
                    {sessionState === DebugSessionState.RUNNING && t("common:running")}
                    {sessionState === DebugSessionState.PAUSED && t("common:paused")}
                    {sessionState === DebugSessionState.STEPPING && t("common:stepping")}
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
                        <TooltipContent>{t("toolbar:startDebug")}</TooltipContent>
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
                        <TooltipContent>{t("toolbar:stepExecute")}</TooltipContent>
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
                        <TooltipContent>{t("toolbar:stopDebug")}</TooltipContent>
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
                title: t("messages:breakpointHit"),
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
            title: t("messages:allBreakpointsCleared"),
            description: t("messages:allBreakpointsRemoved"),
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
            title: t("messages:breakpointConfigExported"),
            description: t("messages:breakpointConfigSaved"),
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
                    title: t("messages:breakpointConfigImported"),
                    description: t("messages:breakpointConfigLoaded"),
                })
            } else {
                toast({
                    title: t('messages:importFailed'),
                    description: t("messages:invalidBreakpointConfigFormat"),
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
                    <span className="text-sm font-medium">{t('panels:breakpointManagement')}</span>
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
                                <TooltipContent>{t("panels:addBreakpoint")}</TooltipContent>
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
                                <TooltipContent>{t('panels:exportBreakpointConfig')}</TooltipContent>
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
                                <TooltipContent>{t('panels:importBreakpointConfig')}</TooltipContent>
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
                                <TooltipContent>{t('panels:clearAllBreakpoints')}</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{t('common:total')}: {stats.total}</span>
                    <span>{t("common:enable")}: {stats.enabled}</span>
                    <span>{t('panels:hitCount')}: {stats.hitCount}</span>
                </div>
            </div>

            {/* 断点列表 */}
            <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                    {breakpoints.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">{t('panels:noBreakpoints')}</p>
                            <p className="text-xs">{t('panels:addBreakpointHint')}</p>
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
                        <div className="text-sm font-medium mb-2">{t('panels:hitHistory')}</div>
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

            {/* {t("panels:addBreakpoint")}对话框 */}
            <AddBreakpointDialog
                nodeId={selectedNodeId}
                open={addDialogOpen}
                onOpenChange={setAddDialogOpen}
            />
        </div>
    )
}