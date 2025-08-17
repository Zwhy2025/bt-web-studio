import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
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
    Settings,
    Move,
    MousePointer2
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

interface InteractiveTimelineProps {
    timelineState: TimelineState
    onPlay?: () => void
    onPause?: () => void
    onStop?: () => void
    onSeek?: (time: number) => void
    onSpeedChange?: (speed: number) => void
    onFilterChange?: (filter: string) => void
    className?: string
}

export function InteractiveTimeline({
    timelineState,
    onPlay,
    onPause,
    onStop,
    onSeek,
    onSpeedChange,
    onFilterChange,
    className
}: InteractiveTimelineProps) {
    // 缩放和平移状态
    const [zoomLevel, setZoomLevel] = useState(1)
    const [panOffset, setPanOffset] = useState(0)
    const [viewportStart, setViewportStart] = useState(0)
    const [viewportEnd, setViewportEnd] = useState(1)

    // 交互状态
    const [isDragging, setIsDragging] = useState(false)
    const [isPanning, setIsPanning] = useState(false)
    const [dragStartX, setDragStartX] = useState(0)
    const [dragStartOffset, setDragStartOffset] = useState(0)
    const [isResizing, setIsResizing] = useState(false)

    // 过滤状态
    const [filterText, setFilterText] = useState('')
    const [selectedEventType, setSelectedEventType] = useState<string>('all')

    // 引用
    const timelineRef = useRef<HTMLDivElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const rulerRef = useRef<HTMLDivElement>(null)

    // 播放速度选项
    const speedOptions = [
        { label: '0.1x', value: 0.1 },
        { label: '0.25x', value: 0.25 },
        { label: '0.5x', value: 0.5 },
        { label: '1x', value: 1 },
        { label: '2x', value: 2 },
        { label: '4x', value: 4 },
        { label: '8x', value: 8 },
        { label: '16x', value: 16 }
    ]

    // 格式化时间显示
    const formatTime = useCallback((milliseconds: number) => {
        const seconds = Math.floor(milliseconds / 1000)
        const minutes = Math.floor(seconds / 60)
        const hours = Math.floor(minutes / 60)
        const remainingMs = milliseconds % 1000
        const remainingSeconds = seconds % 60
        const remainingMinutes = minutes % 60

        if (hours > 0) {
            return `${hours}:${remainingMinutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}.${Math.floor(remainingMs / 100)}`
        } else if (minutes > 0) {
            return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}.${Math.floor(remainingMs / 100)}`
        }
        return `${remainingSeconds}.${Math.floor(remainingMs / 100)}s`
    }, [])

    // 获取事件颜色
    const getEventColor = useCallback((type: string) => {
        switch (type) {
            case 'start':
                return 'bg-blue-500 border-blue-400'
            case 'success':
                return 'bg-green-500 border-green-400'
            case 'failure':
                return 'bg-red-500 border-red-400'
            case 'running':
                return 'bg-yellow-500 border-yellow-400'
            default:
                return 'bg-gray-500 border-gray-400'
        }
    }, [])

    // 获取事件类型文本
    const getEventTypeText = useCallback((type: string) => {
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
    }, [])

    // 过滤事件
    const filteredEvents = useMemo(() => {
        return timelineState.events.filter(event => {
            const matchesText = !filterText ||
                event.nodeName.toLowerCase().includes(filterText.toLowerCase()) ||
                event.id.toLowerCase().includes(filterText.toLowerCase())

            const matchesType = selectedEventType === 'all' || event.type === selectedEventType

            return matchesText && matchesType
        })
    }, [timelineState.events, filterText, selectedEventType])

    // 计算可见时间范围
    const visibleTimeRange = useMemo(() => {
        const totalDuration = timelineState.totalDuration
        const start = viewportStart * totalDuration
        const end = viewportEnd * totalDuration
        return { start, end, duration: end - start }
    }, [viewportStart, viewportEnd, timelineState.totalDuration])

    // 时间轴点击处理
    const handleTimelineClick = useCallback((event: React.MouseEvent) => {
        if (!timelineRef.current || isPanning) return

        const rect = timelineRef.current.getBoundingClientRect()
        const clickX = event.clientX - rect.left
        const timelineWidth = rect.width
        const clickRatio = Math.max(0, Math.min(1, clickX / timelineWidth))

        // 根据当前视口计算实际时间
        const targetTime = visibleTimeRange.start + (clickRatio * visibleTimeRange.duration)

        onSeek?.(targetTime)
    }, [visibleTimeRange, onSeek, isPanning])

    // 拖拽处理
    const handleMouseDown = useCallback((event: React.MouseEvent) => {
        if (event.button === 0) { // 左键：拖拽时间指针
            setIsDragging(true)
            handleTimelineClick(event)
        } else if (event.button === 1 || (event.button === 0 && event.shiftKey)) { // 中键或Shift+左键：平移
            setIsPanning(true)
            setDragStartX(event.clientX)
            setDragStartOffset(panOffset)
            event.preventDefault()
        }
    }, [handleTimelineClick, panOffset])

    const handleMouseMove = useCallback((event: React.MouseEvent) => {
        if (isDragging && !isPanning) {
            handleTimelineClick(event)
        } else if (isPanning && timelineRef.current) {
            const deltaX = event.clientX - dragStartX
            const rect = timelineRef.current.getBoundingClientRect()
            const panDelta = (deltaX / rect.width) * (viewportEnd - viewportStart)

            const newStart = Math.max(0, viewportStart - panDelta)
            const newEnd = Math.min(1, viewportEnd - panDelta)

            if (newStart >= 0 && newEnd <= 1) {
                setViewportStart(newStart)
                setViewportEnd(newEnd)
            }
        }
    }, [isDragging, isPanning, handleTimelineClick, dragStartX, viewportStart, viewportEnd])

    const handleMouseUp = useCallback(() => {
        setIsDragging(false)
        setIsPanning(false)
    }, [])

    // 滚轮缩放处理
    const handleWheel = useCallback((event: React.WheelEvent) => {
        if (!timelineRef.current) return

        event.preventDefault()

        const rect = timelineRef.current.getBoundingClientRect()
        const mouseX = event.clientX - rect.left
        const mouseRatio = mouseX / rect.width

        // 计算鼠标位置对应的时间点
        const mouseTime = visibleTimeRange.start + (mouseRatio * visibleTimeRange.duration)
        const mouseTimeRatio = mouseTime / timelineState.totalDuration

        // 缩放因子
        const zoomFactor = event.deltaY > 0 ? 1.2 : 0.8
        const currentViewportWidth = viewportEnd - viewportStart
        const newViewportWidth = Math.max(0.01, Math.min(1, currentViewportWidth * zoomFactor))

        // 以鼠标位置为中心进行缩放
        const newStart = Math.max(0, mouseTimeRatio - (mouseRatio * newViewportWidth))
        const newEnd = Math.min(1, newStart + newViewportWidth)

        setViewportStart(newStart)
        setViewportEnd(newEnd)
        setZoomLevel(1 / newViewportWidth)
    }, [visibleTimeRange, viewportStart, viewportEnd, timelineState.totalDuration])

    // 缩放控制
    const handleZoomIn = useCallback(() => {
        const currentWidth = viewportEnd - viewportStart
        const newWidth = Math.max(0.01, currentWidth * 0.7)
        const center = (viewportStart + viewportEnd) / 2
        const newStart = Math.max(0, center - newWidth / 2)
        const newEnd = Math.min(1, newStart + newWidth)

        setViewportStart(newStart)
        setViewportEnd(newEnd)
        setZoomLevel(1 / newWidth)
    }, [viewportStart, viewportEnd])

    const handleZoomOut = useCallback(() => {
        const currentWidth = viewportEnd - viewportStart
        const newWidth = Math.min(1, currentWidth * 1.4)
        const center = (viewportStart + viewportEnd) / 2
        const newStart = Math.max(0, center - newWidth / 2)
        const newEnd = Math.min(1, newStart + newWidth)

        setViewportStart(newStart)
        setViewportEnd(newEnd)
        setZoomLevel(1 / newWidth)
    }, [viewportStart, viewportEnd])

    const handleZoomFit = useCallback(() => {
        setViewportStart(0)
        setViewportEnd(1)
        setZoomLevel(1)
        setPanOffset(0)
    }, [])

    // 键盘快捷键
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.target instanceof HTMLInputElement) return

            switch (event.key) {
                case '+':
                case '=':
                    event.preventDefault()
                    handleZoomIn()
                    break
                case '-':
                    event.preventDefault()
                    handleZoomOut()
                    break
                case '0':
                    event.preventDefault()
                    handleZoomFit()
                    break
                case 'ArrowLeft':
                    if (event.shiftKey) {
                        event.preventDefault()
                        const panAmount = (viewportEnd - viewportStart) * 0.1
                        const newStart = Math.max(0, viewportStart - panAmount)
                        const newEnd = newStart + (viewportEnd - viewportStart)
                        setViewportStart(newStart)
                        setViewportEnd(newEnd)
                    }
                    break
                case 'ArrowRight':
                    if (event.shiftKey) {
                        event.preventDefault()
                        const panAmount = (viewportEnd - viewportStart) * 0.1
                        const newEnd = Math.min(1, viewportEnd + panAmount)
                        const newStart = newEnd - (viewportEnd - viewportStart)
                        setViewportStart(newStart)
                        setViewportEnd(newEnd)
                    }
                    break
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [handleZoomIn, handleZoomOut, handleZoomFit, viewportStart, viewportEnd])

    return (
        <div className={cn("h-full flex flex-col bg-gray-900", className)}>
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
                                title="跳转到开始"
                            >
                                <SkipBack className="w-4 h-4" />
                            </Button>

                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onSeek?.(Math.max(0, timelineState.currentTime - 1000))}
                                className="w-8 h-8 p-0 text-gray-300 hover:text-white hover:bg-gray-600"
                                title="后退1秒"
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
                                title={timelineState.isPlaying ? "暂停" : "播放"}
                            >
                                {timelineState.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                            </Button>

                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={onStop}
                                className="w-8 h-8 p-0 bg-red-600 hover:bg-red-700 text-white"
                                title="停止"
                            >
                                <Square className="w-4 h-4" />
                            </Button>

                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onSeek?.(Math.min(timelineState.totalDuration, timelineState.currentTime + 1000))}
                                className="w-8 h-8 p-0 text-gray-300 hover:text-white hover:bg-gray-600"
                                title="前进1秒"
                            >
                                <FastForward className="w-4 h-4" />
                            </Button>

                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onSeek?.(timelineState.totalDuration)}
                                className="w-8 h-8 p-0 text-gray-300 hover:text-white hover:bg-gray-600"
                                title="跳转到结束"
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
                                title="缩小 (-)"
                            >
                                <ZoomOut className="w-4 h-4" />
                            </Button>

                            <span className="text-xs text-gray-400 w-12 text-center" title="缩放级别">
                                {Math.round(zoomLevel * 100)}%
                            </span>

                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleZoomIn}
                                className="w-8 h-8 p-0 text-gray-300 hover:text-white hover:bg-gray-700"
                                title="放大 (+)"
                            >
                                <ZoomIn className="w-4 h-4" />
                            </Button>

                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleZoomFit}
                                className="w-8 h-8 p-0 text-gray-300 hover:text-white hover:bg-gray-700"
                                title="适应窗口 (0)"
                            >
                                <Maximize2 className="w-4 h-4" />
                            </Button>
                        </div>

                        {/* 交互提示 */}
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                            <MousePointer2 className="w-3 h-3" />
                            <span>左键拖拽</span>
                            <Move className="w-3 h-3 ml-2" />
                            <span>Shift+左键平移</span>
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
                {/* 时间刻度尺 */}
                <div
                    ref={rulerRef}
                    className="h-8 bg-gray-800 border-b border-gray-700 relative overflow-hidden select-none"
                >
                    <div className="h-full relative">
                        {/* 时间刻度线 */}
                        {(() => {
                            const { start, end, duration } = visibleTimeRange
                            const tickInterval = Math.max(100, Math.pow(10, Math.floor(Math.log10(duration / 10))))
                            const startTick = Math.floor(start / tickInterval) * tickInterval
                            const ticks = []

                            for (let time = startTick; time <= end + tickInterval; time += tickInterval) {
                                if (time < start) continue

                                const position = ((time - start) / duration) * 100
                                if (position >= 0 && position <= 100) {
                                    ticks.push(
                                        <div
                                            key={time}
                                            className="absolute top-0 h-full flex flex-col justify-between text-gray-400"
                                            style={{ left: `${position}%` }}
                                        >
                                            <div className="w-px h-3 bg-gray-500" />
                                            <div className="text-xs transform -translate-x-1/2 bg-gray-800 px-1">
                                                {formatTime(time)}
                                            </div>
                                            <div className="w-px h-3 bg-gray-500" />
                                        </div>
                                    )
                                }
                            }
                            return ticks
                        })()}

                        {/* 当前时间指示器 */}
                        {timelineState.currentTime >= visibleTimeRange.start && timelineState.currentTime <= visibleTimeRange.end && (
                            <div
                                className="absolute top-0 w-0.5 h-full bg-blue-500 z-10"
                                style={{
                                    left: `${((timelineState.currentTime - visibleTimeRange.start) / visibleTimeRange.duration) * 100}%`
                                }}
                            />
                        )}
                    </div>
                </div>

                {/* 事件轨道 */}
                <div className="flex-1 relative overflow-hidden">
                    <div
                        ref={timelineRef}
                        className="absolute inset-0 bg-gray-900 cursor-crosshair select-none"
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onWheel={handleWheel}
                        style={{
                            cursor: isPanning ? 'grabbing' : isDragging ? 'col-resize' : 'crosshair'
                        }}
                    >
                        {/* 网格线 */}
                        <div className="absolute inset-0 opacity-10">
                            {Array.from({ length: 21 }, (_, i) => (
                                <div
                                    key={i}
                                    className="absolute top-0 bottom-0 w-px bg-gray-600"
                                    style={{ left: `${i * 5}%` }}
                                />
                            ))}
                        </div>

                        {/* 事件标记 */}
                        {filteredEvents.map((event) => {
                            if (event.timestamp < visibleTimeRange.start || event.timestamp > visibleTimeRange.end) {
                                return null
                            }

                            const position = ((event.timestamp - visibleTimeRange.start) / visibleTimeRange.duration) * 100

                            return (
                                <div
                                    key={event.id}
                                    className={cn(
                                        "absolute top-4 w-3 h-16 rounded-sm cursor-pointer border-2",
                                        "hover:scale-110 hover:z-20 transition-all duration-200",
                                        "shadow-lg",
                                        getEventColor(event.type)
                                    )}
                                    style={{ left: `${position}%` }}
                                    title={`${event.nodeName} - ${getEventTypeText(event.type)} (${formatTime(event.timestamp)})`}
                                >
                                    {/* 持续时间条 */}
                                    {event.duration && (
                                        <div
                                            className={cn(
                                                "absolute top-0 h-full opacity-40 rounded-sm border-r-2",
                                                getEventColor(event.type)
                                            )}
                                            style={{
                                                width: `${Math.max(2, (event.duration / visibleTimeRange.duration) * 100)}%`,
                                                left: '100%'
                                            }}
                                        />
                                    )}

                                    {/* 事件标签 */}
                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 text-xs text-gray-300 bg-gray-800 px-1 py-0.5 rounded whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity z-30">
                                        {event.nodeName}
                                    </div>
                                </div>
                            )
                        })}

                        {/* 当前时间线 */}
                        {timelineState.currentTime >= visibleTimeRange.start && timelineState.currentTime <= visibleTimeRange.end && (
                            <div
                                className="absolute top-0 bottom-0 w-0.5 bg-blue-500 z-30 pointer-events-none shadow-lg"
                                style={{
                                    left: `${((timelineState.currentTime - visibleTimeRange.start) / visibleTimeRange.duration) * 100}%`
                                }}
                            >
                                {/* 时间指示器头部 */}
                                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-blue-500 rotate-45" />

                                {/* 当前时间标签 */}
                                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                                    {formatTime(timelineState.currentTime)}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 概览导航条 */}
                <div className="h-6 bg-gray-800 border-t border-gray-700 relative">
                    <div className="h-full bg-gray-700 relative">
                        {/* 全局事件概览 */}
                        {timelineState.events.map((event) => {
                            const position = (event.timestamp / timelineState.totalDuration) * 100
                            return (
                                <div
                                    key={`overview-${event.id}`}
                                    className={cn(
                                        "absolute top-1 w-1 h-4 rounded-sm opacity-60",
                                        getEventColor(event.type).split(' ')[0]
                                    )}
                                    style={{ left: `${position}%` }}
                                />
                            )
                        })}

                        {/* 视口指示器 */}
                        <div
                            className="absolute top-0 bottom-0 bg-blue-500 opacity-30 border-x-2 border-blue-400"
                            style={{
                                left: `${viewportStart * 100}%`,
                                width: `${(viewportEnd - viewportStart) * 100}%`
                            }}
                        />

                        {/* 当前时间指示器 */}
                        <div
                            className="absolute top-0 bottom-0 w-0.5 bg-blue-500 z-10"
                            style={{ left: `${(timelineState.currentTime / timelineState.totalDuration) * 100}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}