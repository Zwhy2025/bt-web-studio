import React, { useCallback, useEffect, useState, useRef } from "react"
import { ThemeProvider } from "@/components/theme-provider"
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
import {
    ResizablePanelGroup,
    ResizablePanel,
    ResizableHandle,
} from "@/components/ui/resizable"
import { CollapsibleLayout, PanelStatusIndicator } from '@/components/layout/collapsible-layout'
import {
    Play,
    Pause,
    RefreshCcw,
    Save,
    Import,
    Download,
    Search,
    Bug,
    Plus,
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
    Plug,
    StepForward,
    Square,
} from "lucide-react"
import { RightInspector } from "@/components/right-inspector"
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
    OnNodesChange,
    OnEdgesChange,
    applyNodeChanges,
    applyEdgeChanges,
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
import { HistoryManager } from "@/core/utils/history-utils"
import { autoLayoutTree, scatterNodes } from "@/core/layout/auto-layout-utils"
import {
    calculateAlignmentGuides,
    alignNodes,
    GRID_SIZE,
    AlignmentGuide,
    getNodesInSelectionBox,
} from "@/core/layout/alignment-utils"
import {
    AlignmentGuides,
    GridSnapIndicator,
    SelectionBox,
    GridBackground,
    AlignmentToolbar
} from "@/components/canvas/alignment-guides"
import { BlackboardPanel } from "@/components/blackboard-panel"
import { TabBar } from "@/components/tab-bar"
import { useBehaviorTreeStore } from "@/core/store/behavior-tree-store"
import { TimelinePanel, createSampleTimelineState } from "@/components/layout/timeline-panel"
import { LeftPalette } from "@/components/layout/left-palette"
import { useI18n } from "@/hooks/use-i18n"

import { TopBar } from "@/components/layout/top-bar"

import { BottomTimeline } from "@/components/layout/bottom-timeline"

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


import { BtCanvas } from '@/components/layout/bt-canvas';

function AppContent() {
    const { t } = useI18n()
    const actions = useBehaviorTreeStore(state => state.actions);
    const { toast } = useToast();

    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
    const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
    const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>(undefined);
    const [exportNodes, setExportNodes] = useState<Node[]>([]);
    const [exportEdges, setExportEdges] = useState<Edge[]>([]);

    // 创建新项目
    const handleNewProject = () => {
        const projectName = `${t('menu:newProject')} ${new Date().toLocaleTimeString()}`;
        actions.createSession(projectName);
        toast({
            title: t('messages:projectCreated'),
            description: `${t('messages:projectCreatedDesc')}：${projectName}`
        });
    };

    // 导入数据
    const handleImport = (nodes: Node[], edges: Edge[]) => {
        actions.importData(nodes, edges);
        setIsImportDialogOpen(false);
        toast({
            title: t('messages:importSuccess'),
            description: t('messages:importSuccessDesc').replace('{{nodes}}', nodes.length.toString()).replace('{{edges}}', edges.length.toString())
        });
    };

    return (
        <div className="h-screen w-screen bg-background text-foreground flex flex-col overflow-hidden">
            <TopBar
                onImportClick={() => setIsImportDialogOpen(true)}
                onExportClick={() => setIsExportDialogOpen(true)}
                onNewProject={handleNewProject}
            />
            <TabBar />
            <main className="flex-1 min-h-0">
                <CollapsibleLayout
                    leftPanel={<LeftPalette />}
                    centerPanel={
                        <BtCanvas
                            onNodesExport={setExportNodes}
                            onEdgesExport={setExportEdges}
                            onSelectionChange={setSelectedNodeId}
                        />
                    }
                    rightPanel={<RightInspector selectedNodeId={selectedNodeId} />}
                    bottomPanel={<BottomTimeline />}
                />
            </main>
            <PanelStatusIndicator />
            <ImportDialog
                open={isImportDialogOpen}
                onOpenChange={setIsImportDialogOpen}
                onImport={handleImport}
            />
            <ExportDialog
                open={isExportDialogOpen}
                onOpenChange={setIsExportDialogOpen}
                nodes={exportNodes}
                edges={exportEdges}
            />
        </div>
    );
}

function App() {
    return (
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={true} disableTransitionOnChange={true}>
            <AppContent />
        </ThemeProvider>
    );
}

export default App;