import React, { useState, useEffect } from 'react';
import { cn } from '@/core/utils/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  useDebugSession,
  useExecutionStatus,
  useCallStack
} from '@/core/store/behavior-tree-store';
import { useI18n } from '@/hooks/use-i18n';
import { 
  Monitor,
  Activity,
  Clock,
  MemoryStick,
  Cpu,
  Database,
  Zap,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Pause,
  Play,
  RotateCcw
} from 'lucide-react';

interface StateMonitorPanelProps {
  className?: string;
}

// 模拟性能数据
interface PerformanceData {
  cpuUsage: number;
  memoryUsage: number;
  executionTime: number;
  nodeCount: number;
  executionCount: number;
}

// 模拟黑板数据
interface BlackboardEntry {
  key: string;
  value: any;
  type: string;
  lastUpdated: number;
}

export default function StateMonitorPanel({ className }: StateMonitorPanelProps) {
  const { t } = useI18n();
  const debugSession = useDebugSession();
  const executionStatus = useExecutionStatus();
  const callStack = useCallStack();

  // 模拟实时数据
  const [performanceData, setPerformanceData] = useState<PerformanceData>({
    cpuUsage: 0,
    memoryUsage: 0,
    executionTime: 0,
    nodeCount: 0,
    executionCount: 0
  });

  const [blackboardData, setBlackboardData] = useState<BlackboardEntry[]>([
    { key: 'player.health', value: 100, type: 'number', lastUpdated: Date.now() },
    { key: 'enemy.position', value: { x: 10, y: 20 }, type: 'object', lastUpdated: Date.now() },
    { key: 'game.state', value: 'playing', type: 'string', lastUpdated: Date.now() },
    { key: 'ai.target', value: 'player', type: 'string', lastUpdated: Date.now() - 5000 },
  ]);

  // 模拟实时数据更新
  useEffect(() => {
    if (executionStatus === 'running') {
      const interval = setInterval(() => {
        setPerformanceData(prev => ({
          cpuUsage: Math.min(100, prev.cpuUsage + (Math.random() - 0.5) * 10),
          memoryUsage: Math.min(100, prev.memoryUsage + (Math.random() - 0.5) * 5),
          executionTime: prev.executionTime + 16,
          nodeCount: prev.nodeCount + Math.floor(Math.random() * 3),
          executionCount: prev.executionCount + 1
        }));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [executionStatus]);

  const formatValue = (value: any, type: string): string => {
    switch (type) {
      case 'object':
        return JSON.stringify(value);
      case 'boolean':
        return value ? 'true' : 'false';
      case 'number':
        return typeof value === 'number' ? value.toFixed(2) : String(value);
      default:
        return String(value);
    }
  };

  const getValueColor = (type: string) => {
    switch (type) {
      case 'number': return 'text-blue-600';
      case 'string': return 'text-green-600';
      case 'boolean': return 'text-purple-600';
      case 'object': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <Tabs defaultValue="performance" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3 h-8">
          <TabsTrigger value="performance" className="text-xs">
            {t('debug:monitor.performance')}
          </TabsTrigger>
          <TabsTrigger value="blackboard" className="text-xs">
            {t('debug:monitor.blackboard')}
          </TabsTrigger>
          <TabsTrigger value="callstack" className="text-xs">
            {t('debug:monitor.callStack')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="flex-1 mt-2">
          <ScrollArea className="h-full">
            <div className="p-3 space-y-4">
              {/* 执行状态 */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  {t('debug:monitor.executionStatus')}
                </h4>
                <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                  {executionStatus === 'running' ? (
                    <Play className="h-4 w-4 text-green-500" />
                  ) : executionStatus === 'paused' ? (
                    <Pause className="h-4 w-4 text-yellow-500" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-blue-500" />
                  )}
                  <span className="text-sm font-medium">
                    {t(`debug:status.${executionStatus}`)}
                  </span>
                </div>
              </div>

              {/* 性能指标 */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  {t('debug:monitor.metrics')}
                </h4>
                
                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="flex items-center gap-1">
                        <Cpu className="h-3 w-3" />
                        {t('debug:monitor.cpuUsage')}
                      </span>
                      <span>{performanceData.cpuUsage.toFixed(1)}%</span>
                    </div>
                    <Progress value={performanceData.cpuUsage} className="h-2" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="flex items-center gap-1">
                        <MemoryStick className="h-3 w-3" />
                        {t('debug:monitor.memoryUsage')}
                      </span>
                      <span>{performanceData.memoryUsage.toFixed(1)}%</span>
                    </div>
                    <Progress value={performanceData.memoryUsage} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded bg-muted/50">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {t('debug:monitor.executionTime')}
                      </div>
                      <div className="font-medium">{performanceData.executionTime}ms</div>
                    </div>
                    <div className="p-2 rounded bg-muted/50">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Target className="h-3 w-3" />
                        {t('debug:monitor.nodeCount')}
                      </div>
                      <div className="font-medium">{performanceData.nodeCount}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="blackboard" className="flex-1 mt-2">
          <ScrollArea className="h-full">
            <div className="p-2 space-y-1">
              {blackboardData.length === 0 ? (
                <div className="text-center py-8">
                  <Database className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <div className="text-sm font-medium">{t('debug:monitor.noBlackboardData')}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {t('debug:monitor.noBlackboardDataDesc')}
                  </div>
                </div>
              ) : (
                blackboardData.map((entry, index) => (
                  <div
                    key={entry.key}
                    className="flex items-center justify-between p-2 rounded-md border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{entry.key}</div>
                      <div className={cn('text-xs truncate', getValueColor(entry.type))}>
                        {formatValue(entry.value, entry.type)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant="outline" className="text-xs">
                        {entry.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(entry.lastUpdated).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="callstack" className="flex-1 mt-2">
          <ScrollArea className="h-full">
            <div className="p-2 space-y-1">
              {callStack.length === 0 ? (
                <div className="text-center py-8">
                  <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <div className="text-sm font-medium">{t('debug:monitor.noCallStack')}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {t('debug:monitor.noCallStackDesc')}
                  </div>
                </div>
              ) : (
                callStack.map((frame, index) => (
                  <div
                    key={frame.id}
                    className="flex items-center gap-2 p-2 rounded-md border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <Badge variant={index === 0 ? "default" : "secondary"} className="text-xs">
                      {frame.level}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{frame.functionName}</div>
                      <div className="text-xs text-muted-foreground truncate">{frame.nodeId}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(frame.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}