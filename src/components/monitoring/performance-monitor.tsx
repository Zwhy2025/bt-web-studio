import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  MemoryStick, 
  Clock, 
  Zap, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Download,
  BarChart3
} from 'lucide-react';
import { cn } from '@/core/utils/utils';
import { useWorkflowMode } from '@/core/store/behavior-tree-store';
import { performanceUtils } from '@/core/utils/performance-utils';

interface PerformanceMetrics {
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  rendering: {
    fps: number;
    frameTime: number;
    dropCount: number;
  };
  modeSwitch: {
    lastSwitchTime: number;
    averageSwitchTime: number;
    switchCount: number;
  };
  store: {
    stateSize: number;
    updateCount: number;
    renderCount: number;
  };
}

interface PerformanceAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  timestamp: number;
}

// 性能度量收集器
class PerformanceCollector {
  private metrics: PerformanceMetrics;
  private alerts: PerformanceAlert[] = [];
  private observers: ((metrics: PerformanceMetrics) => void)[] = [];
  private frameCount = 0;
  private lastFrameTime = performance.now();
  private renderObserver?: PerformanceObserver;

  constructor() {
    this.metrics = {
      memory: { used: 0, total: 0, percentage: 0 },
      rendering: { fps: 60, frameTime: 16.67, dropCount: 0 },
      modeSwitch: { lastSwitchTime: 0, averageSwitchTime: 0, switchCount: 0 },
      store: { stateSize: 0, updateCount: 0, renderCount: 0 }
    };

    this.startMonitoring();
  }

  private startMonitoring() {
    // 监控渲染性能
    this.measureRenderingPerformance();
    
    // 监控内存使用
    setInterval(() => {
      this.measureMemoryUsage();
    }, 5000);

    // 监控性能条目
    if ('PerformanceObserver' in window) {
      this.renderObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.processPerformanceEntry(entry);
        }
      });

      try {
        this.renderObserver.observe({ entryTypes: ['measure', 'navigation', 'resource'] });
      } catch (e) {
        console.warn('PerformanceObserver not supported for some entry types');
      }
    }
  }

  private measureRenderingPerformance() {
    const measureFrame = () => {
      const currentTime = performance.now();
      const frameTime = currentTime - this.lastFrameTime;
      
      this.frameCount++;
      this.metrics.rendering.frameTime = frameTime;
      this.metrics.rendering.fps = Math.round(1000 / frameTime);
      
      // 检测掉帧
      if (frameTime > 33.33) { // > 30fps
        this.metrics.rendering.dropCount++;
        this.addAlert('warning', `检测到掉帧: ${frameTime.toFixed(2)}ms`);
      }
      
      this.lastFrameTime = currentTime;
      this.notifyObservers();
      
      requestAnimationFrame(measureFrame);
    };
    
    requestAnimationFrame(measureFrame);
  }

  private measureMemoryUsage() {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.metrics.memory = {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        percentage: Math.round((memory.usedJSHeapSize / memory.totalJSHeapSize) * 100)
      };

      // 内存使用警告
      if (this.metrics.memory.percentage > 80) {
        this.addAlert('warning', `内存使用过高: ${this.metrics.memory.percentage}%`);
      }
      
      this.notifyObservers();
    }
  }

  private processPerformanceEntry(entry: PerformanceEntry) {
    if (entry.name.includes('mode-switch')) {
      this.metrics.modeSwitch.lastSwitchTime = entry.duration;
      this.metrics.modeSwitch.switchCount++;
      
      // 计算平均切换时间
      const total = this.metrics.modeSwitch.averageSwitchTime * (this.metrics.modeSwitch.switchCount - 1);
      this.metrics.modeSwitch.averageSwitchTime = (total + entry.duration) / this.metrics.modeSwitch.switchCount;
      
      // 模式切换性能警告
      if (entry.duration > 500) {
        this.addAlert('warning', `模式切换耗时过长: ${entry.duration.toFixed(2)}ms`);
      }
    }
  }

  private addAlert(type: PerformanceAlert['type'], message: string) {
    const alert: PerformanceAlert = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      message,
      timestamp: Date.now()
    };
    
    this.alerts.unshift(alert);
    
    // 保持最近50条警告
    if (this.alerts.length > 50) {
      this.alerts = this.alerts.slice(0, 50);
    }
  }

  subscribe(callback: (metrics: PerformanceMetrics) => void) {
    this.observers.push(callback);
    return () => {
      this.observers = this.observers.filter(obs => obs !== callback);
    };
  }

  private notifyObservers() {
    this.observers.forEach(callback => callback(this.metrics));
  }

  getMetrics() {
    return this.metrics;
  }

  getAlerts() {
    return this.alerts;
  }

  clearAlerts() {
    this.alerts = [];
  }

  exportReport() {
    const report = {
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      alerts: this.alerts,
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { 
      type: 'application/json' 
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-report-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  cleanup() {
    if (this.renderObserver) {
      this.renderObserver.disconnect();
    }
  }
}

// 全局性能收集器实例
const performanceCollector = new PerformanceCollector();

// 内存使用图表组件
function MemoryChart({ metrics }: { metrics: PerformanceMetrics }) {
  const formatBytes = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <MemoryStick className="h-4 w-4" />
          内存使用情况
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between text-sm">
          <span>已使用</span>
          <span className="font-mono">{formatBytes(metrics.memory.used)}</span>
        </div>
        <Progress value={metrics.memory.percentage} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{metrics.memory.percentage}%</span>
          <span>总计: {formatBytes(metrics.memory.total)}</span>
        </div>
        
        {metrics.memory.percentage > 80 && (
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs">
            <AlertTriangle className="h-3 w-3" />
            内存使用率过高
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// 渲染性能图表组件
function RenderingChart({ metrics }: { metrics: PerformanceMetrics }) {
  const getFpsStatus = (fps: number) => {
    if (fps >= 55) return { color: 'text-green-600', status: '流畅' };
    if (fps >= 30) return { color: 'text-yellow-600', status: '一般' };
    return { color: 'text-red-600', status: '卡顿' };
  };

  const fpsStatus = getFpsStatus(metrics.rendering.fps);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Activity className="h-4 w-4" />
          渲染性能
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className={cn('text-2xl font-bold', fpsStatus.color)}>
              {metrics.rendering.fps}
            </div>
            <div className="text-xs text-muted-foreground">FPS</div>
            <Badge variant="outline" className={cn('text-xs mt-1', fpsStatus.color)}>
              {fpsStatus.status}
            </Badge>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">
              {metrics.rendering.frameTime.toFixed(1)}
            </div>
            <div className="text-xs text-muted-foreground">帧时间 (ms)</div>
          </div>
        </div>
        
        {metrics.rendering.dropCount > 0 && (
          <div className="text-xs text-amber-600 dark:text-amber-400">
            检测到 {metrics.rendering.dropCount} 次掉帧
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// 模式切换性能组件
function ModeSwitchChart({ metrics }: { metrics: PerformanceMetrics }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Zap className="h-4 w-4" />
          模式切换性能
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-lg font-bold">
              {metrics.modeSwitch.lastSwitchTime.toFixed(0)}ms
            </div>
            <div className="text-xs text-muted-foreground">最近切换</div>
          </div>
          <div>
            <div className="text-lg font-bold">
              {metrics.modeSwitch.averageSwitchTime.toFixed(0)}ms
            </div>
            <div className="text-xs text-muted-foreground">平均耗时</div>
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-sm text-muted-foreground">
            总切换次数: {metrics.modeSwitch.switchCount}
          </div>
        </div>

        {metrics.modeSwitch.averageSwitchTime > 300 && (
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs">
            <AlertTriangle className="h-3 w-3" />
            模式切换耗时较长
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// 性能警告列表组件
function PerformanceAlerts({ alerts, onClear }: { 
  alerts: PerformanceAlert[], 
  onClear: () => void 
}) {
  const getAlertIcon = (type: PerformanceAlert['type']) => {
    switch (type) {
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'info': return <CheckCircle className="h-4 w-4 text-blue-500" />;
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            性能警告 ({alerts.length})
          </div>
          {alerts.length > 0 && (
            <Button variant="ghost" size="sm" onClick={onClear}>
              清除
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-4">
            暂无性能警告
          </div>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex items-start gap-2 text-sm">
                {getAlertIcon(alert.type)}
                <div className="flex-1">
                  <div>{alert.message}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatTime(alert.timestamp)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// 主性能监控组件
export default function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>(performanceCollector.getMetrics());
  const [alerts, setAlerts] = useState<PerformanceAlert[]>(performanceCollector.getAlerts());
  const [isEnabled, setIsEnabled] = useState(true);
  const currentMode = useWorkflowMode();

  useEffect(() => {
    if (!isEnabled) return;

    const unsubscribe = performanceCollector.subscribe((newMetrics) => {
      setMetrics(newMetrics);
      setAlerts(performanceCollector.getAlerts());
    });

    return unsubscribe;
  }, [isEnabled]);

  useEffect(() => {
    // 监控模式切换性能
    const startTime = performance.now();
    performance.mark('mode-switch-start');
    
    return () => {
      performance.mark('mode-switch-end');
      performance.measure(
        'mode-switch', 
        'mode-switch-start', 
        'mode-switch-end'
      );
    };
  }, [currentMode]);

  const handleClearAlerts = useCallback(() => {
    performanceCollector.clearAlerts();
    setAlerts([]);
  }, []);

  const handleExportReport = useCallback(() => {
    performanceCollector.exportReport();
  }, []);

  const handleToggleMonitoring = useCallback(() => {
    setIsEnabled(!isEnabled);
  }, [isEnabled]);

  useEffect(() => {
    return () => {
      performanceCollector.cleanup();
    };
  }, []);

  if (!isEnabled) {
    return (
      <Card className="m-4">
        <CardContent className="flex items-center justify-between p-4">
          <span className="text-sm text-muted-foreground">性能监控已关闭</span>
          <Button variant="outline" size="sm" onClick={handleToggleMonitoring}>
            <Activity className="h-4 w-4 mr-2" />
            启用监控
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          性能监控仪表盘
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportReport}>
            <Download className="h-4 w-4 mr-2" />
            导出报告
          </Button>
          <Button variant="outline" size="sm" onClick={handleToggleMonitoring}>
            <RefreshCw className="h-4 w-4 mr-2" />
            关闭监控
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">概览</TabsTrigger>
          <TabsTrigger value="details">详细指标</TabsTrigger>
          <TabsTrigger value="alerts">警告日志</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <MemoryChart metrics={metrics} />
            <RenderingChart metrics={metrics} />
            <ModeSwitchChart metrics={metrics} />
          </div>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">详细内存信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm font-mono">
                <div className="flex justify-between">
                  <span>JS堆已使用:</span>
                  <span>{(metrics.memory.used / (1024 * 1024)).toFixed(2)} MB</span>
                </div>
                <div className="flex justify-between">
                  <span>JS堆总计:</span>
                  <span>{(metrics.memory.total / (1024 * 1024)).toFixed(2)} MB</span>
                </div>
                <div className="flex justify-between">
                  <span>使用率:</span>
                  <span>{metrics.memory.percentage}%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">详细渲染信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm font-mono">
                <div className="flex justify-between">
                  <span>当前FPS:</span>
                  <span>{metrics.rendering.fps}</span>
                </div>
                <div className="flex justify-between">
                  <span>帧时间:</span>
                  <span>{metrics.rendering.frameTime.toFixed(2)} ms</span>
                </div>
                <div className="flex justify-between">
                  <span>掉帧次数:</span>
                  <span>{metrics.rendering.dropCount}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts">
          <PerformanceAlerts alerts={alerts} onClear={handleClearAlerts} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// 轻量级性能监控钩子
export function usePerformanceMonitor() {
  const [isMonitoring, setIsMonitoring] = useState(false);
  
  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
  }, []);
  
  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
  }, []);
  
  const getMetrics = useCallback(() => {
    return performanceCollector.getMetrics();
  }, []);
  
  return {
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    getMetrics
  };
}