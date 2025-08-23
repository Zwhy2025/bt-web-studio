import React from "react"
import { Handle, Position, type NodeProps } from "reactflow"
import { useI18n } from "@/hooks/use-i18n"
import { 
    HelpCircle, Brackets, GitBranch, Workflow, Shuffle, 
    AlertTriangle, Wrench, Code, Database, Clock, Timer, 
    Repeat, RotateCcw, CheckCircle, XCircle, Layers, 
    ToggleLeft, Split, Zap, Play, RefreshCw, Filter, 
    Activity, FileText, Target, Shield, ArrowRight, 
    FastForward, LogIn, LogOut, ArrowRightLeft, Info,
    ChevronRight, ChevronDown
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/core/utils/utils"
import { useBehaviorTreeStore } from "@/core/store/behavior-tree-store"

export type NodeData = {
    label: string
    subtitle?: string
    status?: "idle" | "running" | "success" | "failure"
    breakpoint?: boolean // 新增断点字段
    // 子树相关属性
    subtreeId?: string
    subtreeParameters?: Record<string, string>
    isSubtreeReference?: boolean
    subtreeDefinition?: {
        id: string;
        type: string;
        ports: Array<{
            type: string;
            name: string;
            dataType: string;
            default: string;
            description: string;
        }>;
    };
}

function StatusDot({ status }: { status?: NodeData["status"] }) {
    const map: Record<NonNullable<NodeData["status"]>, string> = {
        idle: "bg-slate-400",
        running: "bg-amber-400",
        success: "bg-emerald-500",
        failure: "bg-rose-500",
    }
    if (!status) return null
    return <span className={cn("inline-block h-2 w-2 rounded-full", map[status])} aria-hidden />
}

function NodeShell({
    icon,
    title,
    subtitle,
    breakpoint, // 新增断点属性
    status, // 新增状态属性
    tint = "bg-slate-100 dark:bg-slate-800",
    borderTint = "border-slate-300/60 dark:border-slate-600/60",
    selected,
    extraContent, // 新增额外内容属性
}: {
    icon: React.ReactNode
    title: string
    subtitle?: string
    breakpoint?: boolean
    status?: NodeData["status"]
    tint?: string
    borderTint?: string
    selected?: boolean
    extraContent?: React.ReactNode
}) {
    return (
        <div
            className={cn(
                "group relative w-[200px] rounded-md border p-3 shadow-sm",
                "bg-card/80 backdrop-blur",
                borderTint,
                selected ? "ring-2 ring-foreground/40" : "ring-0",
                // 根据状态添加边框颜色动画
                status === "running" && "animate-pulse border-amber-400/80",
                status === "success" && "border-emerald-500/80",
                status === "failure" && "border-rose-500/80"
            )}
            role="group"
            aria-label={title}
        >
            {/* 断点指示器 */}
            {breakpoint && (
                <div 
                    className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 border-2 border-background flex items-center justify-center"
                    title={t("common:breakpoint")}
                >
                    <div className="h-1.5 w-1.5 rounded-full bg-background"></div>
                </div>
            )}

            <div className={cn("flex items-start gap-2")}>
                <div
                    className={cn(
                        "inline-flex h-7 w-7 items-center justify-center rounded-md flex-shrink-0",
                        tint,
                    )}
                    aria-hidden
                >
                    {icon}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <div className="truncate text-sm font-medium">{title}</div>
                        <StatusDot status={status} /> {/* 显示状态点 */}
                        {extraContent && <div className="ml-auto">{extraContent}</div>}
                    </div>
                    {subtitle ? (
                        <div className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</div>
                    ) : null}
                </div>
            </div>
        </div>
    )
}

function Ports() {
    return (
        <>
            {/* Top target (in) */}
            <Handle id="in" type="target" position={Position.Top} className="!h-2.5 !w-2.5 !bg-foreground/70" />
            {/* Bottom source (out) */}
            <Handle id="out" type="source" position={Position.Bottom} className="!h-2.5 !w-2.5 !bg-foreground/70" />
        </>
    )
}

// 统一的节点组件
export function UnifiedNode({ data, selected, type, id }: NodeProps<NodeData> & { type: string }) {
    const { t } = useI18n()
    // 根据节点类型确定图标和样式
    const getNodeConfig = () => {
        // 动作节点
        if (type === 'action') {
            return {
                icon: <Wrench className="h-4 w-4 text-foreground/80" />,
                title: data?.label ?? type ?? "Action",
                tint: "bg-slate-100 dark:bg-slate-800",
                borderTint: "border-slate-300/60 dark:border-slate-600/60"
            };
        }
        
        // 条件节点
        if (type === 'condition') {
            return {
                icon: <HelpCircle className="h-4 w-4 text-foreground/80" />,
                title: data?.label ?? type ?? "Condition",
                tint: "bg-emerald-100/60 dark:bg-emerald-900/40",
                borderTint: "border-emerald-300/60 dark:border-emerald-700/60"
            };
        }
        
        // 控制节点
        if ([
            'AsyncFallback', 'AsyncSequence', 'Fallback', 'IfThenElse', 'Parallel', 
            'ParallelAll', 'ReactiveFallback', 'ReactiveSequence', 'Sequence', 
            'SequenceWithMemory', 'Switch2', 'Switch3', 'Switch4', 'Switch5', 
            'Switch6', 'WhileDoElse'
        ].includes(type)) {
            // 根据具体类型选择图标
            let icon = <Workflow className="h-4 w-4 text-foreground/80" />;
            if (type.includes('Parallel')) {
                icon = <Layers className="h-4 w-4 text-foreground/80" />;
            } else if (type.includes('Switch') || type.includes('IfThenElse') || type.includes('WhileDoElse')) {
                icon = <ToggleLeft className="h-4 w-4 text-foreground/80" />;
            } else if (type.includes('Fallback') || type.includes('Selector')) {
                icon = <Shuffle className="h-4 w-4 text-foreground/80" />;
            } else if (type.includes('Async')) {
                icon = <Zap className="h-4 w-4 text-foreground/80" />;
            }
            
            return {
                icon,
                title: data?.label ?? type ?? "Control",
                tint: "bg-amber-100/60 dark:bg-amber-900/40",
                borderTint: "border-amber-300/60 dark:border-amber-700/60"
            };
        }
        
        // 装饰器节点
        if (type === 'decorator') {
            return {
                icon: <Brackets className="h-4 w-4 text-foreground/80" />,
                title: data?.label ?? type ?? "Decorator",
                tint: "bg-violet-100/60 dark:bg-violet-900/40",
                borderTint: "border-violet-300/60 dark:border-violet-700/60"
            };
        }
        
        // 子树节点
        if (type === 'subtree') {
            return {
                icon: <GitBranch className="h-4 w-4 text-foreground/80" />,
                title: data?.subtreeId ?? data?.label ?? type ?? "SubTree",
                tint: "bg-slate-100 dark:bg-slate-800",
                borderTint: "border-slate-300/60 dark:border-slate-600/60"
            };
        }
        
        // 默认节点样式
        return {
            icon: <HelpCircle className="h-4 w-4 text-foreground/80" />,
            title: data?.label ?? type ?? "Node",
            tint: "bg-slate-100 dark:bg-slate-800",
            borderTint: "border-slate-300/60 dark:border-slate-600/60"
        };
    };
    
    const config = getNodeConfig();
    
    // 特殊处理子树节点
    if (type === 'subtree' || type.includes('SubTree')) {
        const { expandedSubTrees, actions } = useBehaviorTreeStore()
        const subtreeId = data?.subtreeId || id || 'unknown-subtree'
        const isExpanded = expandedSubTrees.has(subtreeId)
        
        const PortIcon = ({ type }: { type: string }) => {
            switch (type) {
                case 'input': return <LogIn className="h-3 w-3 text-sky-500" />;
                case 'output': return <LogOut className="h-3 w-3 text-amber-500" />;
                case 'inout': return <ArrowRightLeft className="h-3 w-3 text-violet-500" />;
                default: return <Info className="h-3 w-3" />;
            }
        };
        
        // 计算参数和端口的数量
        const paramCount = data?.subtreeParameters ? Object.keys(data.subtreeParameters).length : 0;
        const portCount = data?.subtreeDefinition?.ports ? data.subtreeDefinition.ports.length : 0;
        
        return (
            <div>
                <NodeShell
                    icon={config.icon}
                    title={config.title}
                    subtitle={data?.subtitle}
                    breakpoint={data?.breakpoint}
                    status={data?.status}
                    tint={config.tint}
                    borderTint={config.borderTint}
                    selected={selected}
                    extraContent={
                        <div className="flex items-center gap-1">
                            {paramCount > 0 && (
                                <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                                    {paramCount}
                                </Badge>
                            )}
                            {portCount > 0 && (
                                <Badge variant="outline" className="h-5 px-1.5 text-xs">
                                    {portCount}
                                </Badge>
                            )}
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:bg-slate-200 dark:hover:bg-slate-700"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    actions.toggleSubTreeExpansion(subtreeId);
                                }}
                                title={isExpanded ? t("nodes:collapseSubtree") : t("nodes:expandSubtree")}
                            >
                                {isExpanded ? (
                                    <ChevronDown className="h-4 w-4" />
                                ) : (
                                    <ChevronRight className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    }
                />
                <Ports />
                
                {isExpanded && data?.subtreeDefinition && (
                    <div className="mt-2 w-[350px] p-3 bg-slate-50 dark:bg-slate-900/80 rounded-md border border-dashed border-slate-300 dark:border-slate-700">
                        <Accordion type="multiple" defaultValue={['parameters', 'ports']} className="w-full">
                            {data?.subtreeParameters && Object.keys(data.subtreeParameters).length > 0 && (
                                <AccordionItem value="parameters">
                                    <AccordionTrigger className="text-xs font-medium">
                                        {t("nodes:parameters")} ({Object.keys(data.subtreeParameters).length})
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <div className="space-y-2 text-xs">
                                            {Object.entries(data.subtreeParameters).map(([key, value]) => (
                                                <div key={key} className="flex justify-between items-center">
                                                    <span className="text-muted-foreground">{key}:</span>
                                                    <Badge variant="outline" className="font-mono max-w-[200px] truncate">{String(value)}</Badge>
                                                </div>
                                            ))}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            )}
                            {data.subtreeDefinition.ports && data.subtreeDefinition.ports.length > 0 && (
                                <AccordionItem value="ports">
                                    <AccordionTrigger className="text-xs font-medium">
                                        {t("nodes:ports")} ({data.subtreeDefinition.ports.length})
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <div className="space-y-3 text-xs">
                                            {data.subtreeDefinition.ports.map((port, index) => (
                                                <div key={index} className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <PortIcon type={port.type} />
                                                        <span className="font-semibold">{port.name}</span>
                                                        <Badge variant="secondary" className="font-mono">{port.dataType}</Badge>
                                                    </div>
                                                    {port.description && (
                                                        <p className="text-muted-foreground pl-5 text-xs">{port.description}</p>
                                                    )}
                                                    {port.default && (
                                                        <p className="text-muted-foreground pl-5 text-xs">{t("nodes:default")}: <code className="font-mono">{port.default}</code></p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            )}
                        </Accordion>
                    </div>
                )}
            </div>
        )
    }
    
    // 普通节点
    return (
        <div>
            <NodeShell
                icon={config.icon}
                title={config.title}
                subtitle={data?.subtitle}
                breakpoint={data?.breakpoint}
                status={data?.status}
                tint={config.tint}
                borderTint={config.borderTint}
                selected={selected}
            />
            <Ports />
        </div>
    )
}

// 节点类型映射 - 使用统一节点组件
export const nodeTypes = {
    // 基础节点类型
    action: (props: NodeProps<NodeData>) => <UnifiedNode {...props} type="action" />,
    condition: (props: NodeProps<NodeData>) => <UnifiedNode {...props} type="condition" />,
    decorator: (props: NodeProps<NodeData>) => <UnifiedNode {...props} type="decorator" />,
    subtree: (props: NodeProps<NodeData>) => <UnifiedNode {...props} type="subtree" />,
    
    // 控制节点 (文档中定义的节点)
    AsyncFallback: (props: NodeProps<NodeData>) => <UnifiedNode {...props} type="AsyncFallback" />,
    AsyncSequence: (props: NodeProps<NodeData>) => <UnifiedNode {...props} type="AsyncSequence" />,
    Fallback: (props: NodeProps<NodeData>) => <UnifiedNode {...props} type="Fallback" />,
    IfThenElse: (props: NodeProps<NodeData>) => <UnifiedNode {...props} type="IfThenElse" />,
    Parallel: (props: NodeProps<NodeData>) => <UnifiedNode {...props} type="Parallel" />,
    ParallelAll: (props: NodeProps<NodeData>) => <UnifiedNode {...props} type="ParallelAll" />,
    ReactiveFallback: (props: NodeProps<NodeData>) => <UnifiedNode {...props} type="ReactiveFallback" />,
    ReactiveSequence: (props: NodeProps<NodeData>) => <UnifiedNode {...props} type="ReactiveSequence" />,
    Sequence: (props: NodeProps<NodeData>) => <UnifiedNode {...props} type="Sequence" />,
    SequenceWithMemory: (props: NodeProps<NodeData>) => <UnifiedNode {...props} type="SequenceWithMemory" />,
    Switch2: (props: NodeProps<NodeData>) => <UnifiedNode {...props} type="Switch2" />,
    Switch3: (props: NodeProps<NodeData>) => <UnifiedNode {...props} type="Switch3" />,
    Switch4: (props: NodeProps<NodeData>) => <UnifiedNode {...props} type="Switch4" />,
    Switch5: (props: NodeProps<NodeData>) => <UnifiedNode {...props} type="Switch5" />,
    Switch6: (props: NodeProps<NodeData>) => <UnifiedNode {...props} type="Switch6" />,
    WhileDoElse: (props: NodeProps<NodeData>) => <UnifiedNode {...props} type="WhileDoElse" />,
    
    // 装饰器节点 (文档中定义的节点)
    Delay: (props: NodeProps<NodeData>) => <UnifiedNode {...props} type="decorator" />,
    ForceFailure: (props: NodeProps<NodeData>) => <UnifiedNode {...props} type="decorator" />,
    ForceSuccess: (props: NodeProps<NodeData>) => <UnifiedNode {...props} type="decorator" />,
    Inverter: (props: NodeProps<NodeData>) => <UnifiedNode {...props} type="decorator" />,
    KeepRunningUntilFailure: (props: NodeProps<NodeData>) => <UnifiedNode {...props} type="decorator" />,
    LoopDouble: (props: NodeProps<NodeData>) => <UnifiedNode {...props} type="decorator" />,
    LoopString: (props: NodeProps<NodeData>) => <UnifiedNode {...props} type="decorator" />,
    Precondition: (props: NodeProps<NodeData>) => <UnifiedNode {...props} type="decorator" />,
    Repeat: (props: NodeProps<NodeData>) => <UnifiedNode {...props} type="decorator" />,
    RetryUntilSuccessful: (props: NodeProps<NodeData>) => <UnifiedNode {...props} type="decorator" />,
    RunOnce: (props: NodeProps<NodeData>) => <UnifiedNode {...props} type="decorator" />,
    Timeout: (props: NodeProps<NodeData>) => <UnifiedNode {...props} type="decorator" />,
    
    // 动作节点 (文档中定义的节点)
    AlwaysFailure: (props: NodeProps<NodeData>) => <UnifiedNode {...props} type="action" />,
    AlwaysSuccess: (props: NodeProps<NodeData>) => <UnifiedNode {...props} type="action" />,
    Script: (props: NodeProps<NodeData>) => <UnifiedNode {...props} type="action" />,
    SetBlackboard: (props: NodeProps<NodeData>) => <UnifiedNode {...props} type="action" />,
    Sleep: (props: NodeProps<NodeData>) => <UnifiedNode {...props} type="action" />,
    
    // 条件节点 (文档中定义的节点)
    ScriptCondition: (props: NodeProps<NodeData>) => <UnifiedNode {...props} type="condition" />,
    
    // 子树节点
    SubTree: (props: NodeProps<NodeData>) => <UnifiedNode {...props} type="subtree" />,
    
    // 兼容性映射
    "control-sequence": (props: NodeProps<NodeData>) => <UnifiedNode {...props} type="Sequence" />,
    "control-selector": (props: NodeProps<NodeData>) => <UnifiedNode {...props} type="Fallback" />,
    "control-fallback": (props: NodeProps<NodeData>) => <UnifiedNode {...props} type="Fallback" />,
    "control-parallel": (props: NodeProps<NodeData>) => <UnifiedNode {...props} type="Parallel" />,
    control: (props: NodeProps<NodeData>) => <UnifiedNode {...props} type="Sequence" />,
    
    // Fallback for unknown types
    unknown: (props: NodeProps<NodeData>) => <UnifiedNode {...props} type="unknown" />,
}