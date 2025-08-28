import React from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
    Play,
    Pause,
    Square,
    StepForward,
    RotateCcw,
    ZoomIn,
    ZoomOut,
    Maximize,
    Grid3X3,
    Settings,
    Bug,
    Wifi,
    WifiOff,
    Eye,
    ArrowDown,
    ArrowRight,
    Minimize2,
    Maximize2
} from 'lucide-react'
import { cn } from '@/core/utils/utils'
import { SimpleThemeToggle } from '@/components/theme-toggle'
import { useI18n } from '@/hooks/use-i18n'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

interface TopToolbarProps {
    // 执行控制
    onPlay?: () => void
    onPause?: () => void
    onStop?: () => void
    onStep?: () => void
    onReset?: () => void

    // 视图控制
    onZoomIn?: () => void
    onZoomOut?: () => void
    onFitView?: () => void
    onToggleGrid?: () => void

    // 预览控制
    onToggleTreeDirection?: () => void
    onToggleCompactMode?: () => void
    treeDirection?: 'vertical' | 'horizontal'
    isCompactMode?: boolean

    // 状态
    isPlaying?: boolean
    isPaused?: boolean
    isConnected?: boolean
    executionState?: 'idle' | 'running' | 'paused' | 'error'

    className?: string
}

export function TopToolbar({
    onPlay,
    onPause,
    onStop,
    onStep,
    onReset,
    onZoomIn,
    onZoomOut,
    onFitView,
    onToggleGrid,
    onToggleTreeDirection,
    onToggleCompactMode,
    treeDirection = 'vertical',
    isCompactMode = false,
    isPlaying = false,
    isPaused = false,
    isConnected = false,
    executionState = 'idle',
    className
}: TopToolbarProps) {
    const { t } = useI18n()

    const getExecutionStateColor = () => {
        switch (executionState) {
            case 'running':
                return 'bg-green-500'
            case 'paused':
                return 'bg-yellow-500'
            case 'error':
                return 'bg-red-500'
            default:
                return 'bg-gray-500'
        }
    }

    const getExecutionStateText = () => {
        switch (executionState) {
            case 'running':
                return t('common:running')
            case 'paused':
                return t('common:paused')
            case 'error':
                return t('common:error')
            default:
                return t('common:ready')
        }
    }

    return (
        <div className={cn(
            "h-full px-4 flex items-center justify-between",
            "bg-gradient-to-r from-gray-800 to-gray-750",
            "border-b border-gray-700",
            className
        )}>
            {/* 中间：执行控制 */}
            <div className="flex-1 flex items-center justify-center">
                <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2 bg-gray-700 rounded-lg p-2">
                        <Button
                            variant={isPlaying ? "default" : "secondary"}
                            size="sm"
                            onClick={isPlaying ? onPause : onPlay}
                            className={cn(
                                "w-10 h-10 rounded-full",
                                isPlaying
                                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                                    : "bg-green-600 hover:bg-green-700 text-white"
                            )}
                        >
                            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                        </Button>

                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={onStop}
                            className="w-10 h-10 rounded-full bg-red-600 hover:bg-red-700 text-white"
                        >
                            <Square className="w-5 h-5" />
                        </Button>

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onStep}
                            className="w-10 h-10 rounded-full text-gray-300 hover:text-white hover:bg-gray-600"
                        >
                            <StepForward className="w-5 h-5" />
                        </Button>

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onReset}
                            className="w-10 h-10 rounded-full text-gray-300 hover:text-white hover:bg-gray-600"
                        >
                            <RotateCcw className="w-5 h-5" />
                        </Button>
                    </div>

                    {/* 执行状态指示 */}
                    <div className="flex items-center space-x-2">
                        <div className={cn("w-3 h-3 rounded-full", getExecutionStateColor())} />
                        <Badge variant="secondary" className="bg-gray-700 text-gray-300">
                            {getExecutionStateText()}
                        </Badge>
                    </div>
                </div>
            </div>

            {/* 右侧：视图控制和设置 */}
            <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onZoomOut}
                        className="text-gray-300 hover:text-white hover:bg-gray-700"
                    >
                        <ZoomOut className="w-4 h-4" />
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onZoomIn}
                        className="text-gray-300 hover:text-white hover:bg-gray-700"
                    >
                        <ZoomIn className="w-4 h-4" />
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onFitView}
                        className="text-gray-300 hover:text-white hover:bg-gray-700"
                    >
                        <Maximize className="w-4 h-4" />
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onToggleGrid}
                        className="text-gray-300 hover:text-white hover:bg-gray-700"
                    >
                        <Grid3X3 className="w-4 h-4" />
                    </Button>
                </div>

                <Separator orientation="vertical" className="h-6 bg-gray-600" />

                {/* 连接状态 */}
                <div className="flex items-center space-x-2">
                    {isConnected ? (
                        <Wifi className="w-4 h-4 text-green-500" />
                    ) : (
                        <WifiOff className="w-4 h-4 text-red-500" />
                    )}
                    <span className="text-sm text-gray-400">
                        {isConnected ? t('common:connected') : t('common:disconnected')}
                    </span>
                </div>

                <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-300 hover:text-white hover:bg-gray-700"
                >
                    <Bug className="w-4 h-4 mr-1" />
                    {t('menu:debug')}
                </Button>

                {/* 预览功能 */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-300 hover:text-white hover:bg-gray-700"
                        >
                            <Eye className="w-4 h-4 mr-1" />
                            预览
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-[160px]">
                        <DropdownMenuItem
                            onClick={onToggleTreeDirection}
                            className="gap-2 cursor-pointer"
                        >
                            {treeDirection === 'vertical' ? (
                                <ArrowRight className="w-4 h-4" />
                            ) : (
                                <ArrowDown className="w-4 h-4" />
                            )}
                            <span>
                                {treeDirection === 'vertical' ? '水平布局' : '垂直布局'}
                            </span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={onToggleCompactMode}
                            className="gap-2 cursor-pointer"
                        >
                            {isCompactMode ? (
                                <Maximize2 className="w-4 h-4" />
                            ) : (
                                <Minimize2 className="w-4 h-4" />
                            )}
                            <span>
                                {isCompactMode ? '宽松模式' : '紧凑模式'}
                            </span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <SimpleThemeToggle />

                <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-300 hover:text-white hover:bg-gray-700"
                >
                    <Settings className="w-4 h-4" />
                </Button>
            </div>
        </div>
    )
}

