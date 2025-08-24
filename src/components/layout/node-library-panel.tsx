import React, { useState, useMemo } from 'react'
import { useI18n } from '@/hooks/use-i18n'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
    AlertTriangle,
    Languages
} from 'lucide-react'
import { cn } from '@/core/utils/utils'

// 创建国际化的节点类别信息获取函数
const useNodeCategoryTranslation = () => {
    const { t } = useI18n()
    
    return {
        getCategoryName: (categoryId: string) => {
            switch (categoryId) {
                case 'action':
                    return t('nodes:actionNodes')
                case 'condition':
                    return t('nodes:conditionNodes')
                case 'control':
                    return t('nodes:controlNodes')
                case 'decorator':
                    return t('nodes:decoratorNodes')
                case 'subtree':
                    return t('nodes:subtreeNodes')
                default:
                    return categoryId
            }
        },
        getCategoryDescription: (categoryId: string) => {
            switch (categoryId) {
                case 'action':
                    return t('nodes:actionNodesDesc')
                case 'condition':
                    return t('nodes:conditionNodesDesc')
                case 'control':
                    return t('nodes:controlNodesDesc')
                case 'decorator':
                    return t('nodes:decoratorNodesDesc')
                case 'subtree':
                    return t('nodes:subtreeNodesDesc')
                default:
                    return ''
            }
        }
    }
}

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

// 创建动态节点库生成函数
const useNodeLibrary = () => {
    const { t } = useI18n()
    
    return useMemo((): NodeCategory[] => [
        {
            id: 'action',
            name: t('nodes:actionNodes'),
            description: t('nodes:actionNodesDesc'),
            icon: Zap,
            color: 'text-green-400',
            nodes: [
                {
                    id: 'AlwaysFailure',
                    name: 'AlwaysFailure',
                    description: t('nodes:nodeDescriptions.AlwaysFailure'),
                    icon: XCircle,
                    category: 'action',
                    color: 'text-green-400',
                    borderColor: 'border-green-500',
                    bgColor: 'bg-green-500/10'
                },
                {
                    id: 'AlwaysSuccess',
                    name: 'AlwaysSuccess',
                    description: t('nodes:nodeDescriptions.AlwaysSuccess'),
                    icon: CheckCircle,
                    category: 'action',
                    color: 'text-green-400',
                    borderColor: 'border-green-500',
                    bgColor: 'bg-green-500/10'
                },
                {
                    id: 'Script',
                    name: 'Script',
                    description: t('nodes:nodeDescriptions.Script'),
                    icon: Code,
                    category: 'action',
                    color: 'text-green-400',
                    borderColor: 'border-green-500',
                    bgColor: 'bg-green-500/10'
                },
                {
                    id: 'SetBlackboard',
                    name: 'SetBlackboard',
                    description: t('nodes:nodeDescriptions.SetBlackboard'),
                    icon: Database,
                    category: 'action',
                    color: 'text-green-400',
                    borderColor: 'border-green-500',
                    bgColor: 'bg-green-500/10'
                },
                {
                    id: 'Sleep',
                    name: 'Sleep',
                    description: t('nodes:nodeDescriptions.Sleep'),
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
            name: t('nodes:conditionNodes'),
            description: t('nodes:conditionNodesDesc'),
            icon: Eye,
            color: 'text-yellow-400',
            nodes: [
                {
                    id: 'ScriptCondition',
                    name: 'ScriptCondition',
                    description: t('nodes:nodeDescriptions.ScriptCondition'),
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
            name: t('nodes:controlNodes'),
            description: t('nodes:controlNodesDesc'),
            icon: GitBranch,
            color: 'text-blue-400',
            nodes: [
                {
                    id: 'AsyncFallback',
                    name: 'AsyncFallback',
                    description: t('nodes:nodeDescriptions.AsyncFallback'),
                    icon: Shield,
                    category: 'control',
                    color: 'text-blue-400',
                    borderColor: 'border-blue-500',
                    bgColor: 'bg-blue-500/10'
                },
                {
                    id: 'AsyncSequence',
                    name: 'AsyncSequence',
                    description: t('nodes:nodeDescriptions.AsyncSequence'),
                    icon: ArrowRight,
                    category: 'control',
                    color: 'text-blue-400',
                    borderColor: 'border-blue-500',
                    bgColor: 'bg-blue-500/10'
                },
                {
                    id: 'Fallback',
                    name: 'Fallback',
                    description: t('nodes:nodeDescriptions.Fallback'),
                    icon: Shuffle,
                    category: 'control',
                    color: 'text-blue-400',
                    borderColor: 'border-blue-500',
                    bgColor: 'bg-blue-500/10'
                },
                {
                    id: 'IfThenElse',
                    name: 'IfThenElse',
                    description: t('nodes:nodeDescriptions.IfThenElse'),
                    icon: Split,
                    category: 'control',
                    color: 'text-blue-400',
                    borderColor: 'border-blue-500',
                    bgColor: 'bg-blue-500/10'
                },
                {
                    id: 'Parallel',
                    name: 'Parallel',
                    description: t('nodes:nodeDescriptions.Parallel'),
                    icon: Layers,
                    category: 'control',
                    color: 'text-blue-400',
                    borderColor: 'border-blue-500',
                    bgColor: 'bg-blue-500/10'
                },
                {
                    id: 'ParallelAll',
                    name: 'ParallelAll',
                    description: t('nodes:nodeDescriptions.ParallelAll'),
                    icon: Layers,
                    category: 'control',
                    color: 'text-blue-400',
                    borderColor: 'border-blue-500',
                    bgColor: 'bg-blue-500/10'
                },
                {
                    id: 'ReactiveFallback',
                    name: 'ReactiveFallback',
                    description: t('nodes:nodeDescriptions.ReactiveFallback'),
                    icon: AlertTriangle,
                    category: 'control',
                    color: 'text-blue-400',
                    borderColor: 'border-blue-500',
                    bgColor: 'bg-blue-500/10'
                },
                {
                    id: 'ReactiveSequence',
                    name: 'ReactiveSequence',
                    description: t('nodes:nodeDescriptions.ReactiveSequence'),
                    icon: Zap,
                    category: 'control',
                    color: 'text-blue-400',
                    borderColor: 'border-blue-500',
                    bgColor: 'bg-blue-500/10'
                },
                {
                    id: 'Sequence',
                    name: 'Sequence',
                    description: t('nodes:nodeDescriptions.Sequence'),
                    icon: Workflow,
                    category: 'control',
                    color: 'text-blue-400',
                    borderColor: 'border-blue-500',
                    bgColor: 'bg-blue-500/10'
                },
                {
                    id: 'SequenceWithMemory',
                    name: 'SequenceWithMemory',
                    description: t('nodes:nodeDescriptions.SequenceWithMemory'),
                    icon: Workflow,
                    category: 'control',
                    color: 'text-blue-400',
                    borderColor: 'border-blue-500',
                    bgColor: 'bg-blue-500/10'
                },
                {
                    id: 'Switch2',
                    name: 'Switch2',
                    description: t('nodes:nodeDescriptions.Switch2'),
                    icon: ToggleLeft,
                    category: 'control',
                    color: 'text-blue-400',
                    borderColor: 'border-blue-500',
                    bgColor: 'bg-blue-500/10'
                },
                {
                    id: 'Switch3',
                    name: 'Switch3',
                    description: t('nodes:nodeDescriptions.Switch3'),
                    icon: ToggleLeft,
                    category: 'control',
                    color: 'text-blue-400',
                    borderColor: 'border-blue-500',
                    bgColor: 'bg-blue-500/10'
                },
                {
                    id: 'Switch4',
                    name: 'Switch4',
                    description: t('nodes:nodeDescriptions.Switch4'),
                    icon: ToggleLeft,
                    category: 'control',
                    color: 'text-blue-400',
                    borderColor: 'border-blue-500',
                    bgColor: 'bg-blue-500/10'
                },
                {
                    id: 'Switch5',
                    name: 'Switch5',
                    description: t('nodes:nodeDescriptions.Switch5'),
                    icon: ToggleLeft,
                    category: 'control',
                    color: 'text-blue-400',
                    borderColor: 'border-blue-500',
                    bgColor: 'bg-blue-500/10'
                },
                {
                    id: 'Switch6',
                    name: 'Switch6',
                    description: t('nodes:nodeDescriptions.Switch6'),
                    icon: ToggleLeft,
                    category: 'control',
                    color: 'text-blue-400',
                    borderColor: 'border-blue-500',
                    bgColor: 'bg-blue-500/10'
                },
                {
                    id: 'WhileDoElse',
                    name: 'WhileDoElse',
                    description: t('nodes:nodeDescriptions.WhileDoElse'),
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
            name: t('nodes:decoratorNodes'),
            description: t('nodes:decoratorNodesDesc'),
            icon: Brackets,
            color: 'text-purple-400',
            nodes: [
                {
                    id: 'Delay',
                    name: 'Delay',
                    description: t('nodes:nodeDescriptions.Delay'),
                    icon: Clock,
                    category: 'decorator',
                    color: 'text-purple-400',
                    borderColor: 'border-purple-500',
                    bgColor: 'bg-purple-500/10'
                },
                {
                    id: 'ForceFailure',
                    name: 'ForceFailure',
                    description: t('nodes:nodeDescriptions.ForceFailure'),
                    icon: XCircle,
                    category: 'decorator',
                    color: 'text-purple-400',
                    borderColor: 'border-purple-500',
                    bgColor: 'bg-purple-500/10'
                },
                {
                    id: 'ForceSuccess',
                    name: 'ForceSuccess',
                    description: t('nodes:nodeDescriptions.ForceSuccess'),
                    icon: CheckCircle,
                    category: 'decorator',
                    color: 'text-purple-400',
                    borderColor: 'border-purple-500',
                    bgColor: 'bg-purple-500/10'
                },
                {
                    id: 'Inverter',
                    name: 'Inverter',
                    description: t('nodes:nodeDescriptions.Inverter'),
                    icon: RotateCcw,
                    category: 'decorator',
                    color: 'text-purple-400',
                    borderColor: 'border-purple-500',
                    bgColor: 'bg-purple-500/10'
                },
                {
                    id: 'KeepRunningUntilFailure',
                    name: 'KeepRunningUntilFailure',
                    description: t('nodes:nodeDescriptions.KeepRunningUntilFailure'),
                    icon: Repeat,
                    category: 'decorator',
                    color: 'text-purple-400',
                    borderColor: 'border-purple-500',
                    bgColor: 'bg-purple-500/10'
                },
                {
                    id: 'LoopDouble',
                    name: 'LoopDouble',
                    description: t('nodes:nodeDescriptions.LoopDouble'),
                    icon: RefreshCw,
                    category: 'decorator',
                    color: 'text-purple-400',
                    borderColor: 'border-purple-500',
                    bgColor: 'bg-purple-500/10'
                },
                {
                    id: 'LoopString',
                    name: 'LoopString',
                    description: t('nodes:nodeDescriptions.LoopString'),
                    icon: RefreshCw,
                    category: 'decorator',
                    color: 'text-purple-400',
                    borderColor: 'border-purple-500',
                    bgColor: 'bg-purple-500/10'
                },
                {
                    id: 'Precondition',
                    name: 'Precondition',
                    description: t('nodes:nodeDescriptions.Precondition'),
                    icon: CheckCircle,
                    category: 'decorator',
                    color: 'text-purple-400',
                    borderColor: 'border-purple-500',
                    bgColor: 'bg-purple-500/10'
                },
                {
                    id: 'Repeat',
                    name: 'Repeat',
                    description: t('nodes:nodeDescriptions.Repeat'),
                    icon: FastForward,
                    category: 'decorator',
                    color: 'text-purple-400',
                    borderColor: 'border-purple-500',
                    bgColor: 'bg-purple-500/10'
                },
                {
                    id: 'RetryUntilSuccessful',
                    name: 'RetryUntilSuccessful',
                    description: t('nodes:nodeDescriptions.RetryUntilSuccessful'),
                    icon: Repeat,
                    category: 'decorator',
                    color: 'text-purple-400',
                    borderColor: 'border-purple-500',
                    bgColor: 'bg-purple-500/10'
                },
                {
                    id: 'RunOnce',
                    name: 'RunOnce',
                    description: t('nodes:nodeDescriptions.RunOnce'),
                    icon: Play,
                    category: 'decorator',
                    color: 'text-purple-400',
                    borderColor: 'border-purple-500',
                    bgColor: 'bg-purple-500/10'
                },
                {
                    id: 'Timeout',
                    name: 'Timeout',
                    description: t('nodes:nodeDescriptions.Timeout'),
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
            name: t('nodes:subtreeNodes'),
            description: t('nodes:subtreeNodesDesc'),
            icon: GitBranch,
            color: 'text-indigo-400',
            nodes: [
                {
                    id: 'SubTree',
                    name: 'SubTree',
                    description: t('nodes:nodeDescriptions.SubTree'),
                    icon: GitBranch,
                    category: 'subtree',
                    color: 'text-indigo-400',
                    borderColor: 'border-indigo-500',
                    bgColor: 'bg-indigo-500/10'
                }
            ]
        }
    ], [t])
}

interface NodeLibraryPanelProps {
    onNodeDragStart?: (nodeType: NodeType, event: React.DragEvent) => void
    className?: string
}

export function NodeLibraryPanel({ onNodeDragStart, className }: NodeLibraryPanelProps) {
    const { t } = useI18n()
    const { getCategoryName, getCategoryDescription } = useNodeCategoryTranslation()
    const nodeLibrary = useNodeLibrary()  // Use dynamic node library instead of static NODE_LIBRARY
    const [searchTerm, setSearchTerm] = useState('')
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
        new Set(['action', 'condition', 'control', 'decorator', 'subtree'])
    )

    // 过滤节点
    const filteredCategories = useMemo(() => {
        if (!searchTerm.trim()) {
            return nodeLibrary  // Use dynamic nodeLibrary instead of NODE_LIBRARY
        }

        const term = searchTerm.toLowerCase()
        return nodeLibrary.map(category => ({  // Use dynamic nodeLibrary
            ...category,
            nodes: category.nodes.filter(node =>
                node.name.toLowerCase().includes(term) ||
                node.description.toLowerCase().includes(term)
            )
        })).filter(category => category.nodes.length > 0)
    }, [searchTerm, nodeLibrary])  // Add nodeLibrary to dependency array

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
        // 设置拖拽数据 - 只传递可序列化的数据
        event.dataTransfer.setData('application/reactflow', JSON.stringify({
            type: 'node',
            nodeData: {
                id: nodeType.id,
                name: nodeType.name,
                category: nodeType.category,
                description: nodeType.description,
                color: nodeType.color,
                borderColor: nodeType.borderColor,
                bgColor: nodeType.bgColor
            }
        }))
        event.dataTransfer.effectAllowed = 'move'

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
                <h2 className="text-lg font-semibold text-white mb-3">{t('layout:nodeLibrary')}</h2>

                {/* 搜索框 */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        placeholder={t('nodes:searchNodes')}
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
                                                {getCategoryName(category.id)}
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                {getCategoryDescription(category.id)}
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
                                                "flex items-start space-x-3 p-3 rounded-lg cursor-grab active:cursor-grabbing",
                                                "hover:bg-gray-700 transition-all duration-200",
                                                "border border-transparent hover:border-gray-600",
                                                node.bgColor
                                            )}
                                        >
                                            <div className={cn(
                                                "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                                                "border", node.borderColor, node.bgColor
                                            )}>
                                                <node.icon className={cn("w-4 h-4", node.color)} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-white text-sm">
                                                    {node.name}
                                                </div>
                                                <div className="text-xs text-gray-400 break-words">
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
                    {t('nodes:totalNodes', { count: filteredCategories.reduce((total, cat) => total + cat.nodes.length, 0) })}
                    {searchTerm && ` (${t('nodes:searchResult')}: "${searchTerm}")`}
                </div>
            </div>
        </div>
    )
}

export default NodeLibraryPanel;