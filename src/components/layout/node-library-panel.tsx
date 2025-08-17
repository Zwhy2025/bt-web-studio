import React, { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Badge } from '@/components/ui/badge'
import {
    Search,
    ChevronDown,
    ChevronRight,
    GitBranch,
    Diamond,
    Square,
    Circle,
    Play,
    Pause,
    RotateCcw,
    CheckCircle,
    XCircle,
    Timer,
    Zap,
    Eye,
    Settings,
    ArrowRight,
    ArrowLeft,
    ArrowUp,
    ArrowDown
} from 'lucide-react'
import { cn } from '@/core/utils/utils'

// 节点类型定义
export interface NodeType {
    id: string
    name: string
    description: string
    icon: React.ComponentType<{ className?: string }>
    category: string
    color: string
    borderColor: string
    bgColor: string
}

// 节点分类定义
export interface NodeCategory {
    id: string
    name: string
    description: string
    icon: React.ComponentType<{ className?: string }>
    color: string
    nodes: NodeType[]
}

// 预定义的节点库
const NODE_LIBRARY: NodeCategory[] = [
    {
        id: 'control',
        name: '控制节点',
        description: '控制行为树执行流程的节点',
        icon: GitBranch,
        color: 'text-blue-400',
        nodes: [
            {
                id: 'sequence',
                name: 'Sequence',
                description: '顺序执行所有子节点，直到有一个失败',
                icon: ArrowRight,
                category: 'control',
                color: 'text-blue-400',
                borderColor: 'border-blue-500',
                bgColor: 'bg-blue-500/10'
            },
            {
                id: 'selector',
                name: 'Selector',
                description: '依次执行子节点，直到有一个成功',
                icon: Diamond,
                category: 'control',
                color: 'text-blue-400',
                borderColor: 'border-blue-500',
                bgColor: 'bg-blue-500/10'
            },
            {
                id: 'parallel',
                name: 'Parallel',
                description: '并行执行所有子节点',
                icon: GitBranch,
                category: 'control',
                color: 'text-blue-400',
                borderColor: 'border-blue-500',
                bgColor: 'bg-blue-500/10'
            },
            {
                id: 'fallback',
                name: 'Fallback',
                description: '备选方案节点，当主要方案失败时执行',
                icon: ArrowLeft,
                category: 'control',
                color: 'text-blue-400',
                borderColor: 'border-blue-500',
                bgColor: 'bg-blue-500/10'
            }
        ]
    },
    {
        id: 'decorator',
        name: '装饰节点',
        description: '修改子节点行为的装饰器节点',
        icon: Settings,
        color: 'text-purple-400',
        nodes: [
            {
                id: 'inverter',
                name: 'Inverter',
                description: '反转子节点的返回结果',
                icon: RotateCcw,
                category: 'decorator',
                color: 'text-purple-400',
                borderColor: 'border-purple-500',
                bgColor: 'bg-purple-500/10'
            },
            {
                id: 'repeater',
                name: 'Repeater',
                description: '重复执行子节点指定次数',
                icon: RotateCcw,
                category: 'decorator',
                color: 'text-purple-400',
                borderColor: 'border-purple-500',
                bgColor: 'bg-purple-500/10'
            },
            {
                id: 'retry',
                name: 'Retry',
                description: '失败时重试执行子节点',
                icon: RotateCcw,
                category: 'decorator',
                color: 'text-purple-400',
                borderColor: 'border-purple-500',
                bgColor: 'bg-purple-500/10'
            },
            {
                id: 'timeout',
                name: 'Timeout',
                description: '为子节点设置超时限制',
                icon: Timer,
                category: 'decorator',
                color: 'text-purple-400',
                borderColor: 'border-purple-500',
                bgColor: 'bg-purple-500/10'
            }
        ]
    },
    {
        id: 'condition',
        name: '条件节点',
        description: '检查条件状态的叶子节点',
        icon: Eye,
        color: 'text-yellow-400',
        nodes: [
            {
                id: 'check_condition',
                name: 'Check Condition',
                description: '检查指定条件是否满足',
                icon: Eye,
                category: 'condition',
                color: 'text-yellow-400',
                borderColor: 'border-yellow-500',
                bgColor: 'bg-yellow-500/10'
            },
            {
                id: 'is_valid',
                name: 'Is Valid',
                description: '检查变量是否有效',
                icon: CheckCircle,
                category: 'condition',
                color: 'text-yellow-400',
                borderColor: 'border-yellow-500',
                bgColor: 'bg-yellow-500/10'
            },
            {
                id: 'compare',
                name: 'Compare',
                description: '比较两个值的大小关系',
                icon: ArrowRight,
                category: 'condition',
                color: 'text-yellow-400',
                borderColor: 'border-yellow-500',
                bgColor: 'bg-yellow-500/10'
            }
        ]
    },
    {
        id: 'action',
        name: '动作节点',
        description: '执行具体动作的叶子节点',
        icon: Zap,
        color: 'text-green-400',
        nodes: [
            {
                id: 'move_to',
                name: 'Move To',
                description: '移动到指定位置',
                icon: ArrowUp,
                category: 'action',
                color: 'text-green-400',
                borderColor: 'border-green-500',
                bgColor: 'bg-green-500/10'
            },
            {
                id: 'play_animation',
                name: 'Play Animation',
                description: '播放指定动画',
                icon: Play,
                category: 'action',
                color: 'text-green-400',
                borderColor: 'border-green-500',
                bgColor: 'bg-green-500/10'
            },
            {
                id: 'wait',
                name: 'Wait',
                description: '等待指定时间',
                icon: Pause,
                category: 'action',
                color: 'text-green-400',
                borderColor: 'border-green-500',
                bgColor: 'bg-green-500/10'
            },
            {
                id: 'set_variable',
                name: 'Set Variable',
                description: '设置黑板变量值',
                icon: Settings,
                category: 'action',
                color: 'text-green-400',
                borderColor: 'border-green-500',
                bgColor: 'bg-green-500/10'
            }
        ]
    }
]

interface NodeLibraryPanelProps {
    onNodeDragStart?: (nodeType: NodeType, event: React.DragEvent) => void
    className?: string
}

export function NodeLibraryPanel({ onNodeDragStart, className }: NodeLibraryPanelProps) {
    const [searchTerm, setSearchTerm] = useState('')
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
        new Set(['control', 'decorator', 'condition', 'action'])
    )

    // 过滤节点
    const filteredCategories = useMemo(() => {
        if (!searchTerm.trim()) {
            return NODE_LIBRARY
        }

        const term = searchTerm.toLowerCase()
        return NODE_LIBRARY.map(category => ({
            ...category,
            nodes: category.nodes.filter(node =>
                node.name.toLowerCase().includes(term) ||
                node.description.toLowerCase().includes(term)
            )
        })).filter(category => category.nodes.length > 0)
    }, [searchTerm])

    const toggleCategory = (categoryId: string) => {
        const newExpanded = new Set(expandedCategories)
        if (newExpanded.has(categoryId)) {
            newExpanded.delete(categoryId)
        } else {
            newExpanded.add(categoryId)
        }
        setExpandedCategories(newExpanded)
    }

    const handleNodeDragStart = (nodeType: NodeType, event: React.DragEvent) => {
        // 设置拖拽数据
        event.dataTransfer.setData('application/json', JSON.stringify(nodeType))
        event.dataTransfer.effectAllowed = 'copy'

        // 创建拖拽预览
        const dragImage = document.createElement('div')
        dragImage.className = 'bg-gray-800 border border-gray-600 rounded-lg p-2 text-white text-sm'
        dragImage.textContent = nodeType.name
        dragImage.style.position = 'absolute'
        dragImage.style.top = '-1000px'
        document.body.appendChild(dragImage)
        event.dataTransfer.setDragImage(dragImage, 0, 0)

        // 清理拖拽预览
        setTimeout(() => {
            document.body.removeChild(dragImage)
        }, 0)

        onNodeDragStart?.(nodeType, event)
    }

    return (
        <div className={cn("h-full flex flex-col bg-gray-800", className)}>
            {/* 标题栏 */}
            <div className="p-4 border-b border-gray-700">
                <h2 className="text-lg font-semibold text-white mb-3">节点库</h2>

                {/* 搜索框 */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        placeholder="搜索节点..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                    />
                </div>
            </div>

            {/* 节点列表 */}
            <ScrollArea className="flex-1">
                <div className="p-2">
                    {filteredCategories.map((category) => (
                        <Collapsible
                            key={category.id}
                            open={expandedCategories.has(category.id)}
                            onOpenChange={() => toggleCategory(category.id)}
                        >
                            <CollapsibleTrigger className="w-full">
                                <div className="flex items-center justify-between p-3 hover:bg-gray-700 rounded-lg transition-colors group">
                                    <div className="flex items-center space-x-3">
                                        <category.icon className={cn("w-5 h-5", category.color)} />
                                        <div className="text-left">
                                            <div className="font-medium text-white group-hover:text-blue-400 transition-colors">
                                                {category.name}
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                {category.description}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Badge variant="secondary" className="bg-gray-700 text-gray-300 text-xs">
                                            {category.nodes.length}
                                        </Badge>
                                        {expandedCategories.has(category.id) ? (
                                            <ChevronDown className="w-4 h-4 text-gray-400" />
                                        ) : (
                                            <ChevronRight className="w-4 h-4 text-gray-400" />
                                        )}
                                    </div>
                                </div>
                            </CollapsibleTrigger>

                            <CollapsibleContent>
                                <div className="ml-4 space-y-1">
                                    {category.nodes.map((node) => (
                                        <div
                                            key={node.id}
                                            draggable
                                            onDragStart={(e) => handleNodeDragStart(node, e)}
                                            className={cn(
                                                "flex items-center space-x-3 p-3 rounded-lg cursor-grab active:cursor-grabbing",
                                                "hover:bg-gray-700 transition-all duration-200",
                                                "border border-transparent hover:border-gray-600",
                                                node.bgColor
                                            )}
                                        >
                                            <div className={cn(
                                                "w-8 h-8 rounded-lg flex items-center justify-center",
                                                "border", node.borderColor, node.bgColor
                                            )}>
                                                <node.icon className={cn("w-4 h-4", node.color)} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-white text-sm">
                                                    {node.name}
                                                </div>
                                                <div className="text-xs text-gray-400 truncate">
                                                    {node.description}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CollapsibleContent>
                        </Collapsible>
                    ))}
                </div>
            </ScrollArea>

            {/* 底部统计信息 */}
            <div className="p-3 border-t border-gray-700 bg-gray-800">
                <div className="text-xs text-gray-400 text-center">
                    共 {filteredCategories.reduce((total, cat) => total + cat.nodes.length, 0)} 个节点
                    {searchTerm && ` (搜索: "${searchTerm}")`}
                </div>
            </div>
        </div>
    )
}