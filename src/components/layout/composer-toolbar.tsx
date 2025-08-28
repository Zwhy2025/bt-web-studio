import React from 'react';
import { cn } from '@/core/utils/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
    useComposerActions,
    useActiveTool
} from '@/core/store/behavior-tree-store';
import { ComposerTool } from '@/core/store/composerModeState';
import { useI18n } from '@/hooks/use-i18n';
import {
    MousePointer,
    Plus,
    Move3D,
    Trash2,
    Undo2,
    Redo2,
    Copy,
    Scissors,
    ClipboardPaste
} from 'lucide-react';

interface ComposerToolbarProps {
    className?: string;
}

// 简化的工具组配置
const toolGroups = [
    {
        id: 'selection',
        title: '选择工具',
        tools: [
            {
                tool: ComposerTool.SELECT,
                icon: MousePointer,
                label: '选择工具',
                shortcut: 'V',
                description: '选择和移动节点'
            },
            {
                tool: ComposerTool.PAN,
                icon: Move3D,
                label: '平移工具',
                shortcut: 'H',
                description: '平移画布视图'
            },
        ]
    },
    {
        id: 'editing',
        title: '编辑工具',
        tools: [
            {
                tool: ComposerTool.CONNECT,
                icon: Plus,
                label: '连接工具',
                shortcut: 'C',
                description: '连接节点'
            },
            {
                tool: ComposerTool.DELETE,
                icon: Trash2,
                label: '删除工具',
                shortcut: 'D',
                description: '删除节点和连接'
            },
        ]
    }
];

// 主工具选择组件
function MainTools() {
    const { t } = useI18n();
    const activeTool = useActiveTool();
    const composerActions = useComposerActions();

    const handleToolSelect = (tool: ComposerTool) => {
        composerActions.setActiveTool(tool);
    };

    return (
        <div className="flex items-center gap-1">
            {toolGroups.map((group, groupIndex) => (
                <React.Fragment key={group.id}>
                    {groupIndex > 0 && <Separator orientation="vertical" className="h-5" />}
                    <div className="flex items-center gap-1">
                        {group.tools.map(({ tool, icon: Icon, label, shortcut, description }) => (
                            <TooltipProvider key={tool}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant={activeTool === tool ? "default" : "ghost"}
                                            size="sm"
                                            onClick={() => handleToolSelect(tool)}
                                            className="h-8 w-8 p-0"
                                        >
                                            <Icon className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <div className="text-center">
                                            <div className="font-medium">{label}</div>
                                            <div className="text-xs text-muted-foreground">({shortcut})</div>
                                            <div className="text-xs text-muted-foreground mt-1">{description}</div>
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        ))}
                    </div>
                </React.Fragment>
            ))}
        </div>
    );
}

// 编辑操作组件
function EditOperations() {
    const { t } = useI18n();
    const composerActions = useComposerActions();

    return (
        <div className="flex items-center gap-1">
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={composerActions.undo}
                            disabled={!composerActions.canUndo()}
                            className="h-8 w-8 p-0"
                        >
                            <Undo2 className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t('composer:actions.undo')} (Ctrl+Z)</TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={composerActions.redo}
                            disabled={!composerActions.canRedo()}
                            className="h-8 w-8 p-0"
                        >
                            <Redo2 className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t('composer:actions.redo')} (Ctrl+Y)</TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <Separator orientation="vertical" className="h-5" />

            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={composerActions.copySelection}
                            className="h-8 w-8 p-0"
                        >
                            <Copy className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t('composer:actions.copy')} (Ctrl+C)</TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={composerActions.cutSelection}
                            className="h-8 w-8 p-0"
                        >
                            <Scissors className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t('composer:actions.cut')} (Ctrl+X)</TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => composerActions.paste()}
                            disabled={!composerActions.canPaste()}
                            className="h-8 w-8 p-0"
                        >
                            <ClipboardPaste className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t('composer:actions.paste')} (Ctrl+V)</TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    );
}

// 简化的主工具栏组件
export default function ComposerToolbar({ className }: ComposerToolbarProps) {
    return (
        <div className={cn(
            'flex items-center gap-2 px-3 py-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
            className
        )}>
            {/* 基础工具 */}
            <MainTools />
            <Separator orientation="vertical" className="h-5" />
            <EditOperations />
        </div>
    );
}