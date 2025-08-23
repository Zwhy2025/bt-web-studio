import { useCallback, useEffect, useRef, useState } from 'react';
import { 
  useBehaviorTreeStore,
  useWorkflowMode,
  useComposerActions,
  useDebugActions,
  useReplayActions
} from '@/core/store/behavior-tree-store';

interface MemoryOptimizationConfig {
  // 自动清理配置
  autoCleanup: {
    enabled: boolean;
    interval: number; // 清理间隔(毫秒)
    maxHistorySize: number; // 最大历史记录数
    maxCacheSize: number; // 最大缓存大小
  };
  
  // 状态压缩配置
  stateCompression: {
    enabled: boolean;
    compressionThreshold: number; // 压缩阈值(字节)
    maxUncompressedStates: number; // 最大未压缩状态数
  };
  
  // 内存监控配置
  memoryMonitoring: {
    enabled: boolean;
    warningThreshold: number; // 内存警告阈值(百分比)
    criticalThreshold: number; // 内存临界阈值(百分比)
  };
}

// 默认配置
const DEFAULT_CONFIG: MemoryOptimizationConfig = {
  autoCleanup: {
    enabled: true,
    interval: 30000, // 30秒
    maxHistorySize: 100,
    maxCacheSize: 50 * 1024 * 1024 // 50MB
  },
  stateCompression: {
    enabled: true,
    compressionThreshold: 1024 * 1024, // 1MB
    maxUncompressedStates: 10
  },
  memoryMonitoring: {
    enabled: true,
    warningThreshold: 70,
    criticalThreshold: 85
  }
};

// 内存使用统计
interface MemoryStats {
  totalSize: number;
  stateSize: number;
  historySize: number;
  cacheSize: number;
  compressedStates: number;
  lastCleanup: number;
}

// 状态压缩器
class StateCompressor {
  private compressionEnabled: boolean;
  
  constructor(enabled: boolean = true) {
    this.compressionEnabled = enabled;
  }
  
  // 简单的JSON压缩（移除空格和不必要的字符）
  compress(data: any): string {
    const jsonString = JSON.stringify(data);
    
    if (!this.compressionEnabled) {
      return jsonString;
    }
    
    // 简单压缩：移除多余空格
    return jsonString.replace(/\s+/g, ' ').trim();
  }
  
  // 解压缩
  decompress(compressedData: string): any {
    try {
      return JSON.parse(compressedData);
    } catch (error) {
      console.error('解压缩状态失败:', error);
      return null;
    }
  }
  
  // 计算压缩率
  getCompressionRatio(original: any, compressed: string): number {
    const originalSize = JSON.stringify(original).length;
    const compressedSize = compressed.length;
    return ((originalSize - compressedSize) / originalSize) * 100;
  }
}

// 内存清理器
class MemoryCleaner {
  private config: MemoryOptimizationConfig;
  private compressor: StateCompressor;
  private cleanupTimer?: NodeJS.Timeout;
  private memoryStats: MemoryStats;
  
  constructor(config: MemoryOptimizationConfig = DEFAULT_CONFIG) {
    this.config = config;
    this.compressor = new StateCompressor(config.stateCompression.enabled);
    this.memoryStats = {
      totalSize: 0,
      stateSize: 0,
      historySize: 0,
      cacheSize: 0,
      compressedStates: 0,
      lastCleanup: Date.now()
    };
    
    this.startAutoCleanup();
  }
  
  // 启动自动清理
  private startAutoCleanup() {
    if (!this.config.autoCleanup.enabled) return;
    
    this.cleanupTimer = setInterval(() => {
      this.performCleanup();
    }, this.config.autoCleanup.interval);
  }
  
  // 停止自动清理
  stopAutoCleanup() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }
  
  // 执行内存清理
  performCleanup() {
    const store = useBehaviorTreeStore.getState();
    const currentMode = store.workflowMode.currentMode;
    
    try {
      // 清理历史记录
      this.cleanupHistory();
      
      // 清理缓存
      this.cleanupCache();
      
      // 压缩状态
      this.compressStates();
      
      // 清理无用的模式数据
      this.cleanupInactiveModeData(currentMode);
      
      // 更新统计信息
      this.updateMemoryStats();
      
      this.memoryStats.lastCleanup = Date.now();
      
      // 触发垃圾回收（如果可用）
      this.triggerGarbageCollection();
      
      console.log('内存清理完成:', this.memoryStats);
      
    } catch (error) {
      console.error('内存清理失败:', error);
    }
  }
  
  // 清理历史记录
  private cleanupHistory() {
    const store = useBehaviorTreeStore.getState();
    const { maxHistorySize } = this.config.autoCleanup;
    
    // 清理编排模式历史
    if (store.composerMode.history.length > maxHistorySize) {
      const excessCount = store.composerMode.history.length - maxHistorySize;
      store.composerMode.history.splice(0, excessCount);
    }
    
    // 清理调试日志
    if (store.debugMode.logs.length > maxHistorySize) {
      const excessCount = store.debugMode.logs.length - maxHistorySize;
      store.debugMode.logs.splice(0, excessCount);
    }
    
    // 清理回放事件
    if (store.replayMode.events.length > maxHistorySize * 2) {
      const excessCount = store.replayMode.events.length - (maxHistorySize * 2);
      store.replayMode.events.splice(0, excessCount);
    }
  }
  
  // 清理缓存
  private cleanupCache() {
    const store = useBehaviorTreeStore.getState();
    
    // 清理节点缓存
    const nodeCache = store.behaviors.nodes;
    const cacheSize = Object.keys(nodeCache).length;
    
    if (cacheSize > 1000) { // 如果缓存节点超过1000个
      // 保留最近使用的节点
      const sortedNodes = Object.entries(nodeCache)
        .sort(([,a], [,b]) => (b.lastModified || 0) - (a.lastModified || 0))
        .slice(0, 500);
      
      // 清空并重新填充缓存
      Object.keys(nodeCache).forEach(key => delete nodeCache[key]);
      sortedNodes.forEach(([id, node]) => nodeCache[id] = node);
    }
  }
  
  // 压缩状态
  private compressStates() {
    if (!this.config.stateCompression.enabled) return;
    
    const store = useBehaviorTreeStore.getState();
    const { compressionThreshold, maxUncompressedStates } = this.config.stateCompression;
    
    // 压缩大型状态对象
    Object.values(store.behaviors.trees).forEach(tree => {
      const treeSize = JSON.stringify(tree).length;
      
      if (treeSize > compressionThreshold) {
        // 这里可以实现更复杂的压缩逻辑
        // 例如压缩节点属性、移除不必要的元数据等
        this.compressTreeData(tree);
        this.memoryStats.compressedStates++;
      }
    });
  }
  
  // 压缩树数据
  private compressTreeData(tree: any) {
    // 移除临时属性
    if (tree.metadata) {
      delete tree.metadata.tempProps;
      delete tree.metadata.renderCache;
    }
    
    // 压缩节点数据
    if (tree.nodes) {
      Object.values(tree.nodes).forEach((node: any) => {
        // 移除UI相关的临时数据
        delete node.ui?.dragData;
        delete node.ui?.selectionCache;
        
        // 压缩属性数据
        if (node.properties && Object.keys(node.properties).length === 0) {
          delete node.properties;
        }
      });
    }
  }
  
  // 清理非活动模式的数据
  private cleanupInactiveModeData(currentMode: string) {
    const store = useBehaviorTreeStore.getState();
    
    // 如果不在编排模式，清理编排临时数据
    if (currentMode !== 'composer') {
      store.composerMode.selectedTool = null;
      store.composerMode.hoveredNode = null;
      store.composerMode.dragData = null;
    }
    
    // 如果不在调试模式，清理调试临时数据
    if (currentMode !== 'debug') {
      store.debugMode.selectedVariable = null;
      store.debugMode.hoveredBreakpoint = null;
    }
    
    // 如果不在回放模式，清理回放临时数据
    if (currentMode !== 'replay') {
      store.replayMode.hoveredEvent = null;
      store.replayMode.selectedTimeRange = null;
    }
  }
  
  // 更新内存统计
  private updateMemoryStats() {
    const store = useBehaviorTreeStore.getState();
    
    this.memoryStats.stateSize = this.calculateObjectSize(store);
    this.memoryStats.historySize = this.calculateObjectSize(store.composerMode.history) +
                                   this.calculateObjectSize(store.debugMode.logs) +
                                   this.calculateObjectSize(store.replayMode.events);
    this.memoryStats.cacheSize = this.calculateObjectSize(store.behaviors.nodes);
    this.memoryStats.totalSize = this.memoryStats.stateSize + 
                                 this.memoryStats.historySize + 
                                 this.memoryStats.cacheSize;
  }
  
  // 计算对象大小（近似）
  private calculateObjectSize(obj: any): number {
    return JSON.stringify(obj).length * 2; // 近似字节数
  }
  
  // 触发垃圾回收
  private triggerGarbageCollection() {
    // 在开发环境中，可以手动触发垃圾回收
    if (typeof window !== 'undefined' && (window as any).gc) {
      (window as any).gc();
    }
  }
  
  // 获取内存统计
  getMemoryStats(): MemoryStats {
    return { ...this.memoryStats };
  }
  
  // 获取内存使用建议
  getMemoryRecommendations(): string[] {
    const recommendations: string[] = [];
    const { totalSize, historySize, cacheSize } = this.memoryStats;
    
    if (totalSize > 100 * 1024 * 1024) { // 100MB
      recommendations.push('应用内存使用过高，建议重启应用');
    }
    
    if (historySize > 10 * 1024 * 1024) { // 10MB
      recommendations.push('历史记录占用过多内存，建议减少保存的历史数量');
    }
    
    if (cacheSize > 20 * 1024 * 1024) { // 20MB
      recommendations.push('缓存占用过多内存，建议清理无用的缓存数据');
    }
    
    if (this.memoryStats.compressedStates > 50) {
      recommendations.push('大量状态被压缩，考虑优化数据结构');
    }
    
    return recommendations;
  }
  
  // 销毁清理器
  destroy() {
    this.stopAutoCleanup();
  }
}

// 全局内存清理器实例
let memoryCleanerInstance: MemoryCleaner | null = null;

// 获取内存清理器实例
export function getMemoryCleaner(): MemoryCleaner {
  if (!memoryCleanerInstance) {
    memoryCleanerInstance = new MemoryCleaner();
  }
  return memoryCleanerInstance;
}

// 内存优化钩子
export function useMemoryOptimization() {
  const memoryCleaner = useRef<MemoryCleaner | null>(null);
  const currentMode = useWorkflowMode();
  
  useEffect(() => {
    // 初始化内存清理器
    memoryCleaner.current = getMemoryCleaner();
    
    return () => {
      // 组件卸载时清理
      if (memoryCleaner.current) {
        memoryCleaner.current.destroy();
        memoryCleaner.current = null;
        memoryCleanerInstance = null;
      }
    };
  }, []);
  
  // 手动触发清理
  const performCleanup = useCallback(() => {
    if (memoryCleaner.current) {
      memoryCleaner.current.performCleanup();
    }
  }, []);
  
  // 获取内存统计
  const getMemoryStats = useCallback((): MemoryStats | null => {
    return memoryCleaner.current?.getMemoryStats() || null;
  }, []);
  
  // 获取优化建议
  const getRecommendations = useCallback((): string[] => {
    return memoryCleaner.current?.getMemoryRecommendations() || [];
  }, []);
  
  // 配置内存优化
  const configureOptimization = useCallback((config: Partial<MemoryOptimizationConfig>) => {
    if (memoryCleaner.current) {
      memoryCleaner.current.destroy();
    }
    memoryCleaner.current = new MemoryCleaner({ ...DEFAULT_CONFIG, ...config });
  }, []);
  
  return {
    performCleanup,
    getMemoryStats,
    getRecommendations,
    configureOptimization
  };
}

// 内存监控钩子
export function useMemoryMonitor() {
  const [memoryInfo, setMemoryInfo] = useState<any>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const startMonitoring = useCallback((interval: number = 5000) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    const updateMemoryInfo = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        setMemoryInfo({
          used: memory.usedJSHeapSize,
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit,
          usage: Math.round((memory.usedJSHeapSize / memory.totalJSHeapSize) * 100)
        });
      }
    };
    
    updateMemoryInfo();
    intervalRef.current = setInterval(updateMemoryInfo, interval);
  }, []);
  
  const stopMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);
  
  useEffect(() => {
    return () => stopMonitoring();
  }, [stopMonitoring]);
  
  return {
    memoryInfo,
    startMonitoring,
    stopMonitoring
  };
}

// 导出配置和工具
export { DEFAULT_CONFIG, StateCompressor, MemoryCleaner };
export type { MemoryOptimizationConfig, MemoryStats };