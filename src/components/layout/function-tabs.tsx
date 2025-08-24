import React from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/core/utils/utils';
import { useI18n } from '@/hooks/use-i18n';
import { WorkflowMode } from '@/core/store/workflowModeState';
import {
  HelpCircle
} from 'lucide-react';

export type FunctionTabKey = 'help';

export const getVisibleTabsForMode = (mode: WorkflowMode): FunctionTabKey[] => {
  // 所有模式都只显示帮助Tab
  return ['help'];
};

interface FunctionTabsProps {
  className?: string;
  // 移除文件操作相关的props，因为功能已删除
}

export function FunctionTabs({ className }: FunctionTabsProps) {
  const { t } = useI18n();

  // 移除不再需要的状态和逻辑，只保留帮助功能
  const visible = ['help'] as const;

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {/* Help (All modes) */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 gap-1">
            <HelpCircle className="h-4 w-4" />
            <span>{t('menu:help') || 'Help'}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => window.open('/docs/user-guide.md', '_blank')}>{t('menu:docs') || 'User Guide'}</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => window.open('/AGENTS.md', '_blank')}>Repository Guidelines</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
