import React from "react"
import { useBehaviorTreeStore } from "@/core/store/behavior-tree-store"
import { TimelinePanel, createSampleTimelineState } from "@/components/layout/timeline-panel"
import { useI18n } from "@/hooks/use-i18n"

export function BottomTimeline() {
    const { t } = useI18n()
    const {
        timelinePosition,
        totalDuration,
        isReplaying,
        playbackSpeed,
        executionEvents,
        actions
    } = useBehaviorTreeStore()

    // 如果没有执行事件，创建一些示例数据用于显示
    const hasEvents = executionEvents.length > 0
    const sampleTimelineState = createSampleTimelineState()

    // 构建 TimelinePanel 需要的 timelineState 对象
    const timelineState = hasEvents ? {
        currentTime: timelinePosition,
        totalDuration: totalDuration || 10000,
        isPlaying: isReplaying,
        playbackSpeed: playbackSpeed,
        events: executionEvents.map(event => ({
            id: event.id,
            timestamp: event.timestamp,
            nodeId: event.nodeId,
            nodeName: event.nodeId, // 使用 nodeId 作为 nodeName
            type: event.type === 'tick' ? (
                event.status === 'success' ? 'success' as const :
                    event.status === 'failure' ? 'failure' as const :
                        event.status === 'running' ? 'running' as const :
                            'start' as const
            ) : 'start' as const,
            duration: event.duration,
            data: event
        })),
        filteredEvents: executionEvents.map(event => ({
            id: event.id,
            timestamp: event.timestamp,
            nodeId: event.nodeId,
            nodeName: event.nodeId,
            type: event.type === 'tick' ? (
                event.status === 'success' ? 'success' as const :
                    event.status === 'failure' ? 'failure' as const :
                        event.status === 'running' ? 'running' as const :
                            'start' as const
            ) : 'start' as const,
            duration: event.duration,
            data: event
        }))
    } : sampleTimelineState

    return (
        <div className="h-full min-h-[200px] bg-gray-800">
            <div className="p-2 border-b border-gray-700">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-300">{t('panels:timeline')}</h3>
                    {!hasEvents && (
                        <span className="text-xs text-gray-500">
                            ({t('messages:loadingData')})
                        </span>
                    )}
                </div>
            </div>
            <div className="h-[calc(100%-3rem)]">
                <TimelinePanel
                    timelineState={timelineState}
                    onPlay={hasEvents ? actions.startReplay : () => console.log(t('toolbar:play'))}
                    onPause={hasEvents ? actions.pauseReplay : () => console.log(t('toolbar:pause'))}
                    onStop={hasEvents ? actions.stopReplay : () => console.log(t('toolbar:stop'))}
                    onSeek={hasEvents ? actions.seekToTime : (time) => console.log(t('panels:currentStep'), time)}
                    onSpeedChange={hasEvents ? actions.setPlaybackSpeed : (speed) => console.log(t('panels:playbackSpeed'), speed)}
                    className="h-full"
                />
            </div>
        </div>
    )
}