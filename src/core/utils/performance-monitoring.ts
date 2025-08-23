import { useCallback, useEffect, useRef, useState } from 'react';
import { 
  useBehaviorTreeStore,
  useWorkflowMode,
  useComposerActions,
  useDebugActions,
  useReplayActions
} from '@/core/store/behavior-tree-store';
import { PerformanceMonitor, MemoryOptimizer, BatchUpdater } from './performance-utils';
import { getMemoryCleaner, useMemoryMonitor } from './memory-optimization';

// 性能监控配置
interface PerformanceMonitoringConfig {
  // 内存监控配置
  memory: {
    enabled: boolean;
    warningThreshold: number; // 内存警告阈值(%)
    criticalThreshold: number; // 内存临界阈值(%)
    cleanupInterval: number; // 自动清理间隔(ms)
  };
  
  // 渲染性能监控配置
  rendering: {
    enabled: boolean;
    fpsWarningThreshold: number; // FPS警告阈值
    frameTimeWarningThreshold: number; // 帧时间警告阈值(ms)
    dropFrameThreshold: number; // 掉帧检测阈值(ms)
  };
  
  // 状态更新监控配置
  state: {
    enabled: boolean;
    updateWarningThreshold: number; // 状态更新警告阈值(ms)
    largeStateThreshold: number; // 大型状态警告阈值(字节)
  };
  
  // 模式切换监控配置
  modeSwitch: {
    enabled: boolean;
    switchWarningThreshold: number; // 模式切换警告阈值(ms)
  };
}

// 默认配置
const DEFAULT_CONFIG: PerformanceMonitoringConfig = {
  memory: {
    enabled: true,
    warningThreshold: 75,
    criticalThreshold: 90,
    cleanupInterval: 30000
  },
  rendering: {
    enabled: true,
    fpsWarningThreshold: 30,
    frameTimeWarningThreshold: 33.33,
    dropFrameThreshold: 50
  },
  state: {
    enabled: true,
    updateWarningThreshold: 10,
    largeStateThreshold: 5 * 1024 * 1024 // 5MB
  },
  modeSwitch: {
    enabled: true,
    switchWarningThreshold: 500
  }
};

// 性能指标
interface PerformanceMetrics {
  // 内存指标
  memory: {
    used: number;
    total: number;
    percentage: number;
    status: 'normal' | 'warning' | 'critical';
  };
  
  // 渲染指标
  rendering: {
    fps: number;
    frameTime: number;
    dropCount: number;
    status: 'smooth' | 'degraded' | 'poor';
  };
  
  // 状态指标
  state: {
    size: number;
    updateCount: number;
    lastUpdateTime: number;
    status: 'normal' | 'slow' | 'large';
  };
  
  // 模式切换指标
  modeSwitch: {
    lastSwitchTime: number;
    averageSwitchTime: number;
    switchCount: number;
    status: 'fast' | 'moderate' | 'slow';
  };
}

// 性能警告
interface PerformanceWarning {
  id: string;
  type: 'memory' | 'rendering' | 'state' | 'modeSwitch';
  level: 'info' | 'warning' | 'error';
  message: string;
  timestamp: number;
  metrics?: any;
}

// 性能监控器类
class IntegratedPerformanceMonitor {
  private config: PerformanceMonitoringConfig;
  private metrics: PerformanceMetrics;
  private warnings: PerformanceWarning[] = [];
  private observers: ((metrics: PerformanceMetrics, warnings: PerformanceWarning[]) => void)[] = [];
  private frameCount = 0;
  private lastFrameTime = performance.now();
  private renderObserver?: PerformanceObserver;
  private memoryCleaner = getMemoryCleaner();
  private cleanupTimer?: NodeJS.Timeout;
  
  constructor(config: PerformanceMonitoringConfig = DEFAULT_CONFIG) {
    this.config = config;
    this.metrics = {
      memory: { used: 0, total: 0, percentage: 0, status: 'normal' },
      rendering: { fps: 60, frameTime: 16.67, dropCount: 0, status: 'smooth' },
      state: { size: 0, updateCount: 0, lastUpdateTime: 0, status: 'normal' },
      modeSwitch: { lastSwitchTime: 0, averageSwitchTime: 0, switchCount: 0, status: 'fast' }
    };
    
    this.startMonitoring();
  }
  
  // 启动监控
  private startMonitoring() {
    // 启动内存监控
    if (this.config.memory.enabled) {
      this.startMemoryMonitoring();
    }
    
    // 启动渲染性能监控
    if (this.config.rendering.enabled) {
      this.startRenderingMonitoring();
    }
    
    // 启动状态更新监控
    if (this.config.state.enabled) {
      this.startStateMonitoring();
    }
    
    // 启动自动清理
    this.startAutoCleanup();
  }
  
  // 启动内存监控
  private startMemoryMonitoring() {
    const updateMemoryInfo = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const percentage = Math.round((memory.usedJSHeapSize / memory.totalJSHeapSize) * 100);
        
        this.metrics.memory = {
          used: memory.usedJSHeapSize,
          total: memory.totalJSHeapSize,
          percentage,
          status: percentage > this.config.memory.criticalThreshold ? 'critical' :
                  percentage > this.config.memory.warningThreshold ? 'warning' : 'normal'
        };
        
        // 检查内存警告
        if (percentage > this.config.memory.criticalThreshold) {
          this.addWarning('memory', 'error', `内存使用率过高: ${percentage}%`);
        } else if (percentage > this.config.memory.warningThreshold) {
          this.addWarning('memory', 'warning', `内存使用率较高: ${percentage}%`);
        }
        
        this.notifyObservers();
      }
    };
    
    updateMemoryInfo();
    setInterval(updateMemoryInfo, 5000);
  }
  
  // 启动渲染性能监控
  private startRenderingMonitoring() {
    const measureFrame = () => {
      const currentTime = performance.now();
      const frameTime = currentTime - this.lastFrameTime;
      
      this.frameCount++;
      this.metrics.rendering.frameTime = frameTime;
      this.metrics.rendering.fps = Math.round(1000 / frameTime);
      
      // 更新渲染状态
      this.metrics.rendering.status = 
        this.metrics.rendering.fps >= 55 ? 'smooth' :
        this.metrics.rendering.fps >= 30 ? 'degraded' : 'poor';
      
      // 检测掉帧
      if (frameTime > this.config.rendering.dropFrameThreshold) {
        this.metrics.rendering.dropCount++;
        this.addWarning('rendering', 'warning', `检测到掉帧: ${frameTime.toFixed(2)}ms`);
      }
      
      // 检查渲染性能警告
      if (this.metrics.rendering.fps < this.config.rendering.fpsWarningThreshold) {
        this.addWarning('rendering', 'warning', `FPS过低: ${this.metrics.rendering.fps}`);
      }
      
      this.lastFrameTime = currentTime;
      this.notifyObservers();
      
      requestAnimationFrame(measureFrame);
    };
    
    requestAnimationFrame(measureFrame);
  }
  
  // 启动状态更新监控
  private startStateMonitoring() {
    // 监控状态大小
    const updateStateSize = () => {
      const store = useBehaviorTreeStore.getState();
      const stateSize = JSON.stringify(store).length;
      
      this.metrics.state.size = stateSize;
      this.metrics.state.status = 
        stateSize > this.config.state.largeStateThreshold ? 'large' : 'normal';
      
      // 检查大型状态警告
      if (stateSize > this.config.state.largeStateThreshold) {
        this.addWarning('state', 'warning', `状态数据过大: ${(stateSize / (1024 * 1024)).toFixed(2)}MB`);
      }
      
      this.notifyObservers();
    };
    
    // 定期检查状态大小
    setInterval(updateStateSize, 10000);
    updateStateSize(); // 立即检查一次
  }
  
  // 启动自动清理
  private startAutoCleanup() {
    this.cleanupTimer = setInterval(() => {
      this.performCleanup();
    }, this.config.memory.cleanupInterval);
  }
  
  // 添加警告
  private addWarning(
    type: PerformanceWarning['type'],
    level: PerformanceWarning['level'],
    message: string,
    metrics?: any
  ) {
    const warning: PerformanceWarning = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      level,
      message,
      timestamp: Date.now(),
      metrics
    };
    
    this.warnings.unshift(warning);
    
    // 保持最近100条警告
    if (this.warnings.length > 100) {
      this.warnings = this.warnings.slice(0, 100);
    }
    
    this.notifyObservers();
  }
  
  // 通知观察者
  private notifyObservers() {
    this.observers.forEach(callback => callback(this.metrics, this.warnings));
  }
  
  // 执行清理
  performCleanup() {
    try {
      // 执行内存清理
      this.memoryCleaner.performCleanup();
      
      // 触发垃圾回收
      if (typeof window !== 'undefined' && (window as any).gc) {
        (window as any).gc();
      }
      
      console.log('性能优化清理完成');
    } catch (error) {
      console.error('性能优化清理失败:', error);
    }
  }
  
  // 订阅性能指标更新
  subscribe(callback: (metrics: PerformanceMetrics, warnings: PerformanceWarning[]) => void) {
    this.observers.push(callback);
    return () => {
      this.observers = this.observers.filter(obs => obs !== callback);
    };
  }
  
  // 获取当前指标
  getMetrics() {
    return { ...this.metrics };
  }
  
  // 获取警告列表
  getWarnings() {
    return [...this.warnings];
  }
  
  // 清除警告
  clearWarnings() {
    this.warnings = [];
    this.notifyObservers();
  }
  
  // 更新配置
  updateConfig(newConfig: Partial<PerformanceMonitoringConfig>) {
    this.config = { ...this.config, ...newConfig };
  }
  
  // 销毁监控器
  destroy() {
    if (this.renderObserver) {
      this.renderObserver.disconnect();
    }
    
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    
    this.observers = [];
  }
}

// 全局性能监控器实例
let performanceMonitorInstance: IntegratedPerformanceMonitor | null = null;

// 获取性能监控器实例
function getPerformanceMonitor(): IntegratedPerformanceMonitor {
  if (!performanceMonitorInstance) {
    performanceMonitorInstance = new IntegratedPerformanceMonitor();
  }
  return performanceMonitorInstance;
}

// 性能监控Hook
export function usePerformanceMonitoring() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>(getPerformanceMonitor().getMetrics());
  const [warnings, setWarnings] = useState<PerformanceWarning[]>(getPerformanceMonitor().getWarnings());
  const [isMonitoring, setIsMonitoring] = useState(true);
  
  useEffect(() => {
    if (!isMonitoring) return;
    
    const unsubscribe = getPerformanceMonitor().subscribe((newMetrics, newWarnings) => {
      setMetrics(newMetrics);
      setWarnings(newWarnings);
    });
    
    return unsubscribe;
  }, [isMonitoring]);
  
  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
  }, []);
  
  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
  }, []);
  
  const clearWarnings = useCallback(() => {
    getPerformanceMonitor().clearWarnings();
    setWarnings([]);
  }, []);
  
  const performCleanup = useCallback(() => {
    getPerformanceMonitor().performCleanup();
  }, []);
  
  const updateConfig = useCallback((config: Partial<PerformanceMonitoringConfig>) => {
    getPerformanceMonitor().updateConfig(config);
  }, []);
  
  return {
    metrics,
    warnings,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    clearWarnings,
    performCleanup,
    updateConfig
  };
}

// 高性能状态选择器Hook
export function useOptimizedSelector<T, R>(
  selector: (state: T) => R,
  equalityFn?: (a: R, b: R) => boolean
) {
  const store = useBehaviorTreeStore;
  const equalityRef = useRef(equalityFn);
  const selectorRef = useRef(selector);
  const resultRef = useRef<R>();
  
  // 更新引用但不触发重渲染
  useEffect(() => {
    selectorRef.current = selector;
    equalityRef.current = equalityFn;
  });
  
  // 使用优化的选择器
  return store(
    useCallback((state: T) => {
      const newResult = selectorRef.current(state);
      
      // 只有在值真正改变时才更新
      if (!resultRef.current || !(equalityRef.current || Object.is)(resultRef.current, newResult)) {
        resultRef.current = newResult;
      }
      
      return resultRef.current;
    }, []),
    equalityRef.current || Object.is
  );
}

// 批量状态更新Hook
export function useBatchUpdates() {
  const batchUpdate = useCallback((updates: (() => void)[]) => {
    updates.forEach(update => {
      BatchUpdater.schedule(update);
    });
  }, []);
  
  return { batchUpdate };
}

// 内存优化Hook
export function useMemoryOptimization() {
  const { memoryInfo, startMonitoring, stopMonitoring } = useMemoryMonitor();
  const performCleanup = useCallback(() => {
    const cleaner = getMemoryCleaner();
    cleaner.performCleanup();
  }, []);
  
  return {
    memoryInfo,
    startMonitoring,
    stopMonitoring,
    performCleanup
  };
}

// 模式切换性能监控Hook
export function useModeSwitchPerformance() {
  const currentMode = useWorkflowMode();
  const [switchMetrics, setSwitchMetrics] = useState({
    lastSwitchTime: 0,
    averageSwitchTime: 0,
    switchCount: 0
  });
  
  useEffect(() => {
    const startTime = performance.now();
    performance.mark('mode-switch-start');
    
    return () => {
      performance.mark('mode-switch-end');
      const measure = performance.measure(
        'mode-switch', 
        'mode-switch-start', 
        'mode-switch-end'
      );
      
      const switchTime = measure.duration;
      setSwitchMetrics(prev => ({
        lastSwitchTime: switchTime,
        averageSwitchTime: (prev.averageSwitchTime * prev.switchCount + switchTime) / (prev.switchCount + 1),
        switchCount: prev.switchCount + 1
      }));
      
      // 检查模式切换性能
      if (switchTime > DEFAULT_CONFIG.modeSwitch.switchWarningThreshold) {
        console.warn(`模式切换耗时过长: ${switchTime.toFixed(2)}ms`);
      }
    };
  }, [currentMode]);
  
  return switchMetrics;
}

// 导出工具和类型
export {
  IntegratedPerformanceMonitor,
  getPerformanceMonitor,
  DEFAULT_CONFIG
};

export type { 
  PerformanceMonitoringConfig, 
  PerformanceMetrics, 
  PerformanceWarning 
};