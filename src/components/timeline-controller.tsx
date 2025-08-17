import React from 'react'
import { InteractiveTimeline, TimelineState, TimelineEvent } from '@/components/interactive-timeline'
import { useBehaviorTreeStore } from '@/store/behavior-tree-store'
import { NodeStatus } from '@/store/behavior-tree-store'

// 将执行事件转换为时间轴事件格式
const convertExecutionEventsToTimelineEvents = (executionEvents: any[]): TimelineEvent[] => {
    return executionEvents.map(event => ({
        id: event.id,
        timestamp: event.timestamp,
        nodeId: event.nodeId,
        nodeName: event.nodeId, // 可以从节点数据中获取更友好的名称
        type: (event.status === NodeStatus.SUCCESS ? 'success' :
            event.status === NodeStatus.FAILURE ? 'failure' :
                event.status === NodeStatus.RUNNING ? 'running' : 'start') as 'start' | 'success' | 'failure' | 'running',
        duration: event.duration,
        data: event.blackboardSnapshot
    }))
}

export function TimelineController() {
    const {
        timelinePosition,
        totalDuration,
        isReplaying,
        playbackSpeed,
        executionEvents,
        actions
    } = useBehaviorTreeStore()

    // 构建时间轴状态
    const timelineState: TimelineState = {
        currentTime: timelinePosition,
        totalDuration: totalDuration || (executionEvents.length > 0
            ? Math.max(...executionEvents.map(e => e.timestamp))
            : 10000),
        isPlaying: isReplaying,
        playbackSpeed,
        events: convertExecutionEventsToTimelineEvents(executionEvents),
        filteredEvents: convertExecutionEventsToTimelineEvents(executionEvents)
    }

    // 回放控制处理函数
    const handlePlay = () => {
        actions.startReplay()
    }

    const handlePause = () => {
        actions.pauseReplay()
    }

    const handleStop = () => {
        actions.stopReplay()
        actions.seekToStart()
    }

    const handleSeek = (time: number) => {
        actions.seekToTime(time)
    }

    const handleSpeedChange = (speed: number) => {
        actions.setPlaybackSpeed(speed)
    }

    const handleFilterChange = (filter: string) => {
        // 可以在这里实现事件过滤逻辑
        console.log('Filter changed:', filter)
    }

    return (
        <InteractiveTimeline
            timelineState={timelineState}
            onPlay={handlePlay}
            onPause={handlePause}
            onStop={handleStop}
            onSeek={handleSeek}
            onSpeedChange={handleSpeedChange}
            onFilterChange={handleFilterChange}
            className="h-full"
        />
    )
}

// 扩展时间轴面板的快捷键支持
export function TimelineKeyboardShortcuts() {
    const { actions } = useBehaviorTreeStore()

    React.useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // 只在没有输入框聚焦时处理快捷键
            if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
                return
            }

            switch (event.key) {
                case ' ': // 空格键：播放/暂停
                    event.preventDefault()
                    actions.toggleReplay()
                    break
                case 'ArrowLeft': // 左箭头：后退1秒
                    event.preventDefault()
                    if (event.shiftKey) {
                        actions.skipBackward(5) // Shift+左箭头：后退5秒
                    } else {
                        actions.skipBackward(1)
                    }
                    break
                case 'ArrowRight': // 右箭头：前进1秒
                    event.preventDefault()
                    if (event.shiftKey) {
                        actions.skipForward(5) // Shift+右箭头：前进5秒
                    } else {
                        actions.skipForward(1)
                    }
                    break
                case 'Home': // Home键：跳转到开始
                    event.preventDefault()
                    actions.seekToStart()
                    break
                case 'End': // End键：跳转到结束
                    event.preventDefault()
                    actions.seekToEnd()
                    break
                case 'Escape': // Esc键：停止回放
                    event.preventDefault()
                    actions.stopReplay()
                    break
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [actions])

    return null // 这个组件不渲染任何内容，只处理键盘事件
}

// 回放状态指示器组件
export function ReplayStatusIndicator() {
    const { isReplaying, playbackSpeed, timelinePosition, totalDuration } = useBehaviorTreeStore()

    if (!isReplaying) return null

    const progress = totalDuration > 0 ? (timelinePosition / totalDuration) * 100 : 0

    return (
        <div className="fixed top-4 right-4 bg-blue-600 text-white px-3 py-2 rounded-lg shadow-lg z-50">
            <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span className="text-sm font-medium">
                    回放中 {playbackSpeed}x
                </span>
                <div className="w-16 h-1 bg-blue-800 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-white transition-all duration-100"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>
        </div>
    )
}