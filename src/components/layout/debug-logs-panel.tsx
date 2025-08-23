import React, { useState, useCallback, useMemo } from 'react';
import { cn } from '@/core/utils/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { 
  useDebugLogs,
  useDebugActions
} from '@/core/store/behavior-tree-store';
import { useI18n } from '@/hooks/use-i18n';
import { 
  Terminal,
  Search,
  Filter,
  Trash2,
  Download,
  AlertTriangle,
  Info,
  XCircle,
  Bug,
  ChevronDown,
  Copy,
  RotateCcw
} from 'lucide-react';

interface DebugLogsPanelProps {
  className?: string;
}

type LogLevel = 'debug' | 'info' | 'warning' | 'error';

export default function DebugLogsPanel({ className }: DebugLogsPanelProps) {
  const { t } = useI18n();
  const logs = useDebugLogs();
  const debugActions = useDebugActions();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevels, setSelectedLevels] = useState<Set<LogLevel>>(
    new Set(['debug', 'info', 'warning', 'error'])
  );
  const [autoScroll, setAutoScroll] = useState(true);

  // 过滤日志
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = !searchQuery || 
        log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.nodeId && log.nodeId.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesLevel = selectedLevels.has(log.level);
      
      return matchesSearch && matchesLevel;
    });
  }, [logs, searchQuery, selectedLevels]);

  // 统计各级别日志数量
  const logCounts = useMemo(() => {
    return logs.reduce((counts, log) => {
      counts[log.level] = (counts[log.level] || 0) + 1;
      return counts;
    }, {} as Record<LogLevel, number>);
  }, [logs]);

  const handleToggleLevel = useCallback((level: LogLevel) => {
    const newSelected = new Set(selectedLevels);
    if (newSelected.has(level)) {
      newSelected.delete(level);
    } else {
      newSelected.add(level);
    }
    setSelectedLevels(newSelected);
  }, [selectedLevels]);

  const handleClearLogs = useCallback(() => {
    debugActions.clearLogs();
  }, [debugActions]);

  const handleCopyLog = useCallback((logEntry: any) => {
    const logText = `[${new Date(logEntry.timestamp).toLocaleTimeString()}] [${logEntry.level.toUpperCase()}] ${logEntry.message}`;
    navigator.clipboard.writeText(logText);
  }, []);

  const handleExportLogs = useCallback(() => {
    const logText = filteredLogs.map(log => 
      `[${new Date(log.timestamp).toLocaleString()}] [${log.level.toUpperCase()}] ${log.message}${log.nodeId ? ` (${log.nodeId})` : ''}`
    ).join('\n');
    
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug-logs-${new Date().toISOString().slice(0, 19)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredLogs]);

  const getLogIcon = (level: LogLevel) => {
    switch (level) {
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'debug':
        return <Bug className="h-4 w-4 text-gray-500" />;
      default:
        return <Terminal className="h-4 w-4 text-gray-500" />;
    }
  };

  const getLogColor = (level: LogLevel) => {
    switch (level) {
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'info':
        return 'border-blue-200 bg-blue-50';
      case 'debug':
        return 'border-gray-200 bg-gray-50';
      default:
        return 'border-gray-200 bg-white';
    }
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* 搜索和过滤 */}
      <div className="p-3 border-b space-y-2">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('debug:logs.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
        
        <div className="flex items-center justify-between">
          {/* 级别过滤 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1">
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">{t('debug:logs.filter')}</span>
                <Badge variant="secondary" className="ml-1">
                  {selectedLevels.size}
                </Badge>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>{t('debug:logs.logLevels')}</DropdownMenuLabel>
              {(['debug', 'info', 'warning', 'error'] as LogLevel[]).map(level => (
                <DropdownMenuCheckboxItem
                  key={level}
                  checked={selectedLevels.has(level)}
                  onCheckedChange={() => handleToggleLevel(level)}
                >
                  <div className="flex items-center gap-2">
                    {getLogIcon(level)}
                    <span className="capitalize">{level}</span>
                    <Badge variant="outline" className="text-xs ml-auto">
                      {logCounts[level] || 0}
                    </Badge>
                  </div>
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 操作按钮 */}
          <div className="flex items-center gap-1">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="auto-scroll"
                checked={autoScroll}
                onCheckedChange={setAutoScroll}
              />
              <label htmlFor="auto-scroll" className="text-xs">
                {t('debug:logs.autoScroll')}
              </label>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExportLogs}
              className="h-8 gap-1"
              disabled={filteredLogs.length === 0}
            >
              <Download className="h-3 w-3" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearLogs}
              className="h-8 gap-1 text-destructive"
              disabled={logs.length === 0}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {t('debug:logs.showing', { 
              filtered: filteredLogs.length,
              total: logs.length 
            })}
          </span>
        </div>
      </div>

      {/* 日志列表 */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-8">
              <Terminal className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <div className="text-sm font-medium">
                {logs.length === 0 
                  ? t('debug:logs.noLogs')
                  : t('debug:logs.noMatches')
                }
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {t('debug:logs.noLogsDesc')}
              </div>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className={cn(
                  'rounded-md border p-2 transition-colors hover:bg-muted/30',
                  getLogColor(log.level)
                )}
              >
                {/* 日志头部 */}
                <div className="flex items-start gap-2">
                  {getLogIcon(log.level)}
                  
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-mono">
                      {log.message}
                    </div>
                    
                    {log.nodeId && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Node: {log.nodeId}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge 
                      variant={log.level === 'error' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {log.level.toUpperCase()}
                    </Badge>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyLog(log)}
                      className="h-6 w-6 p-0"
                      title={t('common:copy')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* 时间戳 */}
                <div className="text-xs text-muted-foreground mt-1 ml-6">
                  {new Date(log.timestamp).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* 底部统计 */}
      {logs.length > 0 && (
        <div className="p-2 border-t bg-muted/30">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {t('debug:logs.totalLogs', { count: logs.length })}
            </span>
            <div className="flex items-center gap-3">
              {Object.entries(logCounts).map(([level, count]) => (
                <div key={level} className="flex items-center gap-1">
                  {getLogIcon(level as LogLevel)}
                  <span>{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}