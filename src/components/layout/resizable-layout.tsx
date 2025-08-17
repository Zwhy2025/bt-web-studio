import React, { useState } from 'react'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { cn } from '@/lib/utils'

interface ResizableLayoutProps {
    topToolbar: React.ReactNode
    leftPanel: React.ReactNode
    centerPanel: React.ReactNode
    rightPanel: React.ReactNode
    bottomPanel: React.ReactNode
    className?: string
}

export function ResizableLayout({
    topToolbar,
    leftPanel,
    centerPanel,
    rightPanel,
    bottomPanel,
    className
}: ResizableLayoutProps) {
    const [isLeftCollapsed, setIsLeftCollapsed] = useState(false)
    const [isRightCollapsed, setIsRightCollapsed] = useState(false)
    const [isBottomCollapsed, setIsBottomCollapsed] = useState(false)

    return (
        <div className={cn("h-screen flex flex-col bg-gray-900", className)}>
            {/* 顶部工具栏 */}
            <div className="h-14 bg-gray-800 border-b border-gray-700 flex-shrink-0">
                {topToolbar}
            </div>

            {/* 主要内容区域 */}
            <div className="flex-1 overflow-hidden">
                <ResizablePanelGroup direction="horizontal" className="h-full">
                    {/* 左侧节点库面板 */}
                    <ResizablePanel
                        defaultSize={20}
                        minSize={15}
                        maxSize={35}
                        collapsible={true}
                        onCollapse={() => setIsLeftCollapsed(true)}
                        onExpand={() => setIsLeftCollapsed(false)}
                        className={cn(
                            "bg-gray-800 border-r border-gray-700",
                            isLeftCollapsed && "min-w-0"
                        )}
                    >
                        {!isLeftCollapsed && leftPanel}
                    </ResizablePanel>

                    <ResizableHandle withHandle className="bg-gray-700 hover:bg-blue-600 transition-colors" />

                    {/* 中间编辑区域 */}
                    <ResizablePanel defaultSize={60} minSize={30}>
                        <ResizablePanelGroup direction="vertical" className="h-full">
                            {/* 主编辑区 */}
                            <ResizablePanel
                                defaultSize={75}
                                minSize={40}
                                className="bg-gray-900"
                            >
                                {centerPanel}
                            </ResizablePanel>

                            <ResizableHandle withHandle className="bg-gray-700 hover:bg-blue-600 transition-colors" />

                            {/* 底部时间轴面板 */}
                            <ResizablePanel
                                defaultSize={25}
                                minSize={15}
                                maxSize={40}
                                collapsible={true}
                                onCollapse={() => setIsBottomCollapsed(true)}
                                onExpand={() => setIsBottomCollapsed(false)}
                                className={cn(
                                    "bg-gray-800 border-t border-gray-700",
                                    isBottomCollapsed && "min-h-0"
                                )}
                            >
                                {!isBottomCollapsed && bottomPanel}
                            </ResizablePanel>
                        </ResizablePanelGroup>
                    </ResizablePanel>

                    <ResizableHandle withHandle className="bg-gray-700 hover:bg-blue-600 transition-colors" />

                    {/* 右侧属性面板 */}
                    <ResizablePanel
                        defaultSize={20}
                        minSize={15}
                        maxSize={35}
                        collapsible={true}
                        onCollapse={() => setIsRightCollapsed(true)}
                        onExpand={() => setIsRightCollapsed(false)}
                        className={cn(
                            "bg-gray-800 border-l border-gray-700",
                            isRightCollapsed && "min-w-0"
                        )}
                    >
                        {!isRightCollapsed && rightPanel}
                    </ResizablePanel>
                </ResizablePanelGroup>
            </div>
        </div>
    )
}

// 面板折叠控制按钮组件
interface PanelToggleButtonProps {
    isCollapsed: boolean
    onToggle: () => void
    position: 'left' | 'right' | 'bottom'
    className?: string
}

export function PanelToggleButton({
    isCollapsed,
    onToggle,
    position,
    className
}: PanelToggleButtonProps) {
    const getIcon = () => {
        switch (position) {
            case 'left':
                return isCollapsed ? '→' : '←'
            case 'right':
                return isCollapsed ? '←' : '→'
            case 'bottom':
                return isCollapsed ? '↑' : '↓'
            default:
                return '⟷'
        }
    }

    const getPositionClasses = () => {
        switch (position) {
            case 'left':
                return 'left-0 top-1/2 -translate-y-1/2'
            case 'right':
                return 'right-0 top-1/2 -translate-y-1/2'
            case 'bottom':
                return 'bottom-0 left-1/2 -translate-x-1/2'
            default:
                return ''
        }
    }

    return (
        <button
            onClick={onToggle}
            className={cn(
                "absolute z-10 w-6 h-6 bg-gray-700 hover:bg-blue-600 text-white text-xs",
                "flex items-center justify-center transition-colors rounded",
                "border border-gray-600 hover:border-blue-500",
                getPositionClasses(),
                className
            )}
            title={`${isCollapsed ? '展开' : '折叠'}面板`}
        >
            {getIcon()}
        </button>
    )
}