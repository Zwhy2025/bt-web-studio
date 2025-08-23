import React, { useState, useMemo, useCallback } from 'react';
import { cn } from '@/core/utils/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { 
  useAnalysisResult,
  useVisibleEvents,
  useReplaySession,
  useReplayActions
} from '@/core/store/behavior-tree-store';
import { useI18n } from '@/hooks/use-i18n';
import { 
  BarChart3,
  PieChart,
  TrendingUp,
  TrendingDown,
  Clock,
  Activity,
  Target,
  Zap,
  Download,
  RefreshCw,
  FileText,
  Settings,
  Eye,
  Filter,
  Gauge,
  LineChart,
  Users,
  AlertTriangle
} from 'lucide-react';

interface DataAnalysisPanelProps {
  activeTab?: 'analysis' | 'statistics';
  className?: string;
}

// 性能统计组件
function PerformanceStats() {
  const { t } = useI18n();
  const analysisResult = useAnalysisResult();
  const replaySession = useReplaySession();

  const stats = useMemo(() => {
    if (!analysisResult || !replaySession) {
      return {
        totalExecutionTime: 0,
        avgExecutionTime: 0,
        successRate: 0,
        failureRate: 0,
        mostActiveNode: null,
        slowestNode: null
      };
    }

    const { nodeStats, executionMetrics } = analysisResult;
    
    // 计算总执行时间
    const totalExecutionTime = replaySession.duration;
    
    // 计算平均执行时间
    const avgExecutionTime = nodeStats.reduce((sum, node) => sum + node.avgExecutionTime, 0) / nodeStats.length;
    
    // 计算成功率和失败率
    const totalExecutions = nodeStats.reduce((sum, node) => sum + node.executionCount, 0);
    const successfulExecutions = nodeStats.reduce((sum, node) => sum + node.successCount, 0);
    const successRate = totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0;
    const failureRate = 100 - successRate;
    
    // 找出最活跃的节点
    const mostActiveNode = nodeStats.reduce((max, node) => 
      node.executionCount > (max?.executionCount || 0) ? node : max, nodeStats[0]);
    
    // 找出最慢的节点
    const slowestNode = nodeStats.reduce((max, node) => 
      node.avgExecutionTime > (max?.avgExecutionTime || 0) ? node : max, nodeStats[0]);

    return {
      totalExecutionTime,
      avgExecutionTime,
      successRate,
      failureRate,
      mostActiveNode,
      slowestNode
    };
  }, [analysisResult, replaySession]);

  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(1)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div className="space-y-4">
      {/* 整体性能指标 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Gauge className="h-4 w-4" />
            {t('replay:analysis.performance.overall')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">{t('replay:analysis.performance.totalTime')}</div>
              <div className="font-medium">{formatTime(stats.totalExecutionTime)}</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">{t('replay:analysis.performance.avgTime')}</div>
              <div className="font-medium">{formatTime(stats.avgExecutionTime)}</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span>{t('replay:analysis.performance.successRate')}</span>
              <span className="font-medium text-green-600">{stats.successRate.toFixed(1)}%</span>
            </div>
            <Progress value={stats.successRate} className="h-2" />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span>{t('replay:analysis.performance.failureRate')}</span>
              <span className="font-medium text-red-600">{stats.failureRate.toFixed(1)}%</span>
            </div>
            <Progress value={stats.failureRate} className="h-2 [&>div]:bg-red-500" />
          </div>
        </CardContent>
      </Card>

      {/* 节点性能分析 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="h-4 w-4" />
            {t('replay:analysis.performance.nodeAnalysis')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {stats.mostActiveNode && (
            <div className="p-2 rounded-md bg-blue-50 border border-blue-200">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="h-3 w-3 text-blue-600" />
                <span className="text-xs font-medium text-blue-700">
                  {t('replay:analysis.performance.mostActive')}
                </span>
              </div>
              <div className="text-sm font-medium">{stats.mostActiveNode.nodeId}</div>
              <div className="text-xs text-muted-foreground">
                {stats.mostActiveNode.executionCount} {t('replay:analysis.performance.executions')}
              </div>
            </div>
          )}
          
          {stats.slowestNode && (
            <div className="p-2 rounded-md bg-yellow-50 border border-yellow-200">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-3 w-3 text-yellow-600" />
                <span className="text-xs font-medium text-yellow-700">
                  {t('replay:analysis.performance.slowest')}
                </span>
              </div>
              <div className="text-sm font-medium">{stats.slowestNode.nodeId}</div>
              <div className="text-xs text-muted-foreground">
                {formatTime(stats.slowestNode.avgExecutionTime)} {t('replay:analysis.performance.avgTime')}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// 热力图视图组件
function HeatmapView() {
  const { t } = useI18n();
  const analysisResult = useAnalysisResult();
  
  const heatmapData = useMemo(() => {
    if (!analysisResult) return [];
    
    return analysisResult.nodeStats
      .sort((a, b) => b.executionCount - a.executionCount)
      .slice(0, 20); // 显示前20个最活跃的节点
  }, [analysisResult]);

  const maxExecutionCount = useMemo(() => {
    return Math.max(...heatmapData.map(node => node.executionCount), 1);
  }, [heatmapData]);

  const getHeatColor = (count: number): string => {
    const intensity = count / maxExecutionCount;
    if (intensity > 0.8) return 'bg-red-500';
    if (intensity > 0.6) return 'bg-orange-500';
    if (intensity > 0.4) return 'bg-yellow-500';
    if (intensity > 0.2) return 'bg-blue-500';
    return 'bg-gray-300';
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          {t('replay:analysis.heatmap.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64">
          <div className="space-y-2">
            {heatmapData.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <div className="text-sm">{t('replay:analysis.heatmap.noData')}</div>
              </div>
            ) : (
              heatmapData.map((node, index) => (
                <div key={node.nodeId} className="flex items-center gap-2">
                  <div className="w-4 text-xs text-muted-foreground text-right">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div 
                        className={cn('w-3 h-3 rounded-sm', getHeatColor(node.executionCount))}
                        title={`${node.executionCount} executions`}
                      />
                      <span className="text-sm font-medium truncate">{node.nodeId}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{node.executionCount}</span>
                    <Badge 
                      variant={node.successRate > 0.8 ? 'default' : 'secondary'} 
                      className="text-xs"
                    >
                      {(node.successRate * 100).toFixed(0)}%
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// 统计视图组件
function StatisticsView() {
  const { t } = useI18n();
  const replayEvents = useReplayEvents();
  const replaySession = useReplaySession();

  const statistics = useMemo(() => {
    if (!replaySession || replayEvents.length === 0) {
      return {
        totalEvents: 0,
        eventsByType: {},
        eventsByLevel: {},
        timeRange: { start: 0, end: 0 },
        eventsPerSecond: 0
      };
    }

    const eventsByType = replayEvents.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const eventsByLevel = replayEvents.reduce((acc, event) => {
      acc[event.level] = (acc[event.level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const sortedEvents = [...replayEvents].sort((a, b) => a.timestamp - b.timestamp);
    const timeRange = {
      start: sortedEvents[0]?.timestamp || 0,
      end: sortedEvents[sortedEvents.length - 1]?.timestamp || 0
    };

    const durationSeconds = (timeRange.end - timeRange.start) / 1000;
    const eventsPerSecond = durationSeconds > 0 ? replayEvents.length / durationSeconds : 0;

    return {
      totalEvents: replayEvents.length,
      eventsByType,
      eventsByLevel,
      timeRange,
      eventsPerSecond
    };
  }, [replayEvents, replaySession]);

  return (
    <div className="space-y-4">
      {/* 整体统计 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            {t('replay:analysis.statistics.overview')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-2 rounded-md bg-muted/30">
              <div className="text-lg font-bold">{statistics.totalEvents}</div>
              <div className="text-xs text-muted-foreground">{t('replay:analysis.statistics.totalEvents')}</div>
            </div>
            <div className="text-center p-2 rounded-md bg-muted/30">
              <div className="text-lg font-bold">{statistics.eventsPerSecond.toFixed(1)}</div>
              <div className="text-xs text-muted-foreground">{t('replay:analysis.statistics.eventsPerSecond')}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 按类型分布 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">{t('replay:analysis.statistics.byType')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(statistics.eventsByType).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <span className="text-sm">{t(`replay:events.types.${type}`)}</span>
                <div className="flex items-center gap-2">
                  <Progress 
                    value={(count / statistics.totalEvents) * 100} 
                    className="w-16 h-2" 
                  />
                  <span className="text-xs text-muted-foreground w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 按级别分布 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">{t('replay:analysis.statistics.byLevel')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(statistics.eventsByLevel).map(([level, count]) => (
              <div key={level} className="flex items-center justify-between">
                <span className="text-sm capitalize">{level}</span>
                <div className="flex items-center gap-2">
                  <Progress 
                    value={(count / statistics.totalEvents) * 100} 
                    className="w-16 h-2"
                  />
                  <span className="text-xs text-muted-foreground w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// 导出选项组件
function ExportOptions() {
  const { t } = useI18n();
  const replayActions = useReplayActions();

  const handleExport = useCallback((format: 'json' | 'csv' | 'pdf') => {
    replayActions.exportAnalysisData(format);
  }, [replayActions]);

  return (
    <div className="p-3 border-t space-y-2">
      <div className="text-xs font-medium text-muted-foreground mb-2">
        {t('replay:analysis.export.title')}
      </div>
      
      <div className="flex gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleExport('json')}
          className="h-7 text-xs"
        >
          <Download className="h-3 w-3 mr-1" />
          JSON
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleExport('csv')}
          className="h-7 text-xs"
        >
          <FileText className="h-3 w-3 mr-1" />
          CSV
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleExport('pdf')}
          className="h-7 text-xs"
        >
          <FileText className="h-3 w-3 mr-1" />
          PDF
        </Button>
      </div>
    </div>
  );
}

// 主数据分析面板组件
export default function DataAnalysisPanel({ 
  activeTab = 'analysis',
  className 
}: DataAnalysisPanelProps) {
  const { t } = useI18n();
  const replayActions = useReplayActions();

  const handleRefreshAnalysis = useCallback(() => {
    replayActions.refreshAnalysis();
  }, [replayActions]);

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* 顶部操作栏 */}
      <div className="flex items-center justify-between p-2 border-b">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          <span className="text-sm font-medium">{t('replay:analysis.title')}</span>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefreshAnalysis}
          className="h-7 w-7 p-0"
          title={t('replay:analysis.refresh')}
        >
          <RefreshCw className="h-3 w-3" />
        </Button>
      </div>

      {/* 分析内容 */}
      <div className="flex-1 min-h-0">
        <Tabs value={activeTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-2 mx-2 mt-2">
            <TabsTrigger value="analysis" className="text-xs">
              {t('replay:analysis.tabs.analysis')}
            </TabsTrigger>
            <TabsTrigger value="statistics" className="text-xs">
              {t('replay:analysis.tabs.statistics')}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="analysis" className="flex-1 mt-2">
            <ScrollArea className="h-full">
              <div className="p-2 space-y-4">
                <PerformanceStats />
                <HeatmapView />
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="statistics" className="flex-1 mt-2">
            <ScrollArea className="h-full">
              <div className="p-2">
                <StatisticsView />
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>

      {/* 导出选项 */}
      <ExportOptions />
    </div>
  );
}