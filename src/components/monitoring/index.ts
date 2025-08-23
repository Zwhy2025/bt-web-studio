// 性能优化模块统一导出
export { default as PerformanceMonitor, usePerformanceMonitor } from './performance-monitor';
export { default as PerformanceOptimizer } from './performance-optimizer';
export { 
  useMemoryOptimization, 
  useMemoryMonitor,
  getMemoryCleaner,
  StateCompressor,
  MemoryCleaner,
  DEFAULT_CONFIG
} from '../../core/utils/memory-optimization';
export type { 
  MemoryOptimizationConfig, 
  MemoryStats 
} from '../../core/utils/memory-optimization';