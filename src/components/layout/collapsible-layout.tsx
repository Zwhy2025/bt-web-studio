import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
    ResizablePanelGroup,
    ResizablePanel,
    ResizableHandle,
} from '@/components/ui/resizable'
import {
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    ChevronDown,
    PanelLeftClose,
    PanelLeftOpen,
    PanelRightClose,
    PanelRightOpen,
    PanelBottomClose,
    PanelBottomOpen,
    Menu,
    X
} from 'lucide-react'
import { cn } from '@/core/utils/utils'
import { useIsMobile } from '@/hooks/use-mobile'
import { useMediaQuery } from '@/hooks/use-media-query'

interface CollapsibleLayoutProps {
    leftPanel: React.ReactNode
    centerPanel: React.ReactNode
    rightPanel: React.ReactNode
    bottomPanel: React.ReactNode
    className?: string
}

interface PanelState {
    isCollapsed: boolean
    size: number
    minSize: number
    defaultSize: number
}

export function CollapsibleLayout({
    leftPanel,
    centerPanel,
    rightPanel,
    bottomPanel,
    className
}: CollapsibleLayoutProps) {
    const isMobile = useIsMobile()
    const isTablet = useMediaQuery('(max-width: 1024px)')

    // 面板状态管理
    const [leftPanelState, setLeftPanelState] = useState<PanelState>({
        isCollapsed: false,
        size: 18,
        minSize: 14,
        defaultSize: 18
    })

    const [rightPanelState, setRightPanelState] = useState<PanelState>({
        isCollapsed: false,
        size: 18,
        minSize: 16,
        defaultSize: 18
    })

    const [bottomPanelState, setBottomPanelState] = useState<PanelState>({
        isCollapsed: true, // 默认折叠时间轴面板
        size: 200, // 使用固定像素高度而不是百分比
        minSize: 160,
        defaultSize: 200
    })

    // 移动端抽屉状态
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
    const [activeMobilePanel, setActiveMobilePanel] = useState<'left' | 'right' | null>(null)

    // 响应式布局调整
    useEffect(() => {
        if (isMobile) {
            // 移动端：折叠所有面板，使用抽屉模式
            setLeftPanelState(prev => ({ ...prev, isCollapsed: true }))
            setRightPanelState(prev => ({ ...prev, isCollapsed: true }))
        } else if (isTablet) {
            // 平板端：折叠右侧面板，保持其他面板
            setRightPanelState(prev => ({ ...prev, isCollapsed: true }))
            setLeftPanelState(prev => ({ ...prev, isCollapsed: false }))
        } else {
            // 桌面端：展开所有面板
            setLeftPanelState(prev => ({ ...prev, isCollapsed: false }))
            setRightPanelState(prev => ({ ...prev, isCollapsed: false }))
        }
    }, [isMobile, isTablet])

    // 面板切换函数
    const toggleLeftPanel = useCallback(() => {
        setLeftPanelState(prev => ({
            ...prev,
            isCollapsed: !prev.isCollapsed,
            size: prev.isCollapsed ? prev.defaultSize : 0
        }))
    }, [])

    const toggleRightPanel = useCallback(() => {
        setRightPanelState(prev => ({
            ...prev,
            isCollapsed: !prev.isCollapsed,
            size: prev.isCollapsed ? prev.defaultSize : 0
        }))
    }, [])

    // 移动端面板切换
    const openMobilePanel = useCallback((panel: 'left' | 'right') => {
        setActiveMobilePanel(panel)
        setMobileDrawerOpen(true)
    }, [])

    const closeMobileDrawer = useCallback(() => {
        setMobileDrawerOpen(false)
        setActiveMobilePanel(null)
    }, [])

    // 键盘快捷键支持
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
                return
            }

            const meta = event.ctrlKey || event.metaKey
            const key = event.key.toLowerCase()

            if (meta && event.shiftKey) {
                switch (key) {
                    case 'l': // Ctrl+Shift+L: 切换左侧面板
                        event.preventDefault()
                        toggleLeftPanel()
                        break
                    case 'r': // Ctrl+Shift+R: 切换右侧面板
                        event.preventDefault()
                        toggleRightPanel()
                        break
                }
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [toggleLeftPanel, toggleRightPanel])

    // 移动端渲染
    if (isMobile) {
        return (
            <div className={cn("h-full flex flex-col", className)}>
                {/* 移动端工具栏 */}
                <div className="flex items-center justify-between p-2 border-b bg-background/95 backdrop-blur">
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openMobilePanel('left')}
                            className="h-8 w-8 p-0"
                        >
                            <Menu className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-medium">节点库</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openMobilePanel('right')}
                            className="h-8 w-8 p-0"
                        >
                            <PanelRightOpen className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* 主内容区域 */}
                <div className="flex-1 relative">
                    {centerPanel}
                </div>

                {/* 移动端抽屉 */}
                {mobileDrawerOpen && (
                    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
                        <div className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-background border-r shadow-lg">
                            <div className="flex items-center justify-between p-4 border-b">
                                <h3 className="font-semibold">
                                    {activeMobilePanel === 'left' && '节点库'}
                                    {activeMobilePanel === 'right' && '属性面板'}
                                </h3>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={closeMobileDrawer}
                                    className="h-8 w-8 p-0"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="flex-1 overflow-auto">
                                {activeMobilePanel === 'left' && leftPanel}
                                {activeMobilePanel === 'right' && rightPanel}
                            </div>
                        </div>
                        <div
                            className="fixed inset-0 -z-10"
                            onClick={closeMobileDrawer}
                        />
                    </div>
                )}
            </div>
        )
    }

    // 桌面端和平板端渲染
    return (
        <div className={cn("h-full flex flex-col", className)}>
            {/* 主要内容区域 - 水平布局 */}
            <div className="flex-1 min-h-0">
                <ResizablePanelGroup direction="horizontal" className="h-full">
                    {/* 左侧面板 */}
                    {!leftPanelState.isCollapsed && (
                        <>
                            <ResizablePanel
                                defaultSize={leftPanelState.defaultSize}
                                minSize={leftPanelState.minSize}
                                className="relative"
                            >
                                <div className="h-full relative">
                                    {leftPanel}
                                    {/* 左侧面板折叠按钮 */}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={toggleLeftPanel}
                                        className="absolute top-2 right-2 h-6 w-6 p-0 opacity-60 hover:opacity-100 z-10"
                                        title="折叠左侧面板 (Ctrl+Shift+L)"
                                    >
                                        <ChevronLeft className="h-3 w-3" />
                                    </Button>
                                </div>
                            </ResizablePanel>
                            <ResizableHandle withHandle />
                        </>
                    )}

                    {/* 中央编辑区域 */}
                    <ResizablePanel defaultSize={64} minSize={40} className="relative">
                        <div className="h-full relative">
                            {centerPanel}

                            {/* 面板控制按钮组 */}
                            <div className="absolute top-2 left-2 z-10 flex flex-col space-y-1">
                                {leftPanelState.isCollapsed && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={toggleLeftPanel}
                                        className="h-8 w-8 p-0 bg-background/80 backdrop-blur"
                                        title="展开左侧面板 (Ctrl+Shift+L)"
                                    >
                                        <PanelLeftOpen className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>

                            <div className="absolute top-2 right-2 z-10 flex flex-col space-y-1">
                                {rightPanelState.isCollapsed && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={toggleRightPanel}
                                        className="h-8 w-8 p-0 bg-background/80 backdrop-blur"
                                        title="展开右侧面板 (Ctrl+Shift+R)"
                                    >
                                        <PanelRightOpen className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </ResizablePanel>

                    {/* 右侧面板 */}
                    {!rightPanelState.isCollapsed && (
                        <>
                            <ResizableHandle withHandle />
                            <ResizablePanel
                                defaultSize={rightPanelState.defaultSize}
                                minSize={rightPanelState.minSize}
                                className="relative"
                            >
                                <div className="h-full relative">
                                    {rightPanel}
                                    {/* 右侧面板折叠按钮 */}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={toggleRightPanel}
                                        className="absolute top-2 left-2 h-6 w-6 p-0 opacity-60 hover:opacity-100 z-10"
                                        title="折叠右侧面板 (Ctrl+Shift+R)"
                                    >
                                        <ChevronRight className="h-3 w-3" />
                                    </Button>
                                </div>
                            </ResizablePanel>
                        </>
                    )}
                </ResizablePanelGroup>
            </div>

            {/* 底部面板 - 固定高度，可折叠 */}
            {!bottomPanelState.isCollapsed && (
                <div className="h-48 border-t bg-background flex-shrink-0">
                    <div className="h-full relative">
                        {bottomPanel}
                        {/* 底部面板折叠按钮 */}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setBottomPanelState(prev => ({ ...prev, isCollapsed: true }))}
                            className="absolute top-2 right-2 h-6 w-6 p-0 opacity-60 hover:opacity-100 z-10"
                            title="折叠底部面板"
                        >
                            <ChevronDown className="h-3 w-3" />
                        </Button>
                    </div>
                </div>
            )}

            {/* 底部面板展开按钮 */}
            {bottomPanelState.isCollapsed && (
                <div className="h-8 border-t bg-background flex-shrink-0 flex items-center justify-center">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setBottomPanelState(prev => ({ ...prev, isCollapsed: false }))}
                        className="h-6 w-20 p-0 opacity-60 hover:opacity-100"
                        title="展开底部面板"
                    >
                        <ChevronUp className="h-3 w-3 mr-1" />
                        <span className="text-xs">时间轴</span>
                    </Button>
                </div>
            )}
        </div>
    )
}

// 面板状态指示器组件
export function PanelStatusIndicator() {
    const isMobile = useIsMobile()
    const [showIndicator, setShowIndicator] = useState(false)

    // 监听键盘事件，显示快捷键提示
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if ((event.ctrlKey || event.metaKey) && event.shiftKey) {
                setShowIndicator(true)
            }
        }

        const handleKeyUp = () => {
            setShowIndicator(false)
        }

        document.addEventListener('keydown', handleKeyDown)
        document.addEventListener('keyup', handleKeyUp)

        return () => {
            document.removeEventListener('keydown', handleKeyDown)
            document.removeEventListener('keyup', handleKeyUp)
        }
    }, [])

    if (isMobile || !showIndicator) return null

    return (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-background/95 backdrop-blur border rounded-lg p-3 shadow-lg">
            <div className="text-sm text-foreground space-y-2">
                <div className="font-medium text-center">面板快捷键</div>
                <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between gap-4">
                        <span>左侧面板</span>
                        <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+Shift+L</kbd>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                        <span>右侧面板</span>
                        <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+Shift+R</kbd>
                    </div>
                </div>
            </div>
        </div>
    )
}
