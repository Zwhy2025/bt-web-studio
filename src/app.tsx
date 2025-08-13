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
    AlignLeft,
    AlignRight,
    AlignCenter,
    AlignVerticalJustifyCenter,
    AlignHorizontalJustifyCenter,
    AlignVerticalJustifyStart,
    AlignVerticalJustifyEnd,
    Grid3X3,
    HelpCircle,
    Info,
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
} from "@/components/ui/context-menu"
import {
    TooltipProvider,
    Tooltip,
    TooltipTrigger,
    TooltipContent,
} from "@/components/ui/tooltip"
import { 
    calculateAlignmentGuides, 
    alignNodes, 
    AlignmentGuide,
    SNAP_THRESHOLD 
} from "@/lib/alignment-utils"
import { AlignmentGuides } from "@/components/canvas/alignment-guides"

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
        </aside>
    )
}

// ---------- Top Bar ----------
function TopBar({ onImportClick, onExportClick }: { 
    onImportClick: () => void;
    onExportClick: () => void;
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
                            <MenubarItem>
                                <Plus className="mr-2 h-4 w-4" /> 新建
                            </MenubarItem>
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
                            <MenubarSeparator />
                            <MenubarItem>对齐到网格</MenubarItem>
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
                    <div className="flex items-center gap-1 mr-2">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                        <AlignLeft className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>左对齐</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                        <AlignCenter className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>水平居中</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                        <AlignRight className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>右对齐</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        <Separator orientation="vertical" className="h-6 mx-1" />
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
    importedNodes = null, 
    importedEdges = null,
    onNodesExport,
    onEdgesExport
}: { 
    importedNodes?: Node[] | null;
    importedEdges?: Edge[] | null;
    onNodesExport?: (nodes: Node[]) => void;
    onEdgesExport?: (edges: Edge[]) => void;
}) {
    const [nodes, setNodes, onNodesChange] = useNodesState(importedNodes || initialNodes)
    const [edges, setEdges, onEdgesChange] = useEdgesState(importedEdges || initialEdges)
    
    // 当导入新数据时更新画布
    useEffect(() => {
        if (importedNodes && importedEdges) {
            setNodes(importedNodes);
            setEdges(importedEdges);
        }
    }, [importedNodes, importedEdges, setNodes, setEdges]);
    
    // 当需要导出数据时提供当前画布数据
    useEffect(() => {
        if (onNodesExport) onNodesExport(nodes);
        if (onEdgesExport) onEdgesExport(edges);
    }, [nodes, edges, onNodesExport, onEdgesExport]);
    const { project } = useReactFlow()
    const { toast } = useToast()

    // selection state
    const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([])
    const [selectedEdgeIds, setSelectedEdgeIds] = useState<string[]>([])
    
    // 对齐吸附状态
    const [alignmentGuides, setAlignmentGuides] = useState<AlignmentGuide[]>([])
    const [isDragging, setIsDragging] = useState(false)
    const [snapToGridEnabled, setSnapToGridEnabled] = useState(true)

    const findNode = (id: string) => nodes.find((n) => n.id === id)

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

    // 节点拖拽处理
    const onNodeDragStart: NodeDragHandler = useCallback((event, node) => {
        // 防止意外触发
        if (event.type !== 'mousedown' && event.type !== 'touchstart') return
        setIsDragging(true)
        setAlignmentGuides([])
    }, [])

    const onNodeDrag: NodeDragHandler = useCallback((event, node) => {
        if (!isDragging) return
        
        // 暂时禁用对齐参考线功能，避免误导用户
        setAlignmentGuides([])
        
        // 只保留网格吸附功能
        if (snapToGridEnabled) {
            const gridSnap = {
                x: Math.round(node.position.x / 20) * 20,
                y: Math.round(node.position.y / 20) * 20
            }
            
            const updatedNode = {
                ...node,
                position: gridSnap
            }
            
            setNodes(nds => nds.map(n => n.id === node.id ? updatedNode : n))
        }
    }, [isDragging, snapToGridEnabled, setNodes])

    const onNodeDragStop: NodeDragHandler = useCallback((event, node) => {
        setIsDragging(false)
        setAlignmentGuides([])
        
        // 确保清理任何残留的拖拽状态
        setTimeout(() => {
            setAlignmentGuides([])
        }, 100)
    }, [])

    // 批量对齐功能
    const handleAlignNodes = useCallback((alignType: 'left' | 'right' | 'center' | 'top' | 'bottom' | 'middle' | 'distribute-horizontal' | 'distribute-vertical') => {
        const selectedNodes = nodes.filter(n => selectedNodeIds.includes(n.id))
        if (selectedNodes.length < 2) {
            toast({
                title: "对齐失败",
                description: "请选择至少2个节点进行对齐",
                variant: "destructive" as any,
            })
            return
        }

        const alignedNodes = alignNodes(selectedNodes, alignType)
        setNodes(nds => nds.map(n => {
            const aligned = alignedNodes.find(an => an.id === n.id)
            return aligned || n
        }))

        const alignTypeNames = {
            'left': '左对齐',
            'right': '右对齐', 
            'center': '水平居中',
            'top': '顶部对齐',
            'bottom': '底部对齐',
            'middle': '垂直居中',
            'distribute-horizontal': '水平分布',
            'distribute-vertical': '垂直分布'
        }

        toast({
            title: "对齐完成",
            description: `已应用${alignTypeNames[alignType]}到${selectedNodes.length}个节点`,
        })
    }, [nodes, selectedNodeIds, setNodes, toast])

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
            setEdges((eds) => addEdge({ ...params, animated: false }, eds))
        },
        [setEdges, edges, nodes, toast]
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
            setNodes((nds) => nds.concat(newNode))
        },
        [project, setNodes]
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
        toast({
            title: "已删除",
            description: `节点 ${selectedNodeIds.length} 个，连线 ${removedEdgesCount} 条`,
        })
    }, [nodes, edges, selectedNodeIds, selectedEdgeIds, setNodes, setEdges, toast])

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
        setNodes([...nodes.map((n) => ({ ...n, selected: false })), ...clones])
        setEdges([...edges, ...newEdges])
        toast({
            title: "已克隆",
            description: `节点 ${clones.length} 个，连线 ${newEdges.length} 条`,
        })
    }, [nodes, edges, selectedNodeIds, setNodes, setEdges, toast])

    // 全选功能
    const selectAllNodes = useCallback(() => {
        setNodes(nds => nds.map(n => ({ ...n, selected: true })))
        setSelectedNodeIds(nodes.map(n => n.id))
        toast({
            title: "全选完成",
            description: `已选择 ${nodes.length} 个节点`,
        })
    }, [nodes, setNodes, toast])

    // 快捷键：Delete 删除、Ctrl/Cmd+D 克隆、Ctrl/Cmd+A 全选
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
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
            } else if (meta && key === "c") {
                toast({ title: "复制（Mock）", description: "剪贴板功能稍后提供" })
            } else if (meta && key === "v") {
                toast({ title: "粘贴（Mock）", description: "剪贴板功能稍后提供" })
            }
        }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [deleteSelection, cloneSelection, selectAllNodes, toast])

    return (
        <ContextMenu>
            <ContextMenuTrigger asChild>
                <div className="h-full relative">
                    <div className="absolute left-2 top-2 z-10 flex gap-1">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() =>
                                            toast({
                                                title: "撤销",
                                                description: "已触发撤销（Mock）",
                                            })
                                        }
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
                                        onClick={() =>
                                            toast({
                                                title: "重做",
                                                description: "已触发重做（Mock）",
                                            })
                                        }
                                        aria-label="重做"
                                    >
                                        <RotateCw className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>重做 (Ctrl+Shift+Z / Ctrl+Y)</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onDrop={onDrop}
                        onDragOver={onDragOver}
                        onNodeDragStart={onNodeDragStart}
                        onNodeDrag={onNodeDrag}
                        onNodeDragStop={onNodeDragStop}
                        onSelectionChange={(sel) => {
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
                        snapToGrid={snapToGridEnabled}
                        snapGrid={[20, 20]}
                        fitView
                    >
                        <Background 
                            variant={BackgroundVariant.Dots} 
                            gap={20} 
                            size={1}
                            color={snapToGridEnabled ? "hsl(var(--muted-foreground))" : "transparent"}
                        />
                        <MiniMap pannable zoomable />
                        <Controls showInteractive={false} />
                        
                        {/* 对齐参考线 */}
                        {alignmentGuides.length > 0 && (
                            <AlignmentGuides 
                                guides={alignmentGuides}
                                canvasWidth={1000}
                                canvasHeight={800}
                            />
                        )}
                    </ReactFlow>
                </div>
            </ContextMenuTrigger>
            <ContextMenuContent>
                <ContextMenuLabel>编辑</ContextMenuLabel>
                <ContextMenuItem onSelect={() => toast({ title: "撤销", description: "已触发撤销（Mock）" })}>
                    撤销
                    <ContextMenuShortcut>Ctrl/Cmd+Z</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuItem onSelect={() => toast({ title: "重做", description: "已触发重做（Mock）" })}>
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
                <ContextMenuLabel>对齐</ContextMenuLabel>
                <ContextMenuItem 
                    onSelect={() => handleAlignNodes('left')}
                    disabled={selectedNodeIds.length < 2}
                >
                    <AlignLeft className="mr-2 h-4 w-4" />
                    左对齐
                </ContextMenuItem>
                <ContextMenuItem 
                    onSelect={() => handleAlignNodes('center')}
                    disabled={selectedNodeIds.length < 2}
                >
                    <AlignCenter className="mr-2 h-4 w-4" />
                    水平居中
                </ContextMenuItem>
                <ContextMenuItem 
                    onSelect={() => handleAlignNodes('right')}
                    disabled={selectedNodeIds.length < 2}
                >
                    <AlignRight className="mr-2 h-4 w-4" />
                    右对齐
                </ContextMenuItem>
                <ContextMenuItem 
                    onSelect={() => handleAlignNodes('top')}
                    disabled={selectedNodeIds.length < 2}
                >
                    <AlignVerticalJustifyStart className="mr-2 h-4 w-4" />
                    顶部对齐
                </ContextMenuItem>
                <ContextMenuItem 
                    onSelect={() => handleAlignNodes('middle')}
                    disabled={selectedNodeIds.length < 2}
                >
                    <AlignVerticalJustifyCenter className="mr-2 h-4 w-4" />
                    垂直居中
                </ContextMenuItem>
                <ContextMenuItem 
                    onSelect={() => handleAlignNodes('bottom')}
                    disabled={selectedNodeIds.length < 2}
                >
                    <AlignVerticalJustifyEnd className="mr-2 h-4 w-4" />
                    底部对齐
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem 
                    onSelect={() => handleAlignNodes('distribute-horizontal')}
                    disabled={selectedNodeIds.length < 3}
                >
                    水平分布
                </ContextMenuItem>
                <ContextMenuItem 
                    onSelect={() => handleAlignNodes('distribute-vertical')}
                    disabled={selectedNodeIds.length < 3}
                >
                    垂直分布
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem onSelect={() => setSnapToGridEnabled(!snapToGridEnabled)}>
                    <Grid3X3 className="mr-2 h-4 w-4" />
                    {snapToGridEnabled ? '禁用' : '启用'}网格吸附
                </ContextMenuItem>
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
                <ContextMenuItem onSelect={() => toast({ 
                    title: "功能说明", 
                    description: "🎯 对齐功能：让节点整齐排列，提升行为树可读性\n📐 网格吸附：拖拽时自动对齐到网格点，保持整洁布局\n📏 参考线：拖拽时显示蓝色对齐线，精确定位",
                    duration: 8000
                })}>
                    <HelpCircle className="mr-2 h-4 w-4" />
                    功能说明
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    )
}

function BtCanvas({ 
    importedNodes, 
    importedEdges,
    onNodesExport,
    onEdgesExport
}: { 
    importedNodes?: Node[] | null;
    importedEdges?: Edge[] | null;
    onNodesExport?: (nodes: Node[]) => void;
    onEdgesExport?: (edges: Edge[]) => void;
}) {
    return (
        <ReactFlowProvider>
            <CanvasInner 
                importedNodes={importedNodes}
                importedEdges={importedEdges}
                onNodesExport={onNodesExport}
                onEdgesExport={onEdgesExport}
            />
        </ReactFlowProvider>
    )
}

// ---------- Main App Layout ----------
export default function App() {
    // XML导入/导出对话框状态
    const [importDialogOpen, setImportDialogOpen] = useState(false);
    const [exportDialogOpen, setExportDialogOpen] = useState(false);
    
    // 导入的节点和边数据
    const [importedNodes, setImportedNodes] = useState<Node[] | null>(null);
    const [importedEdges, setImportedEdges] = useState<Edge[] | null>(null);
    
    // 用于导出的节点和边数据
    const [nodesToExport, setNodesToExport] = useState<Node[]>([]);
    const [edgesToExport, setEdgesToExport] = useState<Edge[]>([]);
    
    // 处理导入
    const handleImport = (nodes: Node[], edges: Edge[]) => {
        setImportedNodes(nodes);
        setImportedEdges(edges);
        setImportDialogOpen(false);
        
        // 显示导入成功提示
        const { toast } = require("@/hooks/use-toast");
        toast({
            title: "导入成功",
            description: `已导入 ${nodes.length} 个节点和 ${edges.length} 条连线`,
        });
    };
    return (
        <div className="h-screen w-screen bg-white dark:bg-[#0b0f17] text-foreground">
            <TopBar 
                onImportClick={() => setImportDialogOpen(true)}
                onExportClick={() => setExportDialogOpen(true)}
            />
            <main className="h-[calc(100vh-40px-44px)] md:h-[calc(100vh-48px-48px)]">
                <ResizablePanelGroup direction="horizontal" className="h-full">
                    <ResizablePanel defaultSize={18} minSize={14} className="hidden md:block">
                        <LeftPalette />
                    </ResizablePanel>
                    <ResizableHandle withHandle />
                    <ResizablePanel defaultSize={64} minSize={40}>
                        <div className="h-full">
                            <BtCanvas 
                                importedNodes={importedNodes}
                                importedEdges={importedEdges}
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