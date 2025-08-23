import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Settings, 
  Zap, 
  MemoryStick, 
  Activity,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Clock,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/core/utils/utils';
import { useMemoryOptimization, useMemoryMonitor, type MemoryStats } from '@/core/utils/memory-optimization';
import { usePerformanceMonitor } from '@/components/monitoring/performance-monitor';

interface OptimizationSettings {
  autoCleanup: boolean;
  memoryMonitoring: boolean;
  performanceTracking: boolean;
  compressionEnabled: boolean;
  cleanupInterval: number;
}

const DEFAULT_SETTINGS: OptimizationSettings = {
  autoCleanup: true,
  memoryMonitoring: true,
  performanceTracking: true,
  compressionEnabled: true,
  cleanupInterval: 30000
};

// 性能状态指示器
function PerformanceStatus({ memoryInfo, memoryStats }: { 
  memoryInfo: any, 
  memoryStats: MemoryStats | null 
}) {
  const getMemoryStatus = () => {
    if (!memoryInfo) return { status: 'unknown', color: 'gray' };
    
    if (memoryInfo.usage > 85) return { status: '危险', color: 'red' };
    if (memoryInfo.usage > 70) return { status: '警告', color: 'yellow' };
    return { status: '正常', color: 'green' };
  };

  const memStatus = getMemoryStatus();
  
  const formatBytes = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)}MB`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <MemoryStick className="h-4 w-4" />
            <span className="text-sm font-medium">系统内存</span>
          </div>
          {memoryInfo ? (
            <div>
              <div className="flex items-center gap-2">
                <Badge 
                  variant={memStatus.status === '正常' ? 'default' : 'destructive'}
                  className="text-xs"
                >
                  {memStatus.status}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {memoryInfo.usage}%
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {formatBytes(memoryInfo.used)} / {formatBytes(memoryInfo.total)}
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">不可用</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-4 w-4" />
            <span className="text-sm font-medium">应用状态</span>
          </div>
          {memoryStats ? (
            <div>
              <div className="text-sm">
                总大小: {formatBytes(memoryStats.totalSize)}
              </div>
              <div className="text-xs text-muted-foreground">
                压缩: {memoryStats.compressedStates} 项
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">加载中...</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-medium">最近清理</span>
          </div>
          {memoryStats ? (
            <div className="text-sm">
              {new Date(memoryStats.lastCleanup).toLocaleTimeString()}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">无记录</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// 优化建议组件
function OptimizationRecommendations({ recommendations }: { recommendations: string[] }) {
  if (recommendations.length === 0) {
    return (
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          当前性能状态良好，无需优化。
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium flex items-center gap-2">
        <TrendingUp className="h-4 w-4" />
        优化建议
      </h4>
      {recommendations.map((recommendation, index) => (
        <Alert key={index}>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{recommendation}</AlertDescription>
        </Alert>
      ))}
    </div>
  );
}

// 设置面板组件
function SettingsPanel({ 
  settings, 
  onSettingsChange 
}: { 
  settings: OptimizationSettings,
  onSettingsChange: (settings: OptimizationSettings) => void 
}) {
  const handleToggle = (key: keyof OptimizationSettings) => {
    onSettingsChange({
      ...settings,
      [key]: !settings[key]
    });
  };

  const handleIntervalChange = (interval: number) => {
    onSettingsChange({
      ...settings,
      cleanupInterval: interval
    });
  };

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium">优化设置</h4>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">自动清理</div>
            <div className="text-xs text-muted-foreground">定期清理无用数据</div>
          </div>
          <Switch 
            checked={settings.autoCleanup}
            onCheckedChange={() => handleToggle('autoCleanup')}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">内存监控</div>
            <div className="text-xs text-muted-foreground">实时监控内存使用</div>
          </div>
          <Switch 
            checked={settings.memoryMonitoring}
            onCheckedChange={() => handleToggle('memoryMonitoring')}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">性能追踪</div>
            <div className="text-xs text-muted-foreground">追踪渲染和操作性能</div>
          </div>
          <Switch 
            checked={settings.performanceTracking}
            onCheckedChange={() => handleToggle('performanceTracking')}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">状态压缩</div>
            <div className="text-xs text-muted-foreground">压缩大型状态对象</div>
          </div>
          <Switch 
            checked={settings.compressionEnabled}
            onCheckedChange={() => handleToggle('compressionEnabled')}
          />
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">清理间隔</div>
          <div className="flex gap-2">
            {[15000, 30000, 60000, 120000].map((interval) => (
              <Button
                key={interval}
                variant={settings.cleanupInterval === interval ? "default" : "outline"}
                size="sm"
                onClick={() => handleIntervalChange(interval)}
                className="text-xs"
              >
                {interval / 1000}s
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// 主性能优化组件
export default function PerformanceOptimizer() {
  const [settings, setSettings] = useState<OptimizationSettings>(DEFAULT_SETTINGS);
  const [isActive, setIsActive] = useState(true);
  
  // 使用内存优化钩子
  const { 
    performCleanup, 
    getMemoryStats, 
    getRecommendations,
    configureOptimization
  } = useMemoryOptimization();
  
  // 使用内存监控钩子
  const { memoryInfo, startMonitoring, stopMonitoring } = useMemoryMonitor();
  
  // 使用性能监控钩子
  const { isMonitoring, startMonitoring: startPerfMonitoring, stopMonitoring: stopPerfMonitoring } = usePerformanceMonitor();
  
  // 状态
  const [memoryStats, setMemoryStats] = useState<MemoryStats | null>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);

  // 更新统计信息
  const updateStats = useCallback(() => {
    const stats = getMemoryStats();
    const recs = getRecommendations();
    setMemoryStats(stats);
    setRecommendations(recs);
  }, [getMemoryStats, getRecommendations]);

  // 手动优化
  const handleOptimize = useCallback(async () => {
    setIsOptimizing(true);
    try {
      await performCleanup();
      updateStats();
    } finally {
      setIsOptimizing(false);
    }
  }, [performCleanup, updateStats]);

  // 设置变更
  const handleSettingsChange = useCallback((newSettings: OptimizationSettings) => {
    setSettings(newSettings);
    
    // 重新配置优化器
    configureOptimization({
      autoCleanup: {
        enabled: newSettings.autoCleanup,
        interval: newSettings.cleanupInterval,
        maxHistorySize: 100,
        maxCacheSize: 50 * 1024 * 1024
      },
      stateCompression: {
        enabled: newSettings.compressionEnabled,
        compressionThreshold: 1024 * 1024,
        maxUncompressedStates: 10
      },
      memoryMonitoring: {
        enabled: newSettings.memoryMonitoring,
        warningThreshold: 70,
        criticalThreshold: 85
      }
    });
  }, [configureOptimization]);

  // 切换激活状态
  const handleToggleActive = useCallback(() => {
    setIsActive(!isActive);
    
    if (!isActive) {
      // 启动监控
      if (settings.memoryMonitoring) {
        startMonitoring(5000);
      }
      if (settings.performanceTracking) {
        startPerfMonitoring();
      }
    } else {
      // 停止监控
      stopMonitoring();
      stopPerfMonitoring();
    }
  }, [isActive, settings, startMonitoring, stopMonitoring, startPerfMonitoring, stopPerfMonitoring]);

  // 初始化
  useEffect(() => {
    if (isActive) {
      if (settings.memoryMonitoring) {
        startMonitoring(5000);
      }
      if (settings.performanceTracking) {
        startPerfMonitoring();
      }
      updateStats();
    }
    
    return () => {
      stopMonitoring();
      stopPerfMonitoring();
    };
  }, [isActive, settings.memoryMonitoring, settings.performanceTracking]);

  // 定期更新统计
  useEffect(() => {
    if (!isActive) return;
    
    const interval = setInterval(updateStats, 10000); // 每10秒更新一次
    return () => clearInterval(interval);
  }, [isActive, updateStats]);

  if (!isActive) {
    return (
      <Card className="m-4">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">性能优化已停用</span>
          </div>
          <Button variant="outline" size="sm" onClick={handleToggleActive}>
            启用优化
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Zap className="h-5 w-5" />
          性能优化中心
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleOptimize}
            disabled={isOptimizing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", isOptimizing && "animate-spin")} />
            立即优化
          </Button>
          <Button variant="outline" size="sm" onClick={handleToggleActive}>
            停用优化
          </Button>
        </div>
      </div>

      <PerformanceStatus memoryInfo={memoryInfo} memoryStats={memoryStats} />

      <Tabs defaultValue="recommendations" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="recommendations">优化建议</TabsTrigger>
          <TabsTrigger value="settings">设置</TabsTrigger>
        </TabsList>

        <TabsContent value="recommendations" className="space-y-4">
          <OptimizationRecommendations recommendations={recommendations} />
          
          {memoryStats && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">详细统计</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>状态大小:</span>
                  <span className="font-mono">{(memoryStats.stateSize / (1024 * 1024)).toFixed(2)} MB</span>
                </div>
                <div className="flex justify-between">
                  <span>历史记录:</span>
                  <span className="font-mono">{(memoryStats.historySize / (1024 * 1024)).toFixed(2)} MB</span>
                </div>
                <div className="flex justify-between">
                  <span>缓存大小:</span>
                  <span className="font-mono">{(memoryStats.cacheSize / (1024 * 1024)).toFixed(2)} MB</span>
                </div>
                <div className="flex justify-between">
                  <span>压缩状态:</span>
                  <span className="font-mono">{memoryStats.compressedStates} 项</span>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardContent className="p-4">
              <SettingsPanel
                settings={settings}
                onSettingsChange={handleSettingsChange}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}