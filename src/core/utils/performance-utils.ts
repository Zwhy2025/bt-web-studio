import { useCallback, useMemo, useRef, useEffect } from 'react';
import { shallow } from 'zustand/shallow';
import { subscribeWithSelector } from 'zustand/middleware';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// 性能监控中间件
export const performanceMiddleware = (config: any) => (set: any, get: any, api: any) => {
  const originalSet = set;
  
  // 包装set方法以监控性能
  const wrappedSet = (partial: any, replace?: boolean) => {
    const startTime = performance.now();
    const result = originalSet(partial, replace);
    const endTime = performance.now();
    
    // 记录状态更新性能
    if (endTime - startTime > 5) { // 超过5ms的更新
      console.warn(`状态更新耗时过长: ${endTime - startTime}ms`, {
        partial: typeof partial === 'function' ? 'function' : partial,
        replace
      });
    }
    
    return result;
  };
  
  return config(wrappedSet, get, api);
};

// 选择器性能优化工具
export class SelectorOptimizer {
  private static cache = new Map<string, any>();
  private static cacheHits = 0;
  private static cacheMisses = 0;
  
  // 创建缓存选择器
  static createCachedSelector<T, R>(
    selector: (state: T) => R,
    cacheKey: string,
    maxAge: number = 5000 // 5秒缓存时间
  ) {
    return (state: T): R => {
      const now = Date.now();
      const cached = this.cache.get(cacheKey);
      
      if (cached && (now - cached.timestamp) < maxAge) {
        this.cacheHits++;
        return cached.value;
      }
      
      const result = selector(state);
      this.cache.set(cacheKey, {
        value: result,
        timestamp: now
      });
      this.cacheMisses++;
      
      return result;
    };
  }
  
  // 清理过期缓存
  static cleanExpiredCache(maxAge: number = 5000) {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > maxAge) {
        this.cache.delete(key);
      }
    }
  }
  
  // 获取缓存统计
  static getCacheStats() {
    return {
      hits: this.cacheHits,
      misses: this.cacheMisses,
      hitRate: this.cacheHits / (this.cacheHits + this.cacheMisses),
      cacheSize: this.cache.size
    };
  }
  
  // 清理所有缓存
  static clearCache() {
    this.cache.clear();
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }
}

// 批量更新工具
export class BatchUpdater {
  private static updateQueue: (() => void)[] = [];
  private static isScheduled = false;
  
  // 添加更新到批处理队列
  static schedule(update: () => void) {
    this.updateQueue.push(update);
    
    if (!this.isScheduled) {
      this.isScheduled = true;
      // 使用微任务延迟执行批量更新
      Promise.resolve().then(() => {
        this.flush();
      });
    }
  }
  
  // 执行批量更新
  static flush() {
    const updates = [...this.updateQueue];
    this.updateQueue.length = 0;
    this.isScheduled = false;
    
    // 批量执行所有更新
    updates.forEach(update => {
      try {
        update();
      } catch (error) {
        console.error('批量更新执行失败:', error);
      }
    });
  }
  
  // 获取队列状态
  static getQueueStatus() {
    return {
      queueLength: this.updateQueue.length,
      isScheduled: this.isScheduled
    };
  }
}

// 内存优化工具
export class MemoryOptimizer {
  private static weakRefs = new Set<WeakRef<any>>();
  private static cleanupTimer: NodeJS.Timeout | null = null;
  
  // 注册需要内存管理的对象
  static register<T extends object>(obj: T): T {
    const weakRef = new WeakRef(obj);
    this.weakRefs.add(weakRef);
    
    // 启动清理定时器
    if (!this.cleanupTimer) {
      this.cleanupTimer = setInterval(() => {
        this.cleanup();
      }, 30000); // 30秒清理一次
    }
    
    return obj;
  }
  
  // 清理已被垃圾回收的对象引用
  static cleanup() {
    const toDelete: WeakRef<any>[] = [];
    
    for (const weakRef of this.weakRefs) {
      if (weakRef.deref() === undefined) {
        toDelete.push(weakRef);
      }
    }
    
    toDelete.forEach(weakRef => {
      this.weakRefs.delete(weakRef);
    });
    
    console.log(`内存清理完成，移除 ${toDelete.length} 个失效引用`);
  }
  
  // 强制垃圾回收（仅开发环境）
  static forceGC() {
    if (typeof window !== 'undefined' && 'gc' in window) {
      // @ts-ignore
      window.gc();
    }
  }
  
  // 获取内存使用统计
  static getMemoryStats() {
    const aliveRefs = Array.from(this.weakRefs).filter(ref => ref.deref() !== undefined);
    
    return {
      totalRefs: this.weakRefs.size,
      aliveRefs: aliveRefs.length,
      gcedRefs: this.weakRefs.size - aliveRefs.length
    };
  }
  
  // 停止内存监控
  static stop() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.weakRefs.clear();
  }
}

// 状态订阅优化Hook
export function useOptimizedSubscription<T, R>(
  store: any,
  selector: (state: T) => R,
  equalityFn?: (a: R, b: R) => boolean
) {
  const equalityRef = useRef(equalityFn || shallow);
  const selectorRef = useRef(selector);
  const resultRef = useRef<R>();
  
  // 更新引用但不触发重渲染
  useEffect(() => {
    selectorRef.current = selector;
    equalityRef.current = equalityFn || shallow;
  });
  
  // 使用优化的选择器
  return store(
    useCallback((state: T) => {
      const newResult = selectorRef.current(state);
      
      // 只有在值真正改变时才更新
      if (!resultRef.current || !equalityRef.current(resultRef.current, newResult)) {
        resultRef.current = newResult;
      }
      
      return resultRef.current;
    }, []),
    equalityRef.current
  );
}

// 懒加载状态Hook
export function useLazyState<T>(
  initializer: () => T,
  deps: React.DependencyList = []
) {
  const hasInitialized = useRef(false);
  const stateRef = useRef<T>();
  
  return useMemo(() => {
    if (!hasInitialized.current) {
      stateRef.current = initializer();
      hasInitialized.current = true;
    }
    return stateRef.current!;
  }, deps);
}

// 防抖状态更新Hook
export function useDebouncedState<T>(
  value: T,
  delay: number = 300
): [T, (value: T) => void] {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  const setValue = useCallback((newValue: T) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(newValue);
    }, delay);
  }, [delay]);
  
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  return [debouncedValue, setValue];
}

// 计算属性优化Hook
export function useComputedValue<T, R>(
  selector: (value: T) => R,
  value: T,
  equalityFn?: (a: T, b: T) => boolean
): R {
  const previousValue = useRef<T>(value);
  const computedResult = useRef<R>();
  const equality = equalityFn || shallow;
  
  return useMemo(() => {
    if (!computedResult.current || !equality(previousValue.current, value)) {
      computedResult.current = selector(value);
      previousValue.current = value;
    }
    return computedResult.current;
  }, [value, selector, equality]);
}

// 状态分片工具
export class StatePartitioner {
  // 根据访问模式分割状态
  static partitionByAccess<T extends Record<string, any>>(
    state: T,
    accessPatterns: Record<string, string[]>
  ): Record<string, Partial<T>> {
    const partitions: Record<string, Partial<T>> = {};
    
    Object.entries(accessPatterns).forEach(([partitionName, keys]) => {
      partitions[partitionName] = {};
      keys.forEach(key => {
        if (key in state) {
          partitions[partitionName][key] = state[key];
        }
      });
    });
    
    return partitions;
  }
  
  // 合并状态分片
  static mergePartitions<T>(partitions: Partial<T>[]): T {
    return Object.assign({}, ...partitions) as T;
  }
}

// 性能监控器
export class PerformanceMonitor {
  private static metrics: Record<string, number[]> = {};
  private static isEnabled = process.env.NODE_ENV === 'development';
  
  // 记录性能指标
  static record(key: string, value: number) {
    if (!this.isEnabled) return;
    
    if (!this.metrics[key]) {
      this.metrics[key] = [];
    }
    
    this.metrics[key].push(value);
    
    // 保持最近100个记录
    if (this.metrics[key].length > 100) {
      this.metrics[key].shift();
    }
  }
  
  // 测量函数执行时间
  static measure<T>(key: string, fn: () => T): T {
    if (!this.isEnabled) return fn();
    
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;
    
    this.record(key, duration);
    return result;
  }
  
  // 获取性能统计
  static getStats(key: string) {
    const values = this.metrics[key] || [];
    if (values.length === 0) return null;
    
    const sorted = [...values].sort((a, b) => a - b);
    return {
      count: values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: values.reduce((sum, val) => sum + val, 0) / values.length,
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p90: sorted[Math.floor(sorted.length * 0.9)],
      p99: sorted[Math.floor(sorted.length * 0.99)]
    };
  }
  
  // 获取所有性能指标
  static getAllStats() {
    return Object.keys(this.metrics).reduce((stats, key) => {
      stats[key] = this.getStats(key);
      return stats;
    }, {} as Record<string, any>);
  }
  
  // 清理性能数据
  static clear(key?: string) {
    if (key) {
      delete this.metrics[key];
    } else {
      this.metrics = {};
    }
  }
  
  // 启用/禁用监控
  static setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }
}

// 导出主要的性能优化工具
export {
  SelectorOptimizer,
  BatchUpdater,
  MemoryOptimizer,
  StatePartitioner,
  PerformanceMonitor
};

// 启动清理任务
if (typeof window !== 'undefined') {
  // 定期清理选择器缓存
  setInterval(() => {
    SelectorOptimizer.cleanExpiredCache();
  }, 10000); // 10秒
  
  // 监听页面可见性变化，在页面隐藏时执行内存清理
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      MemoryOptimizer.cleanup();
      SelectorOptimizer.cleanExpiredCache(1000); // 更激进的缓存清理
    }
  });
}