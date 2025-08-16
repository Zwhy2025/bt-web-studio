import React, { useState } from "react"
import { cn } from "@/lib/utils"
import { Handle, Position, type NodeProps } from "reactflow"
import { 
    GitBranch, Layers, ChevronDown, ChevronRight,
    ArrowRight, RotateCcw, Timer, Zap, Shield, 
    CheckCircle, XCircle, Clock, Repeat, FastForward,
    AlertTriangle, Wrench, HelpCircle, Workflow, Shuffle, Brackets
} from "lucide-react"
import { Button } from "@/components/ui/button"

export type NodeData = {
    label: string
    subtitle?: string
    status?: "idle" | "running" | "success" | "failure"
    breakpoint?: boolean // 新增断点字段
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
                    title="断点"
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

export function ActionNode({ data, selected }: NodeProps<NodeData>) {
    return (
        <div>
            <NodeShell
                icon={<Wrench className="h-4 w-4 text-foreground/80" />}
                title={data?.label ?? "Action"}
                subtitle={data?.subtitle}
                breakpoint={data?.breakpoint}
                status={data?.status}
                tint="bg-slate-100 dark:bg-slate-800"
                borderTint="border-slate-300/60 dark:border-slate-600/60"
                selected={selected}
            />
            <Ports />
        </div>
    )
}

export function ConditionNode({ data, selected }: NodeProps<NodeData>) {
    return (
        <div>
            <NodeShell
                icon={<HelpCircle className="h-4 w-4 text-foreground/80" />}
                title={data?.label ?? "Condition"}
                subtitle={data?.subtitle}
                breakpoint={data?.breakpoint}
                status={data?.status}
                tint="bg-emerald-100/60 dark:bg-emerald-900/40"
                borderTint="border-emerald-300/60 dark:border-emerald-700/60"
                selected={selected}
            />
            <Ports />
        </div>
    )
}

export function SequenceNode({ data, selected }: NodeProps<NodeData>) {
    return (
        <div>
            <NodeShell
                icon={<Workflow className="h-4 w-4 text-foreground/80" />}
                title={data?.label ?? "Sequence"}
                subtitle={data?.subtitle}
                breakpoint={data?.breakpoint}
                status={data?.status}
                tint="bg-amber-100/60 dark:bg-amber-900/40"
                borderTint="border-amber-300/60 dark:border-amber-700/60"
                selected={selected}
            />
            <Ports />
        </div>
    )
}

export function SelectorNode({ data, selected }: NodeProps<NodeData>) {
    return (
        <div>
            <NodeShell
                icon={<Shuffle className="h-4 w-4 text-foreground/80" />}
                title={data?.label ?? "Selector"}
                subtitle={data?.subtitle}
                breakpoint={data?.breakpoint}
                status={data?.status}
                tint="bg-fuchsia-100/60 dark:bg-fuchsia-900/40"
                borderTint="border-fuchsia-300/60 dark:border-fuchsia-700/60"
                selected={selected}
            />
            <Ports />
        </div>
    )
}

export function DecoratorNode({ data, selected }: NodeProps<NodeData>) {
    return (
        <div>
            <NodeShell
                icon={<Brackets className="h-4 w-4 text-foreground/80" />}
                title={data?.label ?? "Decorator"}
                subtitle={data?.subtitle}
                breakpoint={data?.breakpoint}
                status={data?.status}
                tint="bg-violet-100/60 dark:bg-violet-900/40"
                borderTint="border-violet-300/60 dark:border-violet-700/60"
                selected={selected}
            />
            <Ports />
        </div>
    )
}

export function SubTreeNode({ data, selected }: NodeProps<NodeData>) {
    const [isExpanded, setIsExpanded] = useState(false);
    
    return (
        <div>
            <NodeShell
                icon={<GitBranch className="h-4 w-4 text-foreground/80" />}
                title={data?.label ?? "SubTree"}
                subtitle={data?.subtitle}
                breakpoint={data?.breakpoint}
                status={data?.status}
                tint="bg-slate-100 dark:bg-slate-800"
                borderTint="border-slate-300/60 dark:border-slate-600/60"
                selected={selected}
                extraContent={
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 hover:bg-slate-200 dark:hover:bg-slate-700"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsExpanded(!isExpanded);
                        }}
                        title={isExpanded ? "折叠子树" : "展开子树"}
                    >
                        {isExpanded ? (
                            <ChevronDown className="h-3 w-3" />
                        ) : (
                            <ChevronRight className="h-3 w-3" />
                        )}
                    </Button>
                }
            />
            <Ports />
        </div>
    )
}

// BehaviorTree.CPP核心节点类型组件
export function SequenceStarNode({ data, selected }: NodeProps<NodeData>) {
    return (
        <div>
            <NodeShell
                icon={<ArrowRight className="h-4 w-4 text-blue-600" />}
                title={data?.label ?? "Sequence*"}
                subtitle={data?.subtitle}
                breakpoint={data?.breakpoint}
                status={data?.status}
                tint="bg-blue-50 dark:bg-blue-900/20"
                borderTint="border-blue-300/60 dark:border-blue-600/60"
                selected={selected}
            />
            <Ports />
        </div>
    )
}

export function FallbackStarNode({ data, selected }: NodeProps<NodeData>) {
    return (
        <div>
            <NodeShell
                icon={<Shield className="h-4 w-4 text-orange-600" />}
                title={data?.label ?? "Fallback*"}
                subtitle={data?.subtitle}
                breakpoint={data?.breakpoint}
                status={data?.status}
                tint="bg-orange-50 dark:bg-orange-900/20"
                borderTint="border-orange-300/60 dark:border-orange-600/60"
                selected={selected}
            />
            <Ports />
        </div>
    )
}

export function ParallelNode({ data, selected }: NodeProps<NodeData>) {
    return (
        <div>
            <NodeShell
                icon={<Layers className="h-4 w-4 text-purple-600" />}
                title={data?.label ?? "Parallel"}
                subtitle={data?.subtitle}
                breakpoint={data?.breakpoint}
                status={data?.status}
                tint="bg-purple-50 dark:bg-purple-900/20"
                borderTint="border-purple-300/60 dark:border-purple-600/60"
                selected={selected}
            />
            <Ports />
        </div>
    )
}

export function ReactiveSequenceNode({ data, selected }: NodeProps<NodeData>) {
    return (
        <div>
            <NodeShell
                icon={<Zap className="h-4 w-4 text-cyan-600" />}
                title={data?.label ?? "ReactiveSequence"}
                subtitle={data?.subtitle}
                breakpoint={data?.breakpoint}
                status={data?.status}
                tint="bg-cyan-50 dark:bg-cyan-900/20"
                borderTint="border-cyan-300/60 dark:border-cyan-600/60"
                selected={selected}
            />
            <Ports />
        </div>
    )
}

export function ReactiveFallbackNode({ data, selected }: NodeProps<NodeData>) {
    return (
        <div>
            <NodeShell
                icon={<AlertTriangle className="h-4 w-4 text-yellow-600" />}
                title={data?.label ?? "ReactiveFallback"}
                subtitle={data?.subtitle}
                breakpoint={data?.breakpoint}
                status={data?.status}
                tint="bg-yellow-50 dark:bg-yellow-900/20"
                borderTint="border-yellow-300/60 dark:border-yellow-600/60"
                selected={selected}
            />
            <Ports />
        </div>
    )
}

// Decorator节点类型
export function InverterNode({ data, selected }: NodeProps<NodeData>) {
    return (
        <div>
            <NodeShell
                icon={<RotateCcw className="h-4 w-4 text-red-600" />}
                title={data?.label ?? "Inverter"}
                subtitle={data?.subtitle}
                breakpoint={data?.breakpoint}
                status={data?.status}
                tint="bg-red-50 dark:bg-red-900/20"
                borderTint="border-red-300/60 dark:border-red-600/60"
                selected={selected}
            />
            <Ports />
        </div>
    )
}

export function RetryNode({ data, selected }: NodeProps<NodeData>) {
    return (
        <div>
            <NodeShell
                icon={<Repeat className="h-4 w-4 text-indigo-600" />}
                title={data?.label ?? "Retry"}
                subtitle={data?.subtitle}
                breakpoint={data?.breakpoint}
                status={data?.status}
                tint="bg-indigo-50 dark:bg-indigo-900/20"
                borderTint="border-indigo-300/60 dark:border-indigo-600/60"
                selected={selected}
            />
            <Ports />
        </div>
    )
}

export function RepeatNode({ data, selected }: NodeProps<NodeData>) {
    return (
        <div>
            <NodeShell
                icon={<FastForward className="h-4 w-4 text-teal-600" />}
                title={data?.label ?? "Repeat"}
                subtitle={data?.subtitle}
                breakpoint={data?.breakpoint}
                status={data?.status}
                tint="bg-teal-50 dark:bg-teal-900/20"
                borderTint="border-teal-300/60 dark:border-teal-600/60"
                selected={selected}
            />
            <Ports />
        </div>
    )
}

export function TimeoutNode({ data, selected }: NodeProps<NodeData>) {
    return (
        <div>
            <NodeShell
                icon={<Timer className="h-4 w-4 text-amber-600" />}
                title={data?.label ?? "Timeout"}
                subtitle={data?.subtitle}
                breakpoint={data?.breakpoint}
                status={data?.status}
                tint="bg-amber-50 dark:bg-amber-900/20"
                borderTint="border-amber-300/60 dark:border-amber-600/60"
                selected={selected}
            />
            <Ports />
        </div>
    )
}

export function DelayNode({ data, selected }: NodeProps<NodeData>) {
    return (
        <div>
            <NodeShell
                icon={<Clock className="h-4 w-4 text-slate-600" />}
                title={data?.label ?? "Delay"}
                subtitle={data?.subtitle}
                breakpoint={data?.breakpoint}
                status={data?.status}
                tint="bg-slate-50 dark:bg-slate-900/20"
                borderTint="border-slate-300/60 dark:border-slate-600/60"
                selected={selected}
            />
            <Ports />
        </div>
    )
}

export function ForceSuccessNode({ data, selected }: NodeProps<NodeData>) {
    return (
        <div>
            <NodeShell
                icon={<CheckCircle className="h-4 w-4 text-green-600" />}
                title={data?.label ?? "ForceSuccess"}
                subtitle={data?.subtitle}
                breakpoint={data?.breakpoint}
                status={data?.status}
                tint="bg-green-50 dark:bg-green-900/20"
                borderTint="border-green-300/60 dark:border-green-600/60"
                selected={selected}
            />
            <Ports />
        </div>
    )
}

export function ForceFailureNode({ data, selected }: NodeProps<NodeData>) {
    return (
        <div>
            <NodeShell
                icon={<XCircle className="h-4 w-4 text-red-600" />}
                title={data?.label ?? "ForceFailure"}
                subtitle={data?.subtitle}
                breakpoint={data?.breakpoint}
                status={data?.status}
                tint="bg-red-50 dark:bg-red-900/20"
                borderTint="border-red-300/60 dark:border-red-600/60"
                selected={selected}
            />
            <Ports />
        </div>
    )
}

// 扩展的节点类型映射
export const nodeTypes = {
    // 基础节点类型
    action: ActionNode,
    condition: ConditionNode,
    decorator: DecoratorNode,
    subtree: SubTreeNode,
    
    // 控制节点
    "control-sequence": SequenceNode,
    "control-selector": SelectorNode,
    "control-fallback": SelectorNode,
    "control-parallel": ParallelNode,
    control: SequenceNode,
    
    // BehaviorTree.CPP标准控制节点
    Sequence: SequenceNode,
    Selector: SelectorNode,
    Fallback: SelectorNode,
    "Sequence*": SequenceStarNode,
    "SequenceStar": SequenceStarNode,
    "Fallback*": FallbackStarNode,
    "FallbackStar": FallbackStarNode,
    Parallel: ParallelNode,
    ReactiveSequence: ReactiveSequenceNode,
    ReactiveFallback: ReactiveFallbackNode,
    
    // Decorator节点
    Inverter: InverterNode,
    Retry: RetryNode,
    Repeat: RepeatNode,
    Timeout: TimeoutNode,
    Delay: DelayNode,
    ForceSuccess: ForceSuccessNode,
    ForceFailure: ForceFailureNode,
    
    // 别名和兼容性
    "NOT": InverterNode,
    "AlwaysSuccess": ForceSuccessNode,
    "AlwaysFailure": ForceFailureNode,
    "KeepRunningUntilFailure": RepeatNode,
    "RepeatUntilFailure": RepeatNode,
    "SubTree": SubTreeNode,
    "SubTreePlus": SubTreeNode,
    
    // Fallback for unknown types
    unknown: ActionNode,
}