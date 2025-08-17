import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
    Play,
    Pause,
    Square,
    SkipBack,
    SkipForward,
    FastForward,
    Rewind,
    Clock,
    Filter,
    Search,
    ZoomIn,
    ZoomOut,
    Maximize2,
    RotateCcw,
    Settings
} from 'lucide-react'
import { cn } from '@/lib/utils'

// 时间轴事件类型
export interface TimelineEvent {
    id: string
    timestamp: number
    nodeId: string
    nodeName: string
    type: 'start' | 'success' | 'failure' | 'running'
    duration?: number
    data?: any
}

// 时间轴状态
export interface TimelineState {
    currentTime: number
    totalDuration: number
    isPlaying: boolean
    playbackSpeed: number
    events: TimelineEvent[]
    filteredEvents: TimelineEvent[]
}

interface TimelinePanelProps {
    timelineState: TimelineState
    onPlay?: () => void
    onPause?: () => void
    onStop?: () => void
    onSeek?: (time: number) => void
    onSpeedChange?: (speed: number) => void
    onFilterChange?: (filter: string) => void
    className?: string
}

export function TimelinePanel({
    timelineState,
    onPlay,
    onPause,
    onStop,
    onSeek,
    onSpeedChange,
    onFilterChange,
    className
}: TimelinePanelProps) {
    const [zoomLevel, setZoomLevel] = useState(1)
    const [filterText, setFilterText] = useState('')
    const [selectedEventType, setSelectedEventType] = useState<string>('all')
    const timelineRef = useRef<HTMLDivElement>(null)
    const [isDragging, setIsDragging] = useState(false)

    // 播放速度选项
    const speedOptions = [
        { label: '0.25x', value: 0.25 },
        { label: '0.5x', value: 0.5 },
        { label: '1x', value: 1 },
        { label: '2x', value: 2 },
        { label: '4x', value: 4 },
        { label: '8x', value: 8 }
    ]

    // 格式化时间显示
    const formatTime = (milliseconds: number) => {
        const seconds = Math.floor(milliseconds / 1000)
        const minutes = Math.floor(seconds / 60)
        const remainingSeconds = seconds % 60
        const ms = milliseconds % 1000

        if (minutes > 0) {
            return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}.${Math.floor(ms / 100)}`
        }
        return `${remainingSeconds}.${Math.floor(ms / 100)}s`
    }

    // 获取事件颜色
    const getEventColor = (type: string) => {
        switch (type) {
            case 'start':
                return 'bg-blue-500'
            case 'success':
                return 'bg-green-500'
            case 'failure':
                return 'bg-red-500'
            case 'running':
                return 'bg-yellow-500'
            default:
                return 'bg-gray-500'
        }
    }

    // 获取事件类型文本
    const getEventTypeText = (type: string) => {
        switch (type) {
            case 'start':
                return '开始'
            case 'success':
                return '成功'
            case 'failure':
                return '失败'
            case 'running':
                return '运行中'
            default:
                return '未知'
        }
    }

    // 处理时间轴点击
    const handleTimelineClick = useCallback((event: React.MouseEvent) => {
        if (!timelineRef.current) return

        const rect = timelineRef.current.getBoundingClientRect()
        const clickX = event.clientX - rect.left
        const timelineWidth = rect.width - 40 // 减去左右边距
        const clickRatio = Math.max(0, Math.min(1, clickX / timelineWidth))
        const targetTime = clickRatio * timelineState.totalDuration

        onSeek?.(targetTime)
    }, [timelineState.totalDuration, onSeek])

    // 处理拖拽
    const handleMouseDown = useCallback((event: React.MouseEvent) => {
        setIsDragging(true)
        handleTimelineClick(event)
    }, [handleTimelineClick])

    const handleMouseMove = useCallback((event: React.MouseEvent) => {
        if (isDragging) {
            handleTimelineClick(event)
        }
    }, [isDragging, handleTimelineClick])

    const handleMouseUp = useCallback(() => {
        setIsDragging(false)
    }, [])

    // 缩放控制
    const handleZoomIn = () => setZoomLevel(prev => Math.min(prev * 1.5, 10))
    const handleZoomOut = () => setZoomLevel(prev => Math.max(prev / 1.5, 0.1))
    const handleZoomFit = () => setZoomLevel(1)

    // 过滤事件
    const filteredEvents = timelineState.events.filter(event => {
        const matchesText = !filterText ||
            event.nodeName.toLowerCase().includes(filterText.toLowerCase()) ||
            event.id.toLowerCase().includes(filterText.toLowerCase())

        const matchesType = selectedEventType === 'all' || event.type === selectedEventType

        return matchesText && matchesType
    })

    return (
        <div className={cn("h-full flex flex-col bg-gray-800", className)}>
            {/* 控制栏 */}
            <div className="p-3 border-b border-gray-700 bg-gray-800">
                <div className="flex items-center justify-between">
                    {/* 左侧：播放控制 */}
                    <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1 bg-gray-700 rounded-lg p-1">
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onSeek?.(0)}
                                className="w-8 h-8 p-0 text-gray-300 hover:text-white hover:bg-gray-600"
                            >
                                <SkipBack className="w-4 h-4" />
                            </Button>

                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onSeek?.(Math.max(0, timelineState.currentTime - 1000))}
                                className="w-8 h-8 p-0 text-gray-300 hover:text-white hover:bg-gray-600"
                            >
                                <Rewind className="w-4 h-4" />
                            </Button>

                            <Button
                                size="sm"
                                variant={timelineState.isPlaying ? "default" : "secondary"}
                                onClick={timelineState.isPlaying ? onPause : onPlay}
                                className={cn(
                                    "w-8 h-8 p-0",
                                    timelineState.isPlaying
                                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                                        : "bg-green-600 hover:bg-green-700 text-white"
                                )}
                            >
                                {timelineState.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                            </Button>

                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={onStop}
                                className="w-8 h-8 p-0 bg-red-600 hover:bg-red-700 text-white"
                            >
                                <Square className="w-4 h-4" />
                            </Button>

                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onSeek?.(Math.min(timelineState.totalDuration, timelineState.currentTime + 1000))}
                                className="w-8 h-8 p-0 text-gray-300 hover:text-white hover:bg-gray-600"
                            >
                                <FastForward className="w-4 h-4" />
                            </Button>

                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onSeek?.(timelineState.totalDuration)}
                                className="w-8 h-8 p-0 text-gray-300 hover:text-white hover:bg-gray-600"
                            >
                                <SkipForward className="w-4 h-4" />
                            </Button>
                        </div>

                        {/* 播放速度 */}
                        <Select
                            value={timelineState.playbackSpeed.toString()}
                            onValueChange={(value) => onSpeedChange?.(parseFloat(value))}
                        >
                            <SelectTrigger className="w-20 h-8 bg-gray-700 border-gray-600 text-white text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {speedOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value.toString()}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* 时间显示 */}
                        <div className="flex items-center space-x-2 text-sm text-gray-300">
                            <Clock className="w-4 h-4" />
                            <span className="font-mono">
                                {formatTime(timelineState.currentTime)} / {formatTime(timelineState.totalDuration)}
                            </span>
                        </div>
                    </div>

                    {/* 右侧：过滤和缩放控制 */}
                    <div className="flex items-center space-x-2">
                        {/* 事件过滤 */}
                        <div className="flex items-center space-x-2">
                            <div className="relative">
                                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
                                <Input
                                    placeholder="搜索节点..."
                                    value={filterText}
                                    onChange={(e) => setFilterText(e.target.value)}
                                    className="w-32 h-8 pl-7 bg-gray-700 border-gray-600 text-white text-xs placeholder-gray-400"
                                />
                            </div>

                            <Select value={selectedEventType} onValueChange={setSelectedEventType}>
                                <SelectTrigger className="w-24 h-8 bg-gray-700 border-gray-600 text-white text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">全部</SelectItem>
                                    <SelectItem value="start">开始</SelectItem>
                                    <SelectItem value="success">成功</SelectItem>
                                    <SelectItem value="failure">失败</SelectItem>
                                    <SelectItem value="running">运行中</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Separator orientation="vertical" className="h-6 bg-gray-600" />

                        {/* 缩放控制 */}
                        <div className="flex items-center space-x-1">
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleZoomOut}
                                className="w-8 h-8 p-0 text-gray-300 hover:text-white hover:bg-gray-700"
                            >
                                <ZoomOut className="w-4 h-4" />
                            </Button>

                            <span className="text-xs text-gray-400 w-12 text-center">
                                {Math.round(zoomLevel * 100)}%
                            </span>

                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleZoomIn}
                                className="w-8 h-8 p-0 text-gray-300 hover:text-white hover:bg-gray-700"
                            >
                                <ZoomIn className="w-4 h-4" />
                            </Button>

                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleZoomFit}
                                className="w-8 h-8 p-0 text-gray-300 hover:text-white hover:bg-gray-700"
                            >
                                <Maximize2 className="w-4 h-4" />
                            </Button>
                        </div>

                        {/* 统计信息 */}
                        <Badge variant="secondary" className="bg-gray-700 text-gray-300 text-xs">
                            {filteredEvents.length} 事件
                        </Badge>
                    </div>
                </div>
            </div>

            {/* 时间轴主体 */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* 时间刻度 */}
                <div className="h-8 bg-gray-750 border-b border-gray-700 relative overflow-hidden">
                    <div
                        className="h-full relative"
                        style={{ width: `${100 * zoomLevel}%` }}
                    >
                        {/* 时间刻度线 */}
                        {Array.from({ length: Math.ceil(timelineState.totalDuration / 1000) + 1 }, (_, i) => {
                            const time = i * 1000
                            const position = (time / timelineState.totalDuration) * 100

                            return (
                                <div
                                    key={i}
                                    className="absolute top-0 h-full flex flex-col justify-between"
                                    style={{ left: `${position}%` }}
                                >
                                    <div className="w-px h-2 bg-gray-500" />
                                    <div className="text-xs text-gray-400 transform -translate-x-1/2">
                                        {formatTime(time)}
                                    </div>
                                    <div className="w-px h-2 bg-gray-500" />
                                </div>
                            )
                        })}

                        {/* 当前时间指示器 */}
                        <div
                            className="absolute top-0 w-0.5 h-full bg-blue-500 z-10"
                            style={{ left: `${(timelineState.currentTime / timelineState.totalDuration) * 100}%` }}
                        />
                    </div>
                </div>

                {/* 事件轨道 */}
                <ScrollArea className="flex-1">
                    <div className="p-2">
                        <div
                            ref={timelineRef}
                            className="relative h-16 bg-gray-900 rounded-lg border border-gray-700 cursor-pointer"
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                            style={{ width: `${100 * zoomLevel}%`, minWidth: '100%' }}
                        >
                            {/* 事件标记 */}
                            {filteredEvents.map((event) => {
                                const position = (event.timestamp / timelineState.totalDuration) * 100

                                return (
                                    <div
                                        key={event.id}
                                        className={cn(
                                            "absolute top-2 w-2 h-12 rounded-sm cursor-pointer",
                                            "hover:scale-110 transition-transform",
                                            getEventColor(event.type)
                                        )}
                                        style={{ left: `${position}%` }}
                                        title={`${event.nodeName} - ${getEventTypeText(event.type)} (${formatTime(event.timestamp)})`}
                                    >
                                        {/* 持续时间条 */}
                                        {event.duration && (
                                            <div
                                                className={cn(
                                                    "absolute top-0 h-full opacity-30 rounded-sm",
                                                    getEventColor(event.type)
                                                )}
                                                style={{
                                                    width: `${(event.duration / timelineState.totalDuration) * 100 * zoomLevel}px`,
                                                    minWidth: '2px'
                                                }}
                                            />
                                        )}
                                    </div>
                                )
                            })}

                            {/* 当前时间线 */}
                            <div
                                className="absolute top-0 w-0.5 h-full bg-blue-500 z-20 pointer-events-none"
                                style={{ left: `${(timelineState.currentTime / timelineState.totalDuration) * 100}%` }}
                            />
                        </div>
                    </div>
                </ScrollArea>
            </div>
        </div>
    )
}

// 创建示例时间轴数据
export const createSampleTimelineState = (): TimelineState => {
    const events: TimelineEvent[] = [
        { id: '1', timestamp: 0, nodeId: 'root', nodeName: 'Root', type: 'start' },
        { id: '2', timestamp: 100, nodeId: 'sequence1', nodeName: 'Sequence', type: 'start', duration: 2000 },
        { id: '3', timestamp: 150, nodeId: 'condition1', nodeName: 'Check Health', type: 'start', duration: 50 },
        { id: '4', timestamp: 200, nodeId: 'condition1', nodeName: 'Check Health', type: 'success' },
        { id: '5', timestamp: 250, nodeId: 'action1', nodeName: 'Move To Target', type: 'start', duration: 1500 },
        { id: '6', timestamp: 1750, nodeId: 'action1', nodeName: 'Move To Target', type: 'success' },
        { id: '7', timestamp: 1800, nodeId: 'sequence1', nodeName: 'Sequence', type: 'success' },
        { id: '8', timestamp: 2000, nodeId: 'root', nodeName: 'Root', type: 'success' }
    ]

    return {
        currentTime: 1000,
        totalDuration: 5000,
        isPlaying: false,
        playbackSpeed: 1,
        events,
        filteredEvents: events
    }
}