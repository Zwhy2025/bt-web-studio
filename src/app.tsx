import React, { useState } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { ImportDialog, ExportDialog } from "@/components/xml-dialog"
import { Node, Edge } from "reactflow"
import { useToast } from "@/hooks/use-toast"
import { useBehaviorTreeStore } from "@/core/store/behavior-tree-store"
import { useI18n } from "@/hooks/use-i18n"
import { TopBar } from "@/components/layout/top-bar"
import { ModeAwareLayout } from "@/components/layout/mode-aware-layout"
import { PanelStatusIndicator } from '@/components/layout/collapsible-layout'

import "reactflow/dist/style.css"

function AppContent() {
    const { t } = useI18n()
    const actions = useBehaviorTreeStore(state => state.actions)
    const { toast } = useToast()

    // 对话框状态
    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
    const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
    const [exportNodes, setExportNodes] = useState<Node[]>([])
    const [exportEdges, setExportEdges] = useState<Edge[]>([])

    // 新项目：暂不提供多项目，保持单项目工作流（仅编排模式可用时再开启）

    // 保存项目
    // 不提供显式保存按钮，保持单项目自动状态管理

    // 撤销操作
    const handleUndo = () => {
        // TODO: 实现撤销逻辑
        console.log('Undo operation')
    }

    // 重做操作
    const handleRedo = () => {
        // TODO: 实现重做逻辑
        console.log('Redo operation')
    }

    // 导入数据
    const handleImport = (nodes: Node[], edges: Edge[]) => {
        actions.importData(nodes, edges)
        setIsImportDialogOpen(false)
        toast({
            title: t('messages:importSuccess'),
            description: t('messages:importSuccessDesc')
                .replace('{{nodes}}', nodes.length.toString())
                .replace('{{edges}}', edges.length.toString())
        })
    }

    // 设置导出数据
    const handleExportData = (nodes: Node[], edges: Edge[]) => {
        setExportNodes(nodes)
        setExportEdges(edges)
    }

    return (
        <div className="h-screen w-screen bg-background text-foreground flex flex-col overflow-hidden">
            {/* 顶部栏 */}
            <TopBar
                onImportClick={() => setIsImportDialogOpen(true)}
                onExportClick={() => setIsExportDialogOpen(true)}
                onUndo={handleUndo}
                onRedo={handleRedo}
            />
            
            {/* 标签栏：暂不启用多项目标签，保持界面简洁 */}
            
            {/* 主内容区域 - 使用模式感知布局 */}
            <main className="flex-1 min-h-0">
                <ModeAwareLayout>
                    {/* 这里的children将被传递给各个模式的布局组件 */}
                    <div className="flex-1 flex">
                        {/* 模式特定的内容将在各自的布局组件中渲染 */}
                    </div>
                </ModeAwareLayout>
            </main>
            
            {/* 面板状态指示器 */}
            <PanelStatusIndicator />
            
            {/* 导入对话框 */}
            <ImportDialog
                open={isImportDialogOpen}
                onOpenChange={setIsImportDialogOpen}
                onImport={handleImport}
            />
            
            {/* 导出对话框 */}
            <ExportDialog
                open={isExportDialogOpen}
                onOpenChange={setIsExportDialogOpen}
                nodes={exportNodes}
                edges={exportEdges}
            />
        </div>
    )
}

function App() {
    return (
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={true} disableTransitionOnChange={true}>
            <AppContent />
        </ThemeProvider>
    );
}

export default App;
