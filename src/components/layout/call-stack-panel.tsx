import React, { useState } from 'react';
import { cn } from '@/core/utils/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  useCallStack,
  useDebugActions
} from '@/core/store/behavior-tree-store';
import { useI18n } from '@/hooks/use-i18n';
import { 
  Layers,
  ChevronRight,
  ChevronDown,
  Target,
  Clock,
  Activity,
  RotateCcw
} from 'lucide-react';

interface CallStackPanelProps {
  className?: string;
}

export default function CallStackPanel({ className }: CallStackPanelProps) {
  const { t } = useI18n();
  const callStack = useCallStack();
  const debugActions = useDebugActions();
  const [expandedFrames, setExpandedFrames] = useState<Set<string>>(new Set());

  const handleSelectFrame = (frameId: string) => {
    debugActions.selectStackFrame(frameId);
  };

  const handleRefreshStack = () => {
    debugActions.refreshCallStack();
  };

  const toggleFrameExpansion = (frameId: string) => {
    const newExpanded = new Set(expandedFrames);
    if (newExpanded.has(frameId)) {
      newExpanded.delete(frameId);
    } else {
      newExpanded.add(frameId);
    }
    setExpandedFrames(newExpanded);
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* 操作栏 */}
      <div className="p-3 border-b">
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-xs">
            {callStack.length} {t('debug:callStack.frames')}
          </Badge>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefreshStack}
            className="h-7 gap-1"
          >
            <RotateCcw className="h-3 w-3" />
            {t('common:refresh')}
          </Button>
        </div>
      </div>

      {/* 调用栈列表 */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {callStack.length === 0 ? (
            <div className="text-center py-8">
              <Layers className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <div className="text-sm font-medium">{t('debug:callStack.noFrames')}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {t('debug:callStack.noFramesDesc')}
              </div>
            </div>
          ) : (
            callStack.map((frame, index) => {
              const isExpanded = expandedFrames.has(frame.id);
              const isTopFrame = index === 0;
              
              return (
                <div
                  key={frame.id}
                  className={cn(
                    'rounded-md border transition-colors',
                    isTopFrame 
                      ? 'bg-blue-50 border-blue-200' 
                      : 'bg-card border-border hover:bg-muted/50'
                  )}
                >
                  {/* 框架头部 */}
                  <div
                    className="flex items-center gap-2 p-2 cursor-pointer"
                    onClick={() => handleSelectFrame(frame.id)}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFrameExpansion(frame.id);
                      }}
                      className="h-6 w-6 p-0"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ChevronRight className="h-3 w-3" />
                      )}
                    </Button>

                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={isTopFrame ? "default" : "secondary"} 
                        className="text-xs w-6 h-6 rounded-full p-0 flex items-center justify-center"
                      >
                        {frame.level}
                      </Badge>
                      
                      {isTopFrame && (
                        <Activity className="h-4 w-4 text-blue-500" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {frame.functionName}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {frame.nodeId}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {new Date(frame.timestamp).toLocaleTimeString()}
                    </div>
                  </div>

                  {/* 框架详情 */}
                  {isExpanded && (
                    <div className="px-4 pb-2 border-t bg-muted/30">
                      <div className="pt-2 space-y-2">
                        {/* 节点信息 */}
                        <div className="flex items-center gap-2">
                          <Target className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs">
                            {t('debug:callStack.nodeId')}: {frame.nodeId}
                          </span>
                        </div>

                        {/* 参数 */}
                        {frame.parameters && Object.keys(frame.parameters).length > 0 && (
                          <div>
                            <div className="text-xs font-medium mb-1">
                              {t('debug:callStack.parameters')}:
                            </div>
                            <div className="space-y-1">
                              {Object.entries(frame.parameters).map(([key, value]) => (
                                <div key={key} className="flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground">{key}:</span>
                                  <span className="font-mono text-blue-600">
                                    {JSON.stringify(value)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 执行时间 */}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{t('debug:callStack.timestamp')}:</span>
                          <span>{new Date(frame.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* 底部信息 */}
      {callStack.length > 0 && (
        <div className="p-2 border-t bg-muted/30">
          <div className="text-xs text-muted-foreground text-center">
            {t('debug:callStack.depth', { depth: callStack.length })}
          </div>
        </div>
      )}
    </div>
  );
}