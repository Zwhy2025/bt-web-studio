import React, { useMemo } from "react"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Search, ChevronRight, ChevronDown, GitBranch, Zap, HelpCircle, Wrench, Layers } from "lucide-react"
import { NODE_LIBRARY } from "@/components/layout/node-library-panel"

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
                            aria-label={`拖拽以创建 ${item.label}`}
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
    // 使用从 node-library-panel.tsx 导入的节点库定义
    const nodeCategories = useMemo(
        () => NODE_LIBRARY.map(category => ({
            name: category.name,
            icon: <category.icon className="h-4 w-4" />,
            items: category.nodes.map(node => ({
                label: node.name,
                type: node.id,
                desc: node.description
            }))
        })),
        []
    )

    const onDragStart = (event: React.DragEvent, nodeType: string) => {
        event.dataTransfer.setData("application/reactflow", nodeType)
        event.dataTransfer.effectAllowed = "move"
        // 防止事件冒泡
        event.stopPropagation()
    }

    return (
        <aside className="h-full flex flex-col">
            <div className="p-3">
                <div className="font-medium mb-2">节点库</div>
                <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input className="pl-8" placeholder="搜索节点/模板..." />
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