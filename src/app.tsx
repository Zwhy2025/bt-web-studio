import React, { useCallback, useEffect, useMemo, useState, useRef } from "react"
import {
    Menubar,
    MenubarMenu,
    MenubarTrigger,
    MenubarContent,
    MenubarItem,
    MenubarSeparator,
} from "@/components/ui/menubar"
import { Button } from "@/components/ui/button" 
import { ImportDialog, ExportDialog } from "@/components/xml-dialog"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    ResizablePanelGroup,
    ResizablePanel,
    ResizableHandle,
} from "@/components/ui/resizable"
import {
    Play,
    Pause,
    ChevronRight,
    RefreshCcw,
    Save,
    Import,
    Download,
    Search,
    Bug,
    Plus,
    GitBranch,
    CheckCircle2,
    XCircle,
    Brain,
    Signal,
    RotateCcw,
    RotateCw,
    Copy,
    ClipboardPaste,
    Trash2,
    Info,
    Grid3X3,
    AlignLeft,
} from "lucide-react"

import ReactFlow, {
    Background,
    BackgroundVariant,
    Controls,
    MiniMap,
    Node,
    Edge,
    addEdge,
    Connection,
    useEdgesState,
    useNodesState,
    ReactFlowProvider,
    useReactFlow,
    MarkerType,
    ConnectionLineType,
    ConnectionMode,
    NodeDragHandler,
    OnSelectionChangeParams,
} from "reactflow"

import "reactflow/dist/style.css"
import { nodeTypes } from "@/components/canvas/custom-nodes"
import { useToast } from "@/hooks/use-toast"
import {
    ContextMenu,
    ContextMenuTrigger,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuLabel,
    ContextMenuShortcut,
    ContextMenuSub,
    ContextMenuSubTrigger,
    ContextMenuSubContent,
} from "@/components/ui/context-menu"
import {
    TooltipProvider,
    Tooltip,
    TooltipTrigger,
    TooltipContent,
} from "@/components/ui/tooltip"
import { HistoryManager, HistoryState } from "@/lib/history-utils"
import { autoLayoutTree, scatterNodes } from "@/lib/auto-layout-utils"
import { 
    calculateAlignmentGuides, 
    alignNodes, 
    snapToGrid, 
    getNodesInSelectionBox,
    GRID_SIZE,
    AlignmentGuide 
} from "@/lib/alignment-utils"
import { 
    AlignmentGuides, 
    GridSnapIndicator, 
    SelectionBox, 
    GridBackground,
    AlignmentToolbar 
} from "@/components/canvas/alignment-guides"
import { BlackboardPanel } from "@/components/blackboard-panel"
import { TabBar } from "@/components/tab-bar"
import { useBehaviorTreeStore } from "@/store/behavior-tree-store"

// ---------- Left Palette ----------
function LeftPalette() {
    const items = useMemo(
        () => [
            { label: "Action", type: "action", desc: "执行型节点" },
            { label: "Condition", type: "condition", desc: "条件判断" },
            { label: "Sequence", type: "control-sequence", desc: "控制-顺序" },
            { label: "Selector", type: "control-selector", desc: "控制-选择" },
            { label: "Decorator", type: "decorator", desc: "装饰器" },
            { label: "SubTree", type: "subtree", desc: "子树引用" },
        ],
        []
    )

    const onDragStart = (event: React.DragEvent, nodeType: string) => {
        event.dataTransfer.setData("application/reactflow", nodeType)
        event.dataTransfer.effectAllowed = "move"
    }

    return (
        <aside className="h-full flex flex-col">
            <div className="p-3">
                <div className="font-medium mb-2">节点库</div>
                <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input className="pl-8" placeholder="搜索节点/模板..." />
                </div>
            </div>
            <Separator />
            <ScrollArea className="flex-1">
                <div className="p-3 grid gap-2">
                    {items.map((it) => (
                        <div
                            key={it.type}
                            draggable
                            onDragStart={(e) => onDragStart(e, it.type)}
                            role="button"
                            aria-label={`拖拽以创建 ${it.label}`}
                            className="rounded-md border bg-card/60 backdrop-blur hover:bg-accent/50 transition-colors p-3 cursor-grab active:cursor-grabbing"
                        >
                            <div className="flex items-center justify-between">
                                <div className="text-sm font-medium">{it.label}</div>
                                <GitBranch className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">{it.desc}</div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </aside>
    )
}

// ---------- Right Inspector ----------
function RightInspector() {
    return (
        <aside className="h-full flex flex-col">
            <div className="p-3">
                <div className="font-medium mb-2">属性面板</div>
                <div className="space-y-3">
                    <div>
                        <div className="text-xs text-muted-foreground mb-1">节点名称</div>
                        <Input placeholder="例如：MoveToTarget" />
                    </div>
                    <div>
                        <div className="text-xs text-muted-foreground mb-1">端口/参数</div>
                        <div className="rounded-md border p-2 text-xs text-muted-foreground">
                            暂无参数，选择画布中的节点后编辑
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <Button size="sm" variant="secondary">
                            校验
                        </Button>
                        <Button size="sm" variant="outline">
                            重置
                        </Button>
                    </div>
                </div>
            </div>
            <Separator />
            <div className="p-3">
                <div className="font-medium mb-2">状态预览</div>
                <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-md border p-2 bg-card/60">
                        <div className="text-xs text-muted-foreground">成功</div>
                        <div className="flex items-center gap-1 mt-1">
                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                            <span className="text-sm font-medium">0</span>
                        </div>
                    </div>
                    <div className="rounded-md border p-2 bg-card/60">
                        <div className="text-xs text-muted-foreground">失败</div>
                        <div className="flex items-center gap-1 mt-1">
                            <XCircle className="h-4 w-4 text-rose-400" />
                            <span className="text-sm font-medium">0</span>
                        </div>
                    </div>
                    <div className="rounded-md border p-2 bg-card/60">
                        <div className="text-xs text-muted-foreground">运行</div>
                        <div className="flex items-center gap-1 mt-1">
                            <Signal className="h-4 w-4 text-cyan-400" />
                            <span className="text-sm font-medium">0</span>
                        </div>
                    </div>
                </div>
            </div>
            <Separator />
            <div className="flex-1 p-3">
                <BlackboardPanel />
            </div>
        </aside>
    )
}

// ---------- Top Bar ----------
function TopBar({ onImportClick, onExportClick, onNewProject }: { 
    onImportClick: () => void;
    onExportClick: () => void;
    onNewProject: () => void;
}) {
    return (
        <header className="w-full border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center gap-3 px-3 py-2">
                <Brain className="h-5 w-5 text-primary" aria-hidden />
                <div className="font-semibold tracking-tight">BT Web Studio</div>
                <Menubar className="ml-2">
                    <MenubarMenu>
                        <MenubarTrigger>文件</MenubarTrigger>
                        <MenubarContent>
                            <MenubarItem onSelect={onNewProject}>
                                <Plus className="mr-2 h-4 w-4" /> 新建项目
                            </MenubarItem>
                            <MenubarSeparator />
                            <MenubarItem onSelect={onImportClick}>
                                <Import className="mr-2 h-4 w-4" /> 导入 XML
                            </MenubarItem>
                            <MenubarItem onSelect={onExportClick}>
                                <Download className="mr-2 h-4 w-4" /> 导出 XML
                            </MenubarItem>
                            <MenubarSeparator />
                            <MenubarItem>
                                <Save className="mr-2 h-4 w-4" /> 保存
                            </MenubarItem>
                        </MenubarContent>
                    </MenubarMenu>
                    <MenubarMenu>
                        <MenubarTrigger>编辑</MenubarTrigger>
                        <MenubarContent>
                            <MenubarItem>撤销</MenubarItem>
                            <MenubarItem>重做</MenubarItem>
                        </MenubarContent>
                    </MenubarMenu>
                    <MenubarMenu>
                        <MenubarTrigger>视图</MenubarTrigger>
                        <MenubarContent>
                            <MenubarItem>缩放至适配</MenubarItem>
                            <MenubarItem>显示最小地图</MenubarItem>
                        </MenubarContent>
                    </MenubarMenu>
                    <MenubarMenu>
                        <MenubarTrigger>调试</MenubarTrigger>
                        <MenubarContent>
                            <MenubarItem>
                                <Bug className="mr-2 h-4 w-4" /> 打开断点面板
                            </MenubarItem>
                        </MenubarContent>
                    </MenubarMenu>
                    <MenubarMenu>
                        <MenubarTrigger>帮助</MenubarTrigger>
                        <MenubarContent>
                            <MenubarItem>快捷键</MenubarItem>
                            <MenubarItem>关于</MenubarItem>
                        </MenubarContent>
                    </MenubarMenu>
                </Menubar>
                <div className="ml-auto flex items-center gap-2">
                    <div className="relative w-64 max-w-[40vw]">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input className="pl-8" placeholder="搜索节点、模板或命令..." aria-label="全局搜索" />
                    </div>
                    <Button variant="outline" size="sm" onClick={onImportClick}>
                        <Import className="mr-2 h-4 w-4" />
                        导入
                    </Button>
                    <Button size="sm" onClick={onExportClick}>
                        <Download className="mr-2 h-4 w-4" />
                        导出
                    </Button>
                </div>
            </div>
        </header>
    )
}

// ---------- Bottom Timeline ----------
function BottomTimeline() {
    const [playing, setPlaying] = useState(false)
    return (
        <div className="w-full border-t bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="px-3 py-2 flex items-center gap-2">
                <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" onClick={() => setPlaying((p) => !p)} aria-label={playing ? "暂停" : "播放"}>
                        {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button size="sm" variant="ghost" aria-label="单步">
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" aria-label="重置">
                        <RefreshCcw className="h-4 w-4" />
                    </Button>
                </div>
                <Separator orientation="vertical" className="h-6" />
                <div className="text-xs text-muted-foreground">时间轴</div>
                <div className="flex-1 h-8 rounded-md border bg-card/60 backdrop-blur relative overflow-hidden">
                    <div className="absolute inset-y-0 left-0 w-1/3 bg-primary/20" />
                    <div className="absolute inset-y-0 left-1/3 w-0.5 bg-primary/60" />
                </div>
                <div className="text-xs tabular-nums w-28 text-right text-muted-foreground">00:00:00.000</div>
            </div>
        </div>
    )
}

// ---------- Canvas with React Flow ----------
type PaletteType =
    | "action"
    | "condition"
    | "control-sequence"
    | "control-selector"
    | "decorator"
    | "subtree"

const initialNodes: Node[] = [
    {
        id: "root",
        position: { x: 100, y: 80 },
        data: { label: "Root (Sequence)" },
        type: "control-sequence",
    },
]

const initialEdges: Edge[] = []

function CanvasInner({ 
    onNodesExport,
    onEdgesExport
}: { 
    onNodesExport?: (nodes: Node[]) => void;
    onEdgesExport?: (edges: Edge[]) => void;
}) {
    // 从状态管理系统获取当前会话的节点和边
    const storeNodes = useBehaviorTreeStore(state => state.nodes)
    const storeEdges = useBehaviorTreeStore(state => state.edges)
    const currentSession = useBehaviorTreeStore(state => state.currentSession)
    const actions = useBehaviorTreeStore(state => state.actions)
    
    const [nodes, setNodes, onNodesChange] = useNodesState(storeNodes)
    const [edges, setEdges, onEdgesChange] = useEdgesState(storeEdges)
    
    // 直接使用原始的变化处理函数，避免闭包陷阱
    // 状态同步通过其他明确的操作点进行（如拖拽结束、连接等）
    
    // 当会话切换时，强制更新画布数据
    useEffect(() => {
        if (currentSession) {
            setNodes(storeNodes)
            setEdges(storeEdges)
        }
    }, [currentSession?.id, storeNodes, storeEdges, setNodes, setEdges])
    
    // 当需要导出数据时提供当前画布数据
    useEffect(() => {
        if (onNodesExport) onNodesExport(nodes);
        if (onEdgesExport) onEdgesExport(edges);
    }, [nodes, edges, onNodesExport, onEdgesExport]);
    const { project, screenToFlowPosition } = useReactFlow()
    const { toast } = useToast()

    // selection state
    const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([])
    const [selectedEdgeIds, setSelectedEdgeIds] = useState<string[]>([])
    
    // 对齐与吸附状态
    const [alignmentGuides, setAlignmentGuides] = useState<AlignmentGuide[]>([])
    const [snapToGridEnabled, setSnapToGridEnabled] = useState(true)
    const [showGrid, setShowGrid] = useState(true)
    const [isDragging, setIsDragging] = useState(false)
    
    // 橡皮框选择状态
    const [isSelecting, setIsSelecting] = useState(false)
    const [selectionStart, setSelectionStart] = useState({ x: 0, y: 0 })
    const [selectionCurrent, setSelectionCurrent] = useState({ x: 0, y: 0 })
    const canvasRef = useRef<HTMLDivElement>(null)
    
    // 画布尺寸状态
    const [canvasSize, setCanvasSize] = useState({ width: 1000, height: 800 })
    
    // 监听画布尺寸变化
    useEffect(() => {
        const updateCanvasSize = () => {
            if (canvasRef.current) {
                const rect = canvasRef.current.getBoundingClientRect()
                setCanvasSize({ width: rect.width, height: rect.height })
            }
        }
        
        // 初始化尺寸
        updateCanvasSize()
        
        // 监听窗口大小变化
        const resizeObserver = new ResizeObserver(updateCanvasSize)
        if (canvasRef.current) {
            resizeObserver.observe(canvasRef.current)
        }
        
        return () => {
            resizeObserver.disconnect()
        }
    }, [])
    
    // 历史记录管理
    const historyManagerRef = useRef<HistoryManager | null>(null)
    const [canUndo, setCanUndo] = useState(false)
    const [canRedo, setCanRedo] = useState(false)
    
    // 初始化历史记录管理器
    useEffect(() => {
        historyManagerRef.current = new HistoryManager({ 
            nodes: initialNodes, 
            edges: initialEdges 
        })
        setCanUndo(false) // 新的历史记录，不能撤销
        setCanRedo(false) // 也不能重做
    }, [])
    
    // 保存状态到历史记录
    const saveToHistory = useCallback(() => {
        if (historyManagerRef.current) {
            historyManagerRef.current.push({ nodes, edges })
            setCanUndo(historyManagerRef.current.canUndo())
            setCanRedo(historyManagerRef.current.canRedo())
        }
    }, [nodes, edges])

    const findNode = (id: string) => nodes.find((n) => n.id === id)
    
    // 节点拖拽处理 - 添加对齐吸附
    const onNodeDrag: NodeDragHandler = useCallback((event, node, draggedNodes) => {
        setIsDragging(true)
        
        // 使用当前完整的节点列表而不是拖拽回调中的节点列表
        const otherNodes = nodes.filter(n => n.id !== node.id)
        const snapResult = calculateAlignmentGuides(node, otherNodes, snapToGridEnabled)
        
        // 更新指导线
        setAlignmentGuides(snapResult.guides)
        
        // 只有当位置需要调整时才更新节点位置
        if (snapResult.x !== node.position.x || snapResult.y !== node.position.y) {
            // 使用 setNodes 的函数形式来确保基于最新状态更新
            setNodes(currentNodes => 
                currentNodes.map(n => 
                    n.id === node.id 
                        ? { ...n, position: { x: snapResult.x, y: snapResult.y } }
                        : n
                )
            )
        }
    }, [nodes, snapToGridEnabled, setNodes])
    
    // 节点拖拽结束
    const onNodeDragStop = useCallback(() => {
        setIsDragging(false)
        setAlignmentGuides([])
        // 同步到状态管理系统
        actions.importData(nodes, edges)
        saveToHistory()
    }, [saveToHistory, actions, nodes, edges])
    
    // 橡皮框选择开始
    const onSelectionStart = useCallback((event: React.MouseEvent) => {
        // 只在空白区域开始选择
        if (event.target === event.currentTarget) {
            const rect = canvasRef.current?.getBoundingClientRect()
            if (rect) {
                const startPos = screenToFlowPosition({
                    x: event.clientX - rect.left,
                    y: event.clientY - rect.top,
                })
                setSelectionStart(startPos)
                setSelectionCurrent(startPos)
                setIsSelecting(true)
            }
        }
    }, [screenToFlowPosition])
    
    // 橡皮框选择移动 - 优化性能，避免频繁重渲染
    const onSelectionMove = useCallback((event: React.MouseEvent) => {
        if (isSelecting && canvasRef.current) {
            const rect = canvasRef.current.getBoundingClientRect()
            const currentPos = screenToFlowPosition({
                x: event.clientX - rect.left,
                y: event.clientY - rect.top,
            })
            setSelectionCurrent(currentPos)
            
            // 计算选择框内的节点
            const selectionBox = {
                x: Math.min(selectionStart.x, currentPos.x),
                y: Math.min(selectionStart.y, currentPos.y),
                width: Math.abs(currentPos.x - selectionStart.x),
                height: Math.abs(currentPos.y - selectionStart.y),
            }
            
            const selectedNodes = getNodesInSelectionBox(nodes, selectionBox)
            const selectedIds = selectedNodes.map(n => n.id)
            
            // 只有当选中的节点ID集合发生变化时才更新状态
            const currentSelectedIds = new Set(selectedNodeIds)
            const newSelectedIds = new Set(selectedIds)
            const hasChanged = currentSelectedIds.size !== newSelectedIds.size || 
                              selectedIds.some(id => !currentSelectedIds.has(id))
            
            if (hasChanged) {
                setNodes(nds => nds.map(n => ({
                    ...n,
                    selected: selectedIds.includes(n.id)
                })))
                setSelectedNodeIds(selectedIds)
            }
        }
    }, [isSelecting, selectionStart, nodes, setNodes, screenToFlowPosition, selectedNodeIds])
    
    // 橡皮框选择结束
    const onSelectionEnd = useCallback(() => {
        setIsSelecting(false)
    }, [])
    
    // 批量对齐功能
    const handleAlign = useCallback((alignType: 'left' | 'right' | 'center' | 'top' | 'bottom' | 'middle' | 'distribute-horizontal' | 'distribute-vertical') => {
        const selectedNodes = nodes.filter(n => selectedNodeIds.includes(n.id))
        if (selectedNodes.length < 2) {
            toast({
                title: "对齐失败",
                description: "请选择至少2个节点进行对齐",
                variant: "destructive",
            })
            return
        }
        
        const alignedNodes = alignNodes(selectedNodes, alignType)
        const nodeMap = new Map(alignedNodes.map(n => [n.id, n]))
        
        const newNodes = nodes.map(n => nodeMap.get(n.id) || n)
        setNodes(newNodes)
        // 同步到状态管理系统
        actions.importData(newNodes, edges)
        saveToHistory()
        
        const alignTypeNames = {
            'left': '左对齐',
            'right': '右对齐', 
            'center': '水平居中',
            'top': '顶部对齐',
            'bottom': '底部对齐',
            'middle': '垂直居中',
            'distribute-horizontal': '水平分布',
            'distribute-vertical': '垂直分布',
        }
        
        toast({
            title: "对齐完成",
            description: `已对 ${selectedNodes.length} 个节点执行${alignTypeNames[alignType]}`,
        })
    }, [nodes, selectedNodeIds, setNodes, saveToHistory, toast, edges, actions])
    
    // 撤销功能
    const handleUndo = useCallback(() => {
        if (historyManagerRef.current && historyManagerRef.current.canUndo()) {
            const previousState = historyManagerRef.current.undo()
            if (previousState) {
                setNodes(previousState.nodes)
                setEdges(previousState.edges)
                setCanUndo(historyManagerRef.current.canUndo())
                setCanRedo(historyManagerRef.current.canRedo())
                toast({
                    title: "撤销成功",
                    description: "已恢复到上一个状态",
                })
            }
        }
    }, [setNodes, setEdges, toast])
    
    // 重做功能
    const handleRedo = useCallback(() => {
        if (historyManagerRef.current && historyManagerRef.current.canRedo()) {
            const nextState = historyManagerRef.current.redo()
            if (nextState) {
                setNodes(nextState.nodes)
                setEdges(nextState.edges)
                setCanUndo(historyManagerRef.current.canUndo())
                setCanRedo(historyManagerRef.current.canRedo())
                toast({
                    title: "重做成功",
                    description: "已前进到下一个状态",
                })
            }
        }
    }, [setNodes, setEdges, toast])
    
    // 自动布局功能
    const handleAutoLayout = useCallback(() => {
        const layoutedNodes = autoLayoutTree(nodes, edges)
        setNodes(layoutedNodes)
        // 同步到状态管理系统
        actions.importData(layoutedNodes, edges)
        saveToHistory()
        toast({
            title: "自动布局完成",
            description: "已将节点排列成清晰的树形结构",
        })
    }, [nodes, edges, setNodes, saveToHistory, toast, actions])
    
    // 散乱分布功能
    const handleScatterNodes = useCallback(() => {
        const scatteredNodes = scatterNodes(nodes)
        setNodes(scatteredNodes)
        // 同步到状态管理系统
        actions.importData(scatteredNodes, edges)
        saveToHistory()
        toast({
            title: "散乱分布完成",
            description: "已将节点随机分布到画布上",
        })
    }, [nodes, setNodes, saveToHistory, toast, edges, actions])

    function isDownwardConnection(conn: Connection): boolean {
        if (!conn.source || !conn.target) return false
        if (conn.source === conn.target) return false
        if (conn.sourceHandle !== "out" || conn.targetHandle !== "in") return false
        const s = findNode(conn.source)
        const t = findNode(conn.target)
        if (!s || !t) return false
        return s.position.y <= t.position.y
    }

    function willCreateCycle(source: string, target: string): boolean {
        const adj = new Map<string, string[]>()
        for (const e of edges) {
            if (!adj.has(e.source)) adj.set(e.source, [])
            adj.get(e.source)!.push(e.target)
        }
        if (!adj.has(source)) adj.set(source, [])
        adj.get(source)!.push(target)

        const visited = new Set<string>()
        function dfs(node: string): boolean {
            if (node === source) return true
            if (visited.has(node)) return false
            visited.add(node)
            const nexts = adj.get(node) || []
            for (const nxt of nexts) {
                if (dfs(nxt)) return true
            }
            return false
        }
        return dfs(target)
    }


    const onConnect = useCallback(
        (params: Edge | Connection) => {
            const conn = params as Connection
            if (!isDownwardConnection(conn)) {
                toast({
                    title: "无法连接",
                    description: "仅允许从底部 out 连接到下方节点顶部 in，且不允许自连/向上连接。",
                    variant: "destructive" as any,
                })
                return
            }
            if (willCreateCycle(conn.source!, conn.target!)) {
                toast({
                    title: "禁止回路",
                    description: "该连接将产生闭环，请调整结构。",
                    variant: "destructive" as any,
                })
                return
            }
            const newEdges = addEdge({ ...params, animated: false }, edges)
            setEdges(newEdges)
            // 同步到状态管理系统
            actions.importData(nodes, newEdges)
        },
        [setEdges, edges, nodes, toast, actions]
    )

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault()
        event.dataTransfer.dropEffect = "move"
    }, [])

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault()
            const type = event.dataTransfer.getData("application/reactflow") as PaletteType
            if (!type) return
            const bounds = event.currentTarget.getBoundingClientRect()
            const position = project({ x: event.clientX - bounds.left, y: event.clientY - bounds.top })
            const id = `${type}-${Date.now()}`
            const labelMap: Record<PaletteType, string> = {
                action: "Action",
                condition: "Condition",
                "control-sequence": "Sequence",
                "control-selector": "Selector",
                decorator: "Decorator",
                subtree: "SubTree",
            }
            const newNode: Node = {
                id,
                position,
                data: { label: `${labelMap[type]}` },
                type: type as any,
            }
            const newNodes = [...nodes, newNode]
            setNodes(newNodes)
            // 同步到状态管理系统
            actions.importData(newNodes, edges)
        },
        [project, setNodes, nodes, edges, actions]
    )

    // 删除所选
    const deleteSelection = useCallback(() => {
        if (selectedNodeIds.length === 0 && selectedEdgeIds.length === 0) {
            toast({ title: "无选择", description: "请选择要删除的节点或连线" })
            return
        }
        const nextNodes = nodes.filter((n) => !selectedNodeIds.includes(n.id))
        const nextEdges = edges.filter(
            (e) =>
                !selectedEdgeIds.includes(e.id) &&
                !selectedNodeIds.includes(e.source) &&
                !selectedNodeIds.includes(e.target)
        )
        const removedEdgesCount = edges.length - nextEdges.length
        setNodes(nextNodes)
        setEdges(nextEdges)
        // 同步到状态管理系统
        actions.importData(nextNodes, nextEdges)
        saveToHistory()
        toast({
            title: "已删除",
            description: `节点 ${selectedNodeIds.length} 个，连线 ${removedEdgesCount} 条`,
        })
        }, [nodes, edges, selectedNodeIds, selectedEdgeIds, setNodes, setEdges, saveToHistory, toast, actions])

    // 克隆所选（带位移与内部连线重映射）
    const cloneSelection = useCallback(() => {
        const selNodes = nodes.filter((n) => selectedNodeIds.includes(n.id))
        if (selNodes.length === 0) {
            toast({ title: "无法克隆", description: "请先选择要克隆的节点" })
            return
        }
        const t = Date.now()
        const offset = 40
        const idMap: Record<string, string> = {}
        const clones: Node[] = selNodes.map((n, idx) => {
            const newId = `${n.id}-copy-${t}-${idx}`
            idMap[n.id] = newId
            return {
                ...n,
                id: newId,
                position: { x: n.position.x + offset, y: n.position.y + offset },
                selected: true,
            }
        })
        const newEdges: Edge[] = edges
            .filter((e) => selectedNodeIds.includes(e.source) && selectedNodeIds.includes(e.target))
            .map((e, idx) => ({
                ...e,
                id: `${e.id ?? "e"}-copy-${t}-${idx}`,
                source: idMap[e.source],
                target: idMap[e.target],
                selected: true,
            }))
        const finalNodes = [...nodes.map((n) => ({ ...n, selected: false })), ...clones]
        const finalEdges = [...edges, ...newEdges]
        setNodes(finalNodes)
        setEdges(finalEdges)
        // 同步到状态管理系统
        actions.importData(finalNodes, finalEdges)
        saveToHistory()
        toast({
            title: "已克隆",
            description: `节点 ${clones.length} 个，连线 ${newEdges.length} 条`,
        })
        }, [nodes, edges, selectedNodeIds, setNodes, setEdges, saveToHistory, toast, actions])

    // 全选功能
    const selectAllNodes = useCallback(() => {
        setNodes(nds => nds.map(n => ({ ...n, selected: true })))
        setSelectedNodeIds(nodes.map(n => n.id))
        toast({
            title: "全选完成",
            description: `已选择 ${nodes.length} 个节点`,
        })
    }, [nodes, setNodes, toast])

    // 快捷键：Delete 删除、Ctrl/Cmd+D 克隆、Ctrl/Cmd+A 全选、Ctrl/Cmd+Z 撤销、Ctrl/Cmd+Y 重做
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            // 检查焦点元素，如果是输入框则不处理
            const activeElement = document.activeElement as HTMLElement
            const isInputFocused = activeElement && (
                activeElement.tagName === 'INPUT' || 
                activeElement.tagName === 'TEXTAREA' ||
                activeElement.contentEditable === 'true'
            )
            
            // 如果输入框有焦点，只处理特定的快捷键
            if (isInputFocused) {
                const meta = e.ctrlKey || e.metaKey
                const key = e.key.toLowerCase()
                // 只允许撤销/重做在输入框中工作
                if (meta && key === "z" && !e.shiftKey) {
                    // 让浏览器处理输入框的撤销
                    return
                } else if (meta && (key === "y" || (key === "z" && e.shiftKey))) {
                    // 让浏览器处理输入框的重做
                    return
                }
                // 其他快捷键在输入框中不处理
                return
            }
            
            const meta = e.ctrlKey || e.metaKey
            const key = e.key.toLowerCase()
            if (key === "delete" || key === "backspace") {
                e.preventDefault()
                deleteSelection()
            } else if (meta && key === "d") {
                e.preventDefault()
                cloneSelection()
            } else if (meta && key === "a") {
                e.preventDefault()
                selectAllNodes()
            } else if (meta && key === "z" && !e.shiftKey) {
                e.preventDefault()
                handleUndo()
            } else if (meta && (key === "y" || (key === "z" && e.shiftKey))) {
                e.preventDefault()
                handleRedo()
            } else if (meta && key === "c") {
                toast({ title: "复制（Mock）", description: "剪贴板功能稍后提供" })
            } else if (meta && key === "v") {
                toast({ title: "粘贴（Mock）", description: "剪贴板功能稍后提供" })
            }
        }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [deleteSelection, cloneSelection, selectAllNodes, handleUndo, handleRedo, toast])

    return (
        <ContextMenu>
            <ContextMenuTrigger asChild>
                <div 
                    ref={canvasRef}
                    className="h-full relative"
                    onMouseDown={onSelectionStart}
                    onMouseMove={onSelectionMove}
                    onMouseUp={onSelectionEnd}
                >
                    {/* 工具栏 */}
                    <div className="absolute left-2 top-2 z-10 flex gap-1">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={handleUndo}
                                        disabled={!canUndo}
                                        aria-label="撤销"
                                    >
                                        <RotateCcw className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>撤销 (Ctrl/Cmd+Z)</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={handleRedo}
                                        disabled={!canRedo}
                                        aria-label="重做"
                                    >
                                        <RotateCw className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>重做 (Ctrl+Shift+Z / Ctrl+Y)</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        size="sm"
                                        variant={snapToGridEnabled ? "default" : "ghost"}
                                        onClick={() => setSnapToGridEnabled(!snapToGridEnabled)}
                                        aria-label="网格吸附"
                                    >
                                        <Grid3X3 className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>网格吸附 {snapToGridEnabled ? '已启用' : '已禁用'}</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        size="sm"
                                        variant={showGrid ? "default" : "ghost"}
                                        onClick={() => setShowGrid(!showGrid)}
                                        aria-label="显示网格"
                                    >
                                        <AlignLeft className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>显示网格 {showGrid ? '已启用' : '已禁用'}</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>

                    {/* 对齐工具栏 */}
                    <AlignmentToolbar
                        selectedCount={selectedNodeIds.length}
                        onAlign={handleAlign}
                        visible={selectedNodeIds.length >= 2}
                    />

                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onDrop={onDrop}
                        onDragOver={onDragOver}
                        onNodeDrag={onNodeDrag}
                        onNodeDragStop={onNodeDragStop}
                        onSelectionChange={(sel: OnSelectionChangeParams) => {
                            setSelectedNodeIds(sel.nodes.map((n) => n.id))
                            setSelectedEdgeIds(sel.edges.map((e) => e.id))
                        }}
                        nodeTypes={nodeTypes}
                        connectionMode={ConnectionMode.Strict}
                        defaultEdgeOptions={{
                            style: { strokeWidth: 2, stroke: "hsl(var(--primary))" },
                            markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14, color: "hsl(var(--primary))" },
                        }}
                        connectionLineType={ConnectionLineType.SmoothStep}
                        connectionLineStyle={{ strokeWidth: 2, stroke: "hsl(var(--muted-foreground))", strokeDasharray: 6 }}
                        fitView
                        selectNodesOnDrag={false}
                    >
                        {/* 网格背景 */}
                        <GridBackground 
                            gridSize={GRID_SIZE} 
                            visible={showGrid}
                            opacity={0.2}
                        />
                        <Background 
                            variant={BackgroundVariant.Dots} 
                            gap={GRID_SIZE} 
                            size={1}
                            style={{ opacity: showGrid ? 0.3 : 0.1 }}
                        />
                        <MiniMap pannable zoomable />
                        <Controls showInteractive={false} />
                    </ReactFlow>

                    {/* 对齐指导线 */}
                    <AlignmentGuides
                        guides={alignmentGuides}
                        canvasWidth={canvasSize.width}
                        canvasHeight={canvasSize.height}
                    />

                    {/* 橡皮框选择 */}
                    <SelectionBox
                        startX={selectionStart.x}
                        startY={selectionStart.y}
                        currentX={selectionCurrent.x}
                        currentY={selectionCurrent.y}
                        visible={isSelecting}
                    />
                </div>
            </ContextMenuTrigger>
            <ContextMenuContent>
                <ContextMenuLabel>编辑</ContextMenuLabel>
                <ContextMenuItem onSelect={handleUndo} disabled={!canUndo}>
                    撤销
                    <ContextMenuShortcut>Ctrl/Cmd+Z</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuItem onSelect={handleRedo} disabled={!canRedo}>
                    重做
                    <ContextMenuShortcut>Ctrl+Shift+Z</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem onSelect={() => selectAllNodes()}>
                    全选
                    <ContextMenuShortcut>Ctrl/Cmd+A</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem onSelect={() => toast({ title: "复制（Mock）", description: "剪贴板稍后提供" })}>
                    <Copy className="mr-2 h-4 w-4" />
                    复制
                    <ContextMenuShortcut>Ctrl/Cmd+C</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuItem onSelect={() => toast({ title: "粘贴（Mock）", description: "剪贴板稍后提供" })}>
                    <ClipboardPaste className="mr-2 h-4 w-4" />
                    粘贴
                    <ContextMenuShortcut>Ctrl/Cmd+V</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuItem disabled={false} onSelect={() => cloneSelection()}>
                    克隆
                    <ContextMenuShortcut>Ctrl/Cmd+D</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuItem
                    onSelect={() => deleteSelection()}
                    disabled={false}
                >
                    <Trash2 className="mr-2 h-4 w-4" />
                    删除
                    <ContextMenuShortcut>Del</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuSeparator />
                {selectedNodeIds.length >= 2 ? (
                    <ContextMenuSub>
                        <ContextMenuSubTrigger>
                            <AlignLeft className="mr-2 h-4 w-4" />
                            对齐
                        </ContextMenuSubTrigger>
                        <ContextMenuSubContent className="w-48">
                            <ContextMenuItem onSelect={() => handleAlign('left')}>
                                左对齐
                            </ContextMenuItem>
                            <ContextMenuItem onSelect={() => handleAlign('center')}>
                                水平居中
                            </ContextMenuItem>
                            <ContextMenuItem onSelect={() => handleAlign('right')}>
                                右对齐
                            </ContextMenuItem>
                            <ContextMenuSeparator />
                            <ContextMenuItem onSelect={() => handleAlign('top')}>
                                顶部对齐
                            </ContextMenuItem>
                            <ContextMenuItem onSelect={() => handleAlign('middle')}>
                                垂直居中
                            </ContextMenuItem>
                            <ContextMenuItem onSelect={() => handleAlign('bottom')}>
                                底部对齐
                            </ContextMenuItem>
                            <ContextMenuSeparator />
                            <ContextMenuItem 
                                onSelect={() => handleAlign('distribute-horizontal')}
                                disabled={selectedNodeIds.length < 3}
                            >
                                水平分布
                            </ContextMenuItem>
                            <ContextMenuItem 
                                onSelect={() => handleAlign('distribute-vertical')}
                                disabled={selectedNodeIds.length < 3}
                            >
                                垂直分布
                            </ContextMenuItem>
                        </ContextMenuSubContent>
                    </ContextMenuSub>
                ) : (
                    <ContextMenuItem disabled>
                        <AlignLeft className="mr-2 h-4 w-4" />
                        对齐
                    </ContextMenuItem>
                )}
                <ContextMenuSeparator />
                <ContextMenuLabel>布局</ContextMenuLabel>
                <ContextMenuItem onSelect={handleAutoLayout}>
                    <GitBranch className="mr-2 h-4 w-4" />
                    自动布局为树形结构
                </ContextMenuItem>
                <ContextMenuItem onSelect={handleScatterNodes}>
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    散乱分布节点
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem onSelect={() => setSnapToGridEnabled(!snapToGridEnabled)}>
                    <Grid3X3 className="mr-2 h-4 w-4" />
                    {snapToGridEnabled ? '禁用' : '启用'}网格吸附
                </ContextMenuItem>
                <ContextMenuItem onSelect={() => setShowGrid(!showGrid)}>
                    显示网格 {showGrid ? '✓' : ''}
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem onSelect={() => toast({ title: "折叠子树（Mock）" })}>
                    折叠子树
                </ContextMenuItem>
                <ContextMenuItem onSelect={() => toast({ title: "展开子树（Mock）" })}>
                    展开子树
                </ContextMenuItem>
                <ContextMenuItem onSelect={() => toast({ title: "添加断点（Mock）" })}>
                    添加断点
                </ContextMenuItem>
                <ContextMenuSeparator />
            </ContextMenuContent>
        </ContextMenu>
    )
}

function BtCanvas({ 
    onNodesExport,
    onEdgesExport
}: { 
    onNodesExport?: (nodes: Node[]) => void;
    onEdgesExport?: (edges: Edge[]) => void;
}) {
    // 获取当前会话ID作为key，强制重新渲染
    const currentSessionId = useBehaviorTreeStore(state => state.currentSession?.id)
    
    return (
        <ReactFlowProvider key={currentSessionId}>
            <CanvasInner 
                onNodesExport={onNodesExport}
                onEdgesExport={onEdgesExport}
            />
        </ReactFlowProvider>
    )
}

// ---------- Main App Layout ----------
export default function App() {
    // 状态管理
    const actions = useBehaviorTreeStore(state => state.actions)
    const { toast } = useToast()
    
    // XML导入/导出对话框状态
    const [importDialogOpen, setImportDialogOpen] = useState(false);
    const [exportDialogOpen, setExportDialogOpen] = useState(false);
    
    // 导入的节点和边数据
    const [importedNodes, setImportedNodes] = useState<Node[] | null>(null);
    const [importedEdges, setImportedEdges] = useState<Edge[] | null>(null);
    
    // 用于导出的节点和边数据
    const [nodesToExport, setNodesToExport] = useState<Node[]>([]);
    const [edgesToExport, setEdgesToExport] = useState<Edge[]>([]);
    
    // 处理新建项目
    const handleNewProject = () => {
        const projectName = `新建项目 ${new Date().toLocaleTimeString()}`
        actions.createSession(projectName)
        toast({
            title: "项目创建成功",
            description: `已创建新项目：${projectName}`,
        })
    }
    
    // 处理导入 - 直接导入到当前会话，不使用全局导入状态
    const handleImport = (nodes: Node[], edges: Edge[]) => {
        // 直接更新当前会话的数据
        actions.importData(nodes, edges);
        setImportDialogOpen(false);
        
        toast({
            title: "导入成功",
            description: `已导入 ${nodes.length} 个节点和 ${edges.length} 条连线到当前项目`,
        });
    };
    return (
        <div className="h-screen w-screen bg-white dark:bg-[#0b0f17] text-foreground flex flex-col overflow-hidden">
            <TopBar 
                onImportClick={() => setImportDialogOpen(true)}
                onExportClick={() => setExportDialogOpen(true)}
                onNewProject={handleNewProject}
            />
            <TabBar />
            <main className="flex-1 min-h-0">
                <ResizablePanelGroup direction="horizontal" className="h-full">
                    <ResizablePanel defaultSize={18} minSize={14} className="hidden md:block">
                        <LeftPalette />
                    </ResizablePanel>
                    <ResizableHandle withHandle />
                    <ResizablePanel defaultSize={64} minSize={40}>
                        <div className="h-full">
                            <BtCanvas 
                                onNodesExport={setNodesToExport}
                                onEdgesExport={setEdgesToExport}
                            />
                        </div>
                    </ResizablePanel>
                    <ResizableHandle withHandle />
                    <ResizablePanel defaultSize={18} minSize={16} className="hidden lg:block">
                        <RightInspector />
                    </ResizablePanel>
                </ResizablePanelGroup>
            </main>
            <BottomTimeline />
            
            {/* XML导入/导出对话框 */}
            <ImportDialog 
                open={importDialogOpen}
                onOpenChange={setImportDialogOpen}
                onImport={handleImport}
            />
            
            <ExportDialog 
                open={exportDialogOpen}
                onOpenChange={setExportDialogOpen}
                nodes={nodesToExport}
                edges={edgesToExport}
            />
        </div>
    )
}