import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useBehaviorTreeStore } from '@/core/store/behavior-tree-store';
import { WorkflowMode } from '@/core/store/workflowModeState';
import { deepEqual, isEqual } from 'lodash-es';

// 数据一致性验证器
export class DataConsistencyValidator {
  private static snapshots: Map<string, any> = new Map();
  
  // 创建状态快照
  static createSnapshot(label: string, state: any) {
    this.snapshots.set(label, JSON.parse(JSON.stringify(state)));
  }
  
  // 验证状态是否与快照一致
  static validateSnapshot(label: string, currentState: any): {
    isValid: boolean;
    differences: any[];
  } {
    const snapshot = this.snapshots.get(label);
    if (!snapshot) {
      throw new Error(`快照 ${label} 不存在`);
    }
    
    const differences = this.findDifferences(snapshot, currentState);
    
    return {
      isValid: differences.length === 0,
      differences
    };
  }
  
  // 查找两个对象之间的差异
  private static findDifferences(obj1: any, obj2: any, path: string = ''): any[] {
    const differences: any[] = [];
    
    if (typeof obj1 !== typeof obj2) {
      differences.push({
        path,
        expected: obj1,
        actual: obj2,
        type: 'type_mismatch'
      });
      return differences;
    }
    
    if (obj1 === null || obj2 === null) {
      if (obj1 !== obj2) {
        differences.push({
          path,
          expected: obj1,
          actual: obj2,
          type: 'null_mismatch'
        });
      }
      return differences;
    }
    
    if (typeof obj1 === 'object') {
      const keys1 = Object.keys(obj1);
      const keys2 = Object.keys(obj2);
      
      // 检查缺失的键
      const missingInObj2 = keys1.filter(key => !(key in obj2));
      const extraInObj2 = keys2.filter(key => !(key in obj1));
      
      missingInObj2.forEach(key => {
        differences.push({
          path: path ? `${path}.${key}` : key,
          expected: obj1[key],
          actual: undefined,
          type: 'missing_key'
        });
      });
      
      extraInObj2.forEach(key => {
        differences.push({
          path: path ? `${path}.${key}` : key,
          expected: undefined,
          actual: obj2[key],
          type: 'extra_key'
        });
      });
      
      // 递归检查共同的键
      const commonKeys = keys1.filter(key => key in obj2);
      commonKeys.forEach(key => {
        const childPath = path ? `${path}.${key}` : key;
        const childDiffs = this.findDifferences(obj1[key], obj2[key], childPath);
        differences.push(...childDiffs);
      });
    } else if (obj1 !== obj2) {
      differences.push({
        path,
        expected: obj1,
        actual: obj2,
        type: 'value_mismatch'
      });
    }
    
    return differences;
  }
  
  // 清理所有快照
  static clearSnapshots() {
    this.snapshots.clear();
  }
  
  // 获取所有快照标签
  static getSnapshotLabels(): string[] {
    return Array.from(this.snapshots.keys());
  }
}

// 模式隔离验证器
export class ModeIsolationValidator {
  private static modeStates: Map<WorkflowMode, any> = new Map();
  
  // 记录模式状态
  static recordModeState(mode: WorkflowMode, state: any) {
    this.modeStates.set(mode, JSON.parse(JSON.stringify(state)));
  }
  
  // 验证模式隔离
  static validateIsolation(mode: WorkflowMode, currentState: any): {
    isIsolated: boolean;
    violations: any[];
  } {
    const violations: any[] = [];
    
    // 检查当前模式状态是否被其他模式影响
    for (const [otherMode, otherState] of this.modeStates.entries()) {
      if (otherMode === mode) continue;
      
      const contamination = this.detectCrossModeContamination(
        mode,
        currentState,
        otherMode,
        otherState
      );
      
      if (contamination.length > 0) {
        violations.push({
          sourceMode: otherMode,
          targetMode: mode,
          contamination
        });
      }
    }
    
    return {
      isIsolated: violations.length === 0,
      violations
    };
  }
  
  // 检测跨模式污染
  private static detectCrossModeContamination(
    targetMode: WorkflowMode,
    targetState: any,
    sourceMode: WorkflowMode,
    sourceState: any
  ): any[] {
    const contamination: any[] = [];
    
    // 定义模式特定的状态键
    const modeSpecificKeys: Record<WorkflowMode, string[]> = {
      [WorkflowMode.COMPOSER]: [
        'selectedNodeIds',
        'activeTool',
        'clipboard',
        'history',
        'snapToGrid'
      ],
      [WorkflowMode.DEBUG]: [
        'debugSession',
        'executionState',
        'breakpoints',
        'watchVariables',
        'callStack'
      ],
      [WorkflowMode.REPLAY]: [
        'replaySession',
        'timelinePosition',
        'playbackSpeed',
        'isPlaying',
        'selectedEventTypes'
      ]
    };
    
    const targetKeys = modeSpecificKeys[targetMode] || [];
    const sourceKeys = modeSpecificKeys[sourceMode] || [];
    
    // 检查是否有源模式的数据泄露到目标模式
    sourceKeys.forEach(key => {
      if (key in targetState && sourceState[key] !== undefined) {
        if (isEqual(targetState[key], sourceState[key])) {
          contamination.push({
            key,
            value: targetState[key],
            type: 'data_leakage'
          });
        }
      }
    });
    
    return contamination;
  }
  
  // 清理模式状态记录
  static clearModeStates() {
    this.modeStates.clear();
  }
  
  // 获取模式状态摘要
  static getModeSummary(): Record<WorkflowMode, any> {
    const summary: Record<string, any> = {};
    
    for (const [mode, state] of this.modeStates.entries()) {
      summary[mode] = {
        keyCount: Object.keys(state).length,
        size: JSON.stringify(state).length,
        lastUpdated: Date.now()
      };
    }
    
    return summary;
  }
}

// 数据一致性和模式隔离测试套件
describe('数据一致性和模式隔离验证', () => {
  let store: ReturnType<typeof useBehaviorTreeStore>;

  beforeEach(() => {
    store = useBehaviorTreeStore.getState();
    DataConsistencyValidator.clearSnapshots();
    ModeIsolationValidator.clearModeStates();
  });

  afterEach(() => {
    DataConsistencyValidator.clearSnapshots();
    ModeIsolationValidator.clearModeStates();
  });

  describe('数据一致性验证', () => {
    it('应该在模式切换后保持数据一致性', () => {
      // 在编排模式下设置状态
      store.workflowMode.switchToComposer();
      store.composerMode.setSelectedNodes(['node1', 'node2']);
      store.composerMode.setActiveTool('select');
      
      // 创建快照
      DataConsistencyValidator.createSnapshot('composer_initial', store.composerMode);
      
      // 切换到其他模式
      store.workflowMode.switchToDebug();
      store.debugMode.addBreakpoint('node3');
      
      // 切换回编排模式
      store.workflowMode.switchToComposer();
      
      // 验证数据一致性
      const validation = DataConsistencyValidator.validateSnapshot(
        'composer_initial',
        store.composerMode
      );
      
      expect(validation.isValid).toBe(true);
      expect(validation.differences).toHaveLength(0);
    });

    it('应该检测到数据不一致性', () => {
      // 创建初始状态快照
      const initialState = {
        selectedNodes: ['node1'],
        activeTool: 'select'
      };
      
      DataConsistencyValidator.createSnapshot('test_state', initialState);
      
      // 修改状态
      const modifiedState = {
        selectedNodes: ['node1', 'node2'], // 添加了新节点
        activeTool: 'pan' // 改变了工具
      };
      
      const validation = DataConsistencyValidator.validateSnapshot(
        'test_state',
        modifiedState
      );
      
      expect(validation.isValid).toBe(false);
      expect(validation.differences.length).toBeGreaterThan(0);
      
      // 检查具体差异
      const toolDiff = validation.differences.find(diff => diff.path === 'activeTool');
      expect(toolDiff).toBeDefined();
      expect(toolDiff.expected).toBe('select');
      expect(toolDiff.actual).toBe('pan');
    });

    it('应该处理嵌套对象的数据一致性验证', () => {
      const complexState = {
        config: {
          panels: {
            left: { expanded: true, width: 300 },
            right: { expanded: false, width: 250 }
          }
        },
        selection: {
          nodes: ['node1'],
          edges: []
        }
      };
      
      DataConsistencyValidator.createSnapshot('complex_state', complexState);
      
      // 修改嵌套属性
      const modifiedState = {
        ...complexState,
        config: {
          ...complexState.config,
          panels: {
            ...complexState.config.panels,
            right: { expanded: true, width: 250 } // 改变了展开状态
          }
        }
      };
      
      const validation = DataConsistencyValidator.validateSnapshot(
        'complex_state',
        modifiedState
      );
      
      expect(validation.isValid).toBe(false);
      
      const panelDiff = validation.differences.find(
        diff => diff.path === 'config.panels.right.expanded'
      );
      expect(panelDiff).toBeDefined();
      expect(panelDiff.expected).toBe(false);
      expect(panelDiff.actual).toBe(true);
    });
  });

  describe('模式隔离验证', () => {
    it('应该确保编排模式状态不受其他模式影响', () => {
      // 设置编排模式状态
      store.workflowMode.switchToComposer();
      store.composerMode.setSelectedNodes(['node1']);
      store.composerMode.setActiveTool('select');
      
      ModeIsolationValidator.recordModeState(
        WorkflowMode.COMPOSER,
        store.composerMode
      );
      
      // 切换到调试模式并设置状态
      store.workflowMode.switchToDebug();
      store.debugMode.addBreakpoint('node2');
      store.debugMode.setExecutionState('running');
      
      ModeIsolationValidator.recordModeState(
        WorkflowMode.DEBUG,
        store.debugMode
      );
      
      // 验证编排模式隔离
      store.workflowMode.switchToComposer();
      const isolation = ModeIsolationValidator.validateIsolation(
        WorkflowMode.COMPOSER,
        store.composerMode
      );
      
      expect(isolation.isIsolated).toBe(true);
      expect(isolation.violations).toHaveLength(0);
    });

    it('应该检测到模式间的数据污染', () => {
      // 模拟数据污染情况
      const composerState = {
        selectedNodeIds: ['node1'],
        activeTool: 'select',
        // 错误地包含了调试模式的数据
        breakpoints: new Set(['node1']) // 这应该只存在于调试模式
      };
      
      const debugState = {
        debugSession: null,
        breakpoints: new Set(['node1']),
        executionState: 'idle'
      };
      
      ModeIsolationValidator.recordModeState(WorkflowMode.DEBUG, debugState);
      
      const isolation = ModeIsolationValidator.validateIsolation(
        WorkflowMode.COMPOSER,
        composerState
      );
      
      expect(isolation.isIsolated).toBe(false);
      expect(isolation.violations.length).toBeGreaterThan(0);
      
      const violation = isolation.violations[0];
      expect(violation.sourceMode).toBe(WorkflowMode.DEBUG);
      expect(violation.targetMode).toBe(WorkflowMode.COMPOSER);
    });

    it('应该验证所有模式的状态隔离', () => {
      // 设置所有模式的状态
      const modes = [WorkflowMode.COMPOSER, WorkflowMode.DEBUG, WorkflowMode.REPLAY];
      
      modes.forEach(mode => {
        store.workflowMode.switchToMode(mode);
        
        switch (mode) {
          case WorkflowMode.COMPOSER:
            store.composerMode.setSelectedNodes(['node1']);
            ModeIsolationValidator.recordModeState(mode, store.composerMode);
            break;
          case WorkflowMode.DEBUG:
            store.debugMode.addBreakpoint('node2');
            ModeIsolationValidator.recordModeState(mode, store.debugMode);
            break;
          case WorkflowMode.REPLAY:
            store.replayMode.setPlaybackSpeed(1.5);
            ModeIsolationValidator.recordModeState(mode, store.replayMode);
            break;
        }
      });
      
      // 验证每个模式的隔离性
      modes.forEach(mode => {
        store.workflowMode.switchToMode(mode);
        
        let currentState;
        switch (mode) {
          case WorkflowMode.COMPOSER:
            currentState = store.composerMode;
            break;
          case WorkflowMode.DEBUG:
            currentState = store.debugMode;
            break;
          case WorkflowMode.REPLAY:
            currentState = store.replayMode;
            break;
        }
        
        const isolation = ModeIsolationValidator.validateIsolation(mode, currentState);
        expect(isolation.isIsolated).toBe(true);
      });
    });
  });

  describe('边界情况测试', () => {
    it('应该处理空状态的一致性验证', () => {
      const emptyState = {};
      DataConsistencyValidator.createSnapshot('empty_state', emptyState);
      
      const validation = DataConsistencyValidator.validateSnapshot(
        'empty_state',
        emptyState
      );
      
      expect(validation.isValid).toBe(true);
    });

    it('应该处理undefined和null值', () => {
      const stateWithNulls = {
        value1: null,
        value2: undefined,
        value3: 'normal'
      };
      
      DataConsistencyValidator.createSnapshot('null_state', stateWithNulls);
      
      const validation = DataConsistencyValidator.validateSnapshot(
        'null_state',
        stateWithNulls
      );
      
      expect(validation.isValid).toBe(true);
    });

    it('应该处理循环引用的状态', () => {
      const circularState: any = {
        name: 'test'
      };
      circularState.self = circularState;
      
      // 应该能够处理循环引用而不崩溃
      expect(() => {
        DataConsistencyValidator.createSnapshot('circular_state', circularState);
      }).not.toThrow();
    });

    it('应该处理大型状态对象', () => {
      const largeState = {
        nodes: Array.from({ length: 1000 }, (_, i) => ({
          id: `node${i}`,
          type: 'action',
          data: { name: `Action ${i}` }
        })),
        connections: Array.from({ length: 999 }, (_, i) => ({
          source: `node${i}`,
          target: `node${i + 1}`
        }))
      };
      
      const startTime = performance.now();
      DataConsistencyValidator.createSnapshot('large_state', largeState);
      const validation = DataConsistencyValidator.validateSnapshot(
        'large_state',
        largeState
      );
      const endTime = performance.now();
      
      expect(validation.isValid).toBe(true);
      expect(endTime - startTime).toBeLessThan(100); // 应该在100ms内完成
    });
  });

  describe('性能测试', () => {
    it('应该快速完成数据一致性验证', () => {
      const testState = {
        config: { option1: true, option2: false },
        data: Array.from({ length: 100 }, (_, i) => ({ id: i, value: `item${i}` }))
      };
      
      DataConsistencyValidator.createSnapshot('perf_test', testState);
      
      const iterations = 100;
      const startTime = performance.now();
      
      for (let i = 0; i < iterations; i++) {
        DataConsistencyValidator.validateSnapshot('perf_test', testState);
      }
      
      const endTime = performance.now();
      const avgTime = (endTime - startTime) / iterations;
      
      expect(avgTime).toBeLessThan(1); // 平均每次验证应该在1ms内完成
    });

    it('应该快速完成模式隔离验证', () => {
      // 准备测试数据
      const composerState = {
        selectedNodes: Array.from({ length: 50 }, (_, i) => `node${i}`),
        activeTool: 'select',
        history: Array.from({ length: 20 }, (_, i) => ({ action: `action${i}` }))
      };
      
      ModeIsolationValidator.recordModeState(WorkflowMode.COMPOSER, composerState);
      
      const iterations = 50;
      const startTime = performance.now();
      
      for (let i = 0; i < iterations; i++) {
        ModeIsolationValidator.validateIsolation(WorkflowMode.COMPOSER, composerState);
      }
      
      const endTime = performance.now();
      const avgTime = (endTime - startTime) / iterations;
      
      expect(avgTime).toBeLessThan(2); // 平均每次验证应该在2ms内完成
    });
  });
});

// 导出验证器
export { DataConsistencyValidator, ModeIsolationValidator };