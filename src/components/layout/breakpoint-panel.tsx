import React, { useState, useCallback } from 'react';
import { cn } from '@/core/utils/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  useBreakpoints,
  useDebugActions
} from '@/core/store/behavior-tree-store';
import { useI18n } from '@/hooks/use-i18n';
import { 
  Bug,
  Trash2,
  Settings,
  Search,
  Plus,
  X,
  Target,
  AlertCircle
} from 'lucide-react';

interface BreakpointPanelProps {
  className?: string;
}

export default function BreakpointPanel({ className }: BreakpointPanelProps) {
  const { t } = useI18n();
  const breakpoints = useBreakpoints();
  const debugActions = useDebugActions();
  const [searchQuery, setSearchQuery] = useState('');

  const breakpointList = Object.values(breakpoints);
  const filteredBreakpoints = breakpointList.filter(bp => 
    bp.nodeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (bp.condition && bp.condition.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleToggleBreakpoint = useCallback((breakpointId: string) => {
    debugActions.toggleBreakpoint(breakpointId);
  }, [debugActions]);

  const handleRemoveBreakpoint = useCallback((breakpointId: string) => {
    debugActions.removeBreakpoint(breakpointId);
  }, [debugActions]);

  const handleClearAll = useCallback(() => {
    debugActions.clearAllBreakpoints();
  }, [debugActions]);

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* 搜索和操作栏 */}
      <div className="p-3 border-b space-y-2">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('debug:breakpoints.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
        
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-xs">
            {filteredBreakpoints.length} / {breakpointList.length} {t('debug:breakpoints.items')}
          </Badge>
          
          {breakpointList.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="h-7 gap-1 text-destructive"
            >
              <Trash2 className="h-3 w-3" />
              {t('common:clearAll')}
            </Button>
          )}
        </div>
      </div>

      {/* 断点列表 */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filteredBreakpoints.length === 0 ? (
            <div className="text-center py-8">
              <Bug className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <div className="text-sm font-medium">
                {breakpointList.length === 0 
                  ? t('debug:breakpoints.noBreakpoints')
                  : t('debug:breakpoints.noMatches')
                }
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {t('debug:breakpoints.noBreakpointsDesc')}
              </div>
            </div>
          ) : (
            filteredBreakpoints.map((breakpoint) => (
              <div
                key={breakpoint.id}
                className={cn(
                  'flex items-center gap-2 p-2 rounded-md border transition-colors',
                  breakpoint.enabled 
                    ? 'bg-card border-border' 
                    : 'bg-muted/50 border-muted opacity-60'
                )}
              >
                {/* 启用状态复选框 */}
                <Checkbox
                  checked={breakpoint.enabled}
                  onCheckedChange={() => handleToggleBreakpoint(breakpoint.id)}
                  className="flex-shrink-0"
                />

                {/* 断点信息 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-red-500 flex-shrink-0" />
                    <span className="font-medium text-sm truncate">{breakpoint.nodeId}</span>
                  </div>
                  
                  {breakpoint.condition && (
                    <div className="text-xs text-muted-foreground mt-1 truncate">
                      {t('debug:breakpoints.condition')}: {breakpoint.condition}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {t('debug:breakpoints.hits', { count: breakpoint.hitCount })}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(breakpoint.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveBreakpoint(breakpoint.id)}
                    className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* 底部统计 */}
      {breakpointList.length > 0 && (
        <div className="p-2 border-t bg-muted/30">
          <div className="text-xs text-muted-foreground text-center">
            {t('debug:breakpoints.stats', { 
              enabled: breakpointList.filter(bp => bp.enabled).length,
              total: breakpointList.length,
              hits: breakpointList.reduce((sum, bp) => sum + bp.hitCount, 0)
            })}
          </div>
        </div>
      )}
    </div>
  );
}