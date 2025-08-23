import React, { useMemo } from "react"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Search, ChevronRight, ChevronDown, GitBranch, Zap, Eye, Brackets } from "lucide-react"
import { useI18n } from "@/hooks/use-i18n"

// 创建轻量化的节点库数据
const useNodeCategories = () => {
    const { t } = useI18n()
    
    return useMemo(() => [
        {
            name: t('nodes:actionNodes'),
            icon: <Zap className="h-4 w-4" />,
            items: [
                { label: 'AlwaysFailure', type: 'AlwaysFailure', desc: t('nodes:nodeDescriptions.AlwaysFailure') },
                { label: 'AlwaysSuccess', type: 'AlwaysSuccess', desc: t('nodes:nodeDescriptions.AlwaysSuccess') },
                { label: 'Script', type: 'Script', desc: t('nodes:nodeDescriptions.Script') },
                { label: 'SetBlackboard', type: 'SetBlackboard', desc: t('nodes:nodeDescriptions.SetBlackboard') },
                { label: 'Sleep', type: 'Sleep', desc: t('nodes:nodeDescriptions.Sleep') }
            ]
        },
        {
            name: t('nodes:conditionNodes'),
            icon: <Eye className="h-4 w-4" />,
            items: [
                { label: 'ScriptCondition', type: 'ScriptCondition', desc: t('nodes:nodeDescriptions.ScriptCondition') }
            ]
        },
        {
            name: t('nodes:controlNodes'),
            icon: <GitBranch className="h-4 w-4" />,
            items: [
                { label: 'AsyncFallback', type: 'AsyncFallback', desc: t('nodes:nodeDescriptions.AsyncFallback') },
                { label: 'AsyncSequence', type: 'AsyncSequence', desc: t('nodes:nodeDescriptions.AsyncSequence') },
                { label: 'Fallback', type: 'Fallback', desc: t('nodes:nodeDescriptions.Fallback') },
                { label: 'IfThenElse', type: 'IfThenElse', desc: t('nodes:nodeDescriptions.IfThenElse') },
                { label: 'Parallel', type: 'Parallel', desc: t('nodes:nodeDescriptions.Parallel') },
                { label: 'Sequence', type: 'Sequence', desc: t('nodes:nodeDescriptions.Sequence') }
            ]
        },
        {
            name: t('nodes:decoratorNodes'),
            icon: <Brackets className="h-4 w-4" />,
            items: [
                { label: 'Delay', type: 'Delay', desc: t('nodes:nodeDescriptions.Delay') },
                { label: 'ForceFailure', type: 'ForceFailure', desc: t('nodes:nodeDescriptions.ForceFailure') },
                { label: 'ForceSuccess', type: 'ForceSuccess', desc: t('nodes:nodeDescriptions.ForceSuccess') },
                { label: 'Inverter', type: 'Inverter', desc: t('nodes:nodeDescriptions.Inverter') },
                { label: 'Repeat', type: 'Repeat', desc: t('nodes:nodeDescriptions.Repeat') },
                { label: 'Timeout', type: 'Timeout', desc: t('nodes:nodeDescriptions.Timeout') }
            ]
        }
    ], [t])
}

// ---------- Node Category Section Component ----------
function NodeCategorySection({
    category,
    onDragStart
}: {
    category: {
        name: string;
        icon: React.ReactNode;
        items: Array<{ label: string; type: string; desc: string }>;
    };
    onDragStart: (e: React.DragEvent, type: string) => void;
}) {
    const [isExpanded, setIsExpanded] = React.useState(true);
    const { t } = useI18n(); // 在子组件中也需要使用i18n hook

    return (
        <div className="space-y-1">
            {/* 分类标题 */}
            <div
                className="flex items-center gap-2 p-2 rounded-md hover:bg-accent/30 cursor-pointer select-none"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                {category.icon}
                <span className="text-sm font-medium">{category.name}</span>
                <span className="text-xs text-muted-foreground ml-auto">
                    {category.items.length}
                </span>
            </div>

            {/* 节点列表 */}
            {isExpanded && (
                <div className="ml-6 space-y-1">
                    {category.items.map((item, index) => (
                        <div
                            key={`${category.name}-${item.label}-${index}`}
                            draggable
                            onDragStart={(e) => onDragStart(e, item.type)}
                            role="button"
                            aria-label={`${t('common:create')} ${item.label}`}
                            className="rounded-md border bg-card/60 backdrop-blur hover:bg-accent/50 transition-colors p-2 cursor-grab active:cursor-grabbing"
                        >
                            <div className="flex items-center justify-between">
                                <div className="text-sm font-medium">{item.label}</div>
                                <GitBranch className="h-3 w-3 text-muted-foreground" />
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">{item.desc}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ---------- Left Palette ----------
export function LeftPalette() {
    const { t } = useI18n()
    const nodeCategories = useNodeCategories() // 使用动态节点库

    const onDragStart = (event: React.DragEvent, nodeType: string) => {
        event.dataTransfer.setData("application/reactflow", nodeType)
        event.dataTransfer.effectAllowed = "move"
        // 防止事件冒泡
        event.stopPropagation()
    }

    return (
        <aside className="h-full flex flex-col">
            <div className="p-3">
                <div className="font-medium mb-2">{t('panels:nodeLibrary')}</div>
                <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input className="pl-8" placeholder={t('panels:searchInPanel')} />
                </div>
            </div>
            <Separator />
            <ScrollArea className="flex-1">
                <div className="p-3 space-y-2">
                    {nodeCategories.map((category) => (
                        <NodeCategorySection
                            key={category.name}
                            category={category}
                            onDragStart={onDragStart}
                        />
                    ))}
                </div>
            </ScrollArea>
        </aside>
    )
}