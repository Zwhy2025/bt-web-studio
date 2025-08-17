import React, { useState } from 'react'
import { ResizableLayout } from './resizable-layout'
import { TopToolbar } from './top-toolbar'
import { NodeLibraryPanel } from './node-library-panel'
import { PropertiesPanel, createSampleNodeInfo } from './properties-panel'
import { TimelinePanel, createSampleTimelineState } from './timeline-panel'
import { ReactFlow, Background, Controls, MiniMap } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { cn } from '@/lib/utils'

export function BehaviorTreeEditor() {
    // 状态管理
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [isConnected, setIsConnected] = useState(false)
    const [executionState, setExecutionState] = useState<'idle' | 'running' | 'paused' | 'error'>('idle')
    const [timelineState, setTimelineState] = useState(createSampleTimelineState())

    // 示例节点数据
    const selectedNode = selectedNodeId ? createSampleNodeInfo(selectedNodeId) : null

    // 工具栏事件处理
    const handleNew = () => {
        console.log('新建行为树')
    }

    const handleOpen = () => {
        console.log('打开行为树')
    }

    const handleSave = () => {
        console.log('保存行为树')
    }

    const handleImport = () => {
        console.log('导入行为树')
    }

    const handleExport = () => {
        console.log('导出行为树')
    }

    const handlePlay = () => {
        setIsPlaying(true)
        setExecutionState('running')
        setTimelineState(prev => ({ ...prev, isPlaying: true }))
        console.log('开始执行')
    }

    const handlePause = () => {
        setIsPlaying(false)
        setExecutionState('paused')
        setTimelineState(prev => ({ ...prev, isPlaying: false }))
        console.log('暂停执行')
    }

    const handleStop = () => {
        setIsPlaying(false)
        setExecutionState('idle')
        setTimelineState(prev => ({ ...prev, isPlaying: false, currentTime: 0 }))
        console.log('停止执行')
    }

    const handleStep = () => {
        console.log('单步执行')
    }

    const handleReset = () => {
        setIsPlaying(false)
        setExecutionState('idle')
        setTimelineState(prev => ({ ...prev, isPlaying: false, currentTime: 0 }))
        console.log('重置执行')
    }

    // 视图控制
    const handleZoomIn = () => {
        console.log('放大视图')
    }

    const handleZoomOut = () => {
        console.log('缩小视图')
    }

    const handleFitView = () => {
        console.log('适应视图')
    }

    const handleToggleGrid = () => {
        console.log('切换网格')
    }

    // 节点拖拽处理
    const handleNodeDragStart = (nodeType: any, event: React.DragEvent) => {
        console.log('开始拖拽节点:', nodeType.name)
    }

    // 属性面板事件处理
    const handlePropertyChange = (nodeId: string, propertyKey: string, value: any) => {
        console.log('属性变更:', nodeId, propertyKey, value)
    }

    const handleAddBreakpoint = (nodeId: string) => {
        console.log('添加断点:', nodeId)
    }

    const handleRemoveBreakpoint = (nodeId: string) => {
        console.log('移除断点:', nodeId)
    }

    // 时间轴事件处理
    const handleTimelinePlay = () => {
        setTimelineState(prev => ({ ...prev, isPlaying: true }))
        console.log('时间轴播放')
    }

    const handleTimelinePause = () => {
        setTimelineState(prev => ({ ...prev, isPlaying: false }))
        console.log('时间轴暂停')
    }

    const handleTimelineStop = () => {
        setTimelineState(prev => ({ ...prev, isPlaying: false, currentTime: 0 }))
        console.log('时间轴停止')
    }

    const handleTimelineSeek = (time: number) => {
        setTimelineState(prev => ({ ...prev, currentTime: time }))
        console.log('时间轴跳转:', time)
    }

    const handleSpeedChange = (speed: number) => {
        setTimelineState(prev => ({ ...prev, playbackSpeed: speed }))
        console.log('播放速度变更:', speed)
    }

    // ReactFlow 节点点击处理
    const handleNodeClick = (event: React.MouseEvent, node: any) => {
        setSelectedNodeId(node.id)
        console.log('选中节点:', node.id)
    }

    // 示例节点和边
    const initialNodes = [
        {
            id: '1',
            type: 'default',
            position: { x: 250, y: 100 },
            data: { label: 'Root' },
            style: {
                background: '#1f2937',
                color: '#ffffff',
                border: '2px solid #3b82f6',
                borderRadius: '8px'
            }
        },
        {
            id: '2',
            type: 'default',
            position: { x: 150, y: 200 },
            data: { label: 'Sequence' },
            style: {
                background: '#1f2937',
                color: '#ffffff',
                border: '2px solid #3b82f6',
                borderRadius: '8px'
            }
        },
        {
            id: '3',
            type: 'default',
            position: { x: 350, y: 200 },
            data: { label: 'Selector' },
            style: {
                background: '#1f2937',
                color: '#ffffff',
                border: '2px solid #3b82f6',
                borderRadius: '8px'
            }
        }
    ]

    const initialEdges = [
        { id: 'e1-2', source: '1', target: '2', style: { stroke: '#3b82f6' } },
        { id: 'e1-3', source: '1', target: '3', style: { stroke: '#3b82f6' } }
    ]

    return (
        <ResizableLayout
            topToolbar={
                <TopToolbar
                    onNew={handleNew}
                    onOpen={handleOpen}
                    onSave={handleSave}
                    onImport={handleImport}
                    onExport={handleExport}
                    onPlay={handlePlay}
                    onPause={handlePause}
                    onStop={handleStop}
                    onStep={handleStep}
                    onReset={handleReset}
                    onZoomIn={handleZoomIn}
                    onZoomOut={handleZoomOut}
                    onFitView={handleFitView}
                    onToggleGrid={handleToggleGrid}
                    isPlaying={isPlaying}
                    isConnected={isConnected}
                    executionState={executionState}
                />
            }
            leftPanel={
                <NodeLibraryPanel
                    onNodeDragStart={handleNodeDragStart}
                />
            }
            centerPanel={
                <div className="h-full bg-gray-900 relative">
                    <ReactFlow
                        defaultNodes={initialNodes}
                        defaultEdges={initialEdges}
                        onNodeClick={handleNodeClick}
                        className="bg-gray-900"
                        fitView
                    >
                        <Background
                            color="#374151"
                            gap={20}
                            size={1}
                            className="bg-gray-900"
                        />
                        <Controls
                            className="bg-gray-800 border-gray-600"
                            showInteractive={false}
                        />
                        <MiniMap
                            className="bg-gray-800 border border-gray-600"
                            maskColor="rgba(0, 0, 0, 0.2)"
                            nodeColor="#3b82f6"
                        />
                    </ReactFlow>
                </div>
            }
            rightPanel={
                <PropertiesPanel
                    selectedNode={selectedNode}
                    onPropertyChange={handlePropertyChange}
                    onAddBreakpoint={handleAddBreakpoint}
                    onRemoveBreakpoint={handleRemoveBreakpoint}
                    hasBreakpoint={false}
                />
            }
            bottomPanel={
                <TimelinePanel
                    timelineState={timelineState}
                    onPlay={handleTimelinePlay}
                    onPause={handleTimelinePause}
                    onStop={handleTimelineStop}
                    onSeek={handleTimelineSeek}
                    onSpeedChange={handleSpeedChange}
                />
            }
        />
    )
}