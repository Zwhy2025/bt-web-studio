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
    ArrowDown,
    RefreshCw,
    Layers,
    Shuffle,
    Workflow,
    Target,
    Filter,
    ToggleLeft,
    Split,
    Activity,
    FileText,
    Database,
    Clock,
    Repeat,
    Shield,
    Brackets,
    FastForward,
    LogIn,
    LogOut,
    ArrowRightLeft,
    Info,
    Code,
    AlertTriangle
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

// 预定义的节点库 - 根据文档要求重构
export const NODE_LIBRARY: NodeCategory[] = [
    {
        id: 'action',
        name: '动作节点 (Action)',
        description: '执行具体动作的叶子节点',
        icon: Zap,
        color: 'text-green-400',
        nodes: [
            {
                id: 'AlwaysFailure',
                name: 'AlwaysFailure',
                description: '永远返回 FAILURE，无论子节点的执行结果如何，通常用于快速回退。',
                icon: XCircle,
                category: 'action',
                color: 'text-green-400',
                borderColor: 'border-green-500',
                bgColor: 'bg-green-500/10'
            },
            {
                id: 'AlwaysSuccess',
                name: 'AlwaysSuccess',
                description: '永远返回 SUCCESS，无论子节点的执行结果如何，常用于吞掉失败并确保父节点继续执行。',
                icon: CheckCircle,
                category: 'action',
                color: 'text-green-400',
                borderColor: 'border-green-500',
                bgColor: 'bg-green-500/10'
            },
            {
                id: 'Script',
                name: 'Script',
                description: '执行指定的脚本，通常是用户自定义的操作或函数。',
                icon: Code,
                category: 'action',
                color: 'text-green-400',
                borderColor: 'border-green-500',
                bgColor: 'bg-green-500/10'
            },
            {
                id: 'SetBlackboard',
                name: 'SetBlackboard',
                description: '将某些数据存储在黑板中，供其他节点使用。用于记录节点状态或更新共享数据。',
                icon: Database,
                category: 'action',
                color: 'text-green-400',
                borderColor: 'border-green-500',
                bgColor: 'bg-green-500/10'
            },
            {
                id: 'Sleep',
                name: 'Sleep',
                description: '延迟执行，暂停当前节点的执行，用于等待或延时操作。',
                icon: Clock,
                category: 'action',
                color: 'text-green-400',
                borderColor: 'border-green-500',
                bgColor: 'bg-green-500/10'
            }
        ]
    },
    {
        id: 'condition',
        name: '条件节点 (Condition)',
        description: '检查条件状态的叶子节点',
        icon: Eye,
        color: 'text-yellow-400',
        nodes: [
            {
                id: 'ScriptCondition',
                name: 'ScriptCondition',
                description: '执行脚本条件检查，通常用于验证某些条件是否成立，决定行为树的流向。',
                icon: Code,
                category: 'condition',
                color: 'text-yellow-400',
                borderColor: 'border-yellow-500',
                bgColor: 'bg-yellow-500/10'
            }
        ]
    },
    {
        id: 'control',
        name: '控制节点 (Control)',
        description: '控制行为树执行流程的节点',
        icon: GitBranch,
        color: 'text-blue-400',
        nodes: [
            {
                id: 'AsyncFallback',
                name: 'AsyncFallback',
                description: '异步的回退节点，逐一执行子节点，直到某个子节点返回 SUCCESS 或 FAILURE。',
                icon: Shield,
                category: 'control',
                color: 'text-blue-400',
                borderColor: 'border-blue-500',
                bgColor: 'bg-blue-500/10'
            },
            {
                id: 'AsyncSequence',
                name: 'AsyncSequence',
                description: '异步的顺序节点，依次执行每个子节点，直到所有节点都返回 SUCCESS 或某个节点返回 FAILURE。',
                icon: ArrowRight,
                category: 'control',
                color: 'text-blue-400',
                borderColor: 'border-blue-500',
                bgColor: 'bg-blue-500/10'
            },
            {
                id: 'Fallback',
                name: 'Fallback',
                description: '回退节点，如果当前节点失败，则执行下一个子节点。',
                icon: Shuffle,
                category: 'control',
                color: 'text-blue-400',
                borderColor: 'border-blue-500',
                bgColor: 'bg-blue-500/10'
            },
            {
                id: 'IfThenElse',
                name: 'IfThenElse',
                description: '如果条件成立则执行某个子节点，否则执行另一个子节点。',
                icon: Split,
                category: 'control',
                color: 'text-blue-400',
                borderColor: 'border-blue-500',
                bgColor: 'bg-blue-500/10'
            },
            {
                id: 'Parallel',
                name: 'Parallel',
                description: '并行执行多个子节点，直到达到一定的成功/失败条件。',
                icon: Layers,
                category: 'control',
                color: 'text-blue-400',
                borderColor: 'border-blue-500',
                bgColor: 'bg-blue-500/10'
            },
            {
                id: 'ParallelAll',
                name: 'ParallelAll',
                description: '与 Parallel 类似，但要求所有子节点都成功时才返回 SUCCESS。',
                icon: Layers,
                category: 'control',
                color: 'text-blue-400',
                borderColor: 'border-blue-500',
                bgColor: 'bg-blue-500/10'
            },
            {
                id: 'ReactiveFallback',
                name: 'ReactiveFallback',
                description: '异步回退节点，类似于 Fallback，但在状态发生变化时进行实时回退。',
                icon: AlertTriangle,
                category: 'control',
                color: 'text-blue-400',
                borderColor: 'border-blue-500',
                bgColor: 'bg-blue-500/10'
            },
            {
                id: 'ReactiveSequence',
                name: 'ReactiveSequence',
                description: '异步顺序节点，类似于 Sequence，但节点状态变化时可重新评估执行顺序。',
                icon: Zap,
                category: 'control',
                color: 'text-blue-400',
                borderColor: 'border-blue-500',
                bgColor: 'bg-blue-500/10'
            },
            {
                id: 'Sequence',
                name: 'Sequence',
                description: '顺序节点，按顺序执行子节点，直到某个节点返回 FAILURE。',
                icon: Workflow,
                category: 'control',
                color: 'text-blue-400',
                borderColor: 'border-blue-500',
                bgColor: 'bg-blue-500/10'
            },
            {
                id: 'SequenceWithMemory',
                name: 'SequenceWithMemory',
                description: '具有记忆功能的顺序节点，记录每个节点的执行状态并能在以后重新执行。',
                icon: Workflow,
                category: 'control',
                color: 'text-blue-400',
                borderColor: 'border-blue-500',
                bgColor: 'bg-blue-500/10'
            },
            {
                id: 'Switch2',
                name: 'Switch2',
                description: '选择节点，根据条件选择执行不同的子节点。',
                icon: ToggleLeft,
                category: 'control',
                color: 'text-blue-400',
                borderColor: 'border-blue-500',
                bgColor: 'bg-blue-500/10'
            },
            {
                id: 'Switch3',
                name: 'Switch3',
                description: '与 Switch2 类似，但有三个选择条件。',
                icon: ToggleLeft,
                category: 'control',
                color: 'text-blue-400',
                borderColor: 'border-blue-500',
                bgColor: 'bg-blue-500/10'
            },
            {
                id: 'Switch4',
                name: 'Switch4',
                description: '四种选择条件，根据不同的条件执行不同的子节点。',
                icon: ToggleLeft,
                category: 'control',
                color: 'text-blue-400',
                borderColor: 'border-blue-500',
                bgColor: 'bg-blue-500/10'
            },
            {
                id: 'Switch5',
                name: 'Switch5',
                description: '与 Switch4 类似，但有五个选择条件。',
                icon: ToggleLeft,
                category: 'control',
                color: 'text-blue-400',
                borderColor: 'border-blue-500',
                bgColor: 'bg-blue-500/10'
            },
            {
                id: 'Switch6',
                name: 'Switch6',
                description: '六种选择条件，根据不同的条件执行不同的子节点。',
                icon: ToggleLeft,
                category: 'control',
                color: 'text-blue-400',
                borderColor: 'border-blue-500',
                bgColor: 'bg-blue-500/10'
            },
            {
                id: 'WhileDoElse',
                name: 'WhileDoElse',
                description: '当条件成立时，重复执行某个子节点，否则执行备用节点。',
                icon: RotateCcw,
                category: 'control',
                color: 'text-blue-400',
                borderColor: 'border-blue-500',
                bgColor: 'bg-blue-500/10'
            }
        ]
    },
    {
        id: 'decorator',
        name: '装饰器节点 (Decorator)',
        description: '修改子节点行为的装饰器节点',
        icon: Brackets,
        color: 'text-purple-400',
        nodes: [
            {
                id: 'Delay',
                name: 'Delay',
                description: '延迟执行节点，指定一个时间段后再执行子节点。',
                icon: Clock,
                category: 'decorator',
                color: 'text-purple-400',
                borderColor: 'border-purple-500',
                bgColor: 'bg-purple-500/10'
            },
            {
                id: 'ForceFailure',
                name: 'ForceFailure',
                description: '强制节点返回 FAILURE，不管子节点的执行结果如何。',
                icon: XCircle,
                category: 'decorator',
                color: 'text-purple-400',
                borderColor: 'border-purple-500',
                bgColor: 'bg-purple-500/10'
            },
            {
                id: 'ForceSuccess',
                name: 'ForceSuccess',
                description: '强制节点返回 SUCCESS，不管子节点的执行结果如何。',
                icon: CheckCircle,
                category: 'decorator',
                color: 'text-purple-400',
                borderColor: 'border-purple-500',
                bgColor: 'bg-purple-500/10'
            },
            {
                id: 'Inverter',
                name: 'Inverter',
                description: '反转子节点的执行结果，SUCCESS 变为 FAILURE，反之亦然。',
                icon: RotateCcw,
                category: 'decorator',
                color: 'text-purple-400',
                borderColor: 'border-purple-500',
                bgColor: 'bg-purple-500/10'
            },
            {
                id: 'KeepRunningUntilFailure',
                name: 'KeepRunningUntilFailure',
                description: '一直运行直到子节点失败，常用于执行长时间任务直到达到某个失败条件。',
                icon: Repeat,
                category: 'decorator',
                color: 'text-purple-400',
                borderColor: 'border-purple-500',
                bgColor: 'bg-purple-500/10'
            },
            {
                id: 'LoopDouble',
                name: 'LoopDouble',
                description: '重复执行子节点两次。',
                icon: RefreshCw,
                category: 'decorator',
                color: 'text-purple-400',
                borderColor: 'border-purple-500',
                bgColor: 'bg-purple-500/10'
            },
            {
                id: 'LoopString',
                name: 'LoopString',
                description: '根据字符串条件循环执行节点。',
                icon: RefreshCw,
                category: 'decorator',
                color: 'text-purple-400',
                borderColor: 'border-purple-500',
                bgColor: 'bg-purple-500/10'
            },
            {
                id: 'Precondition',
                name: 'Precondition',
                description: '在执行节点之前检查某些条件，如果条件不成立，则跳过节点。',
                icon: CheckCircle,
                category: 'decorator',
                color: 'text-purple-400',
                borderColor: 'border-purple-500',
                bgColor: 'bg-purple-500/10'
            },
            {
                id: 'Repeat',
                name: 'Repeat',
                description: '重复执行子节点，直到达到某个条件（如成功、失败等）。',
                icon: FastForward,
                category: 'decorator',
                color: 'text-purple-400',
                borderColor: 'border-purple-500',
                bgColor: 'bg-purple-500/10'
            },
            {
                id: 'RetryUntilSuccessful',
                name: 'RetryUntilSuccessful',
                description: '重试子节点，直到执行成功为止。',
                icon: Repeat,
                category: 'decorator',
                color: 'text-purple-400',
                borderColor: 'border-purple-500',
                bgColor: 'bg-purple-500/10'
            },
            {
                id: 'RunOnce',
                name: 'RunOnce',
                description: '只执行一次子节点，避免重复执行。',
                icon: Play,
                category: 'decorator',
                color: 'text-purple-400',
                borderColor: 'border-purple-500',
                bgColor: 'bg-purple-500/10'
            },
            {
                id: 'Timeout',
                name: 'Timeout',
                description: '设置超时限制，子节点必须在限定时间内完成，否则返回 FAILURE。',
                icon: Timer,
                category: 'decorator',
                color: 'text-purple-400',
                borderColor: 'border-purple-500',
                bgColor: 'bg-purple-500/10'
            }
        ]
    },
    {
        id: 'subtree',
        name: '子树节点 (SubTree)',
        description: '用于嵌套执行一组节点，形成一个子树，便于结构化管理复杂行为。',
        icon: GitBranch,
        color: 'text-indigo-400',
        nodes: [
            {
                id: 'SubTree',
                name: 'SubTree',
                description: '用于嵌套执行一组节点，形成一个子树，便于结构化管理复杂行为。',
                icon: GitBranch,
                category: 'subtree',
                color: 'text-indigo-400',
                borderColor: 'border-indigo-500',
                bgColor: 'bg-indigo-500/10'
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
        new Set(['action', 'condition', 'control', 'decorator', 'subtree'])
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