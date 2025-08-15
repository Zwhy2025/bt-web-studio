import React from "react"
import { cn } from "@/lib/utils"
import {
    Wrench,
    HelpCircle,
    Workflow,
    Shuffle,
    Brackets,
    GitBranch,
} from "lucide-react"
import { Handle, Position, type NodeProps } from "reactflow"

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
}: {
    icon: React.ReactNode
    title: string
    subtitle?: string
    breakpoint?: boolean
    status?: NodeData["status"]
    tint?: string
    borderTint?: string
    selected?: boolean
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
            />
            <Ports />
        </div>
    )
}

export const nodeTypes = {
    action: ActionNode,
    condition: ConditionNode,
    "control-sequence": SequenceNode,
    "control-selector": SelectorNode,
    decorator: DecoratorNode,
    subtree: SubTreeNode,
}