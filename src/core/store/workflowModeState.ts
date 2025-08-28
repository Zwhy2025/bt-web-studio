import { StateCreator } from 'zustand';

// 工作模式枚举
export enum WorkflowMode {
  COMPOSER = 'composer',
  DEBUG = 'debug',
  REPLAY = 'replay',
}

// 模式切换验证结果
export interface ModeTransitionValidation {
  canSwitch: boolean;
  reason?: string;
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
}

// 工作模式历史记录
export interface ModeHistoryEntry {
  mode: WorkflowMode;
  timestamp: number;
  duration?: number;
}

// 工作模式状态接口
export interface WorkflowModeState {
  // 基础状态
  currentMode: WorkflowMode;
  previousMode: WorkflowMode | null;
  isTransitioning: boolean;
  transitionProgress: number; // 0-100
  
  // 历史记录
  modeHistory: ModeHistoryEntry[];
  
  // 模式切换控制
  canSwitchMode: boolean;
  pendingMode: WorkflowMode | null;
  
  // 模式特定状态保存
  modeStates: {
    [WorkflowMode.COMPOSER]: any;
    [WorkflowMode.DEBUG]: any;
    [WorkflowMode.REPLAY]: any;
  };
}

// 工作模式动作接口
export interface WorkflowModeActions {
  // 模式切换相关
  switchToComposer: () => Promise<boolean>;
  switchToDebug: () => Promise<boolean>;
  switchToReplay: () => Promise<boolean>;
  switchToMode: (mode: WorkflowMode) => Promise<boolean>;
  
  // 历史导航
  goToPreviousMode: () => Promise<boolean>;
  clearModeHistory: () => void;
  
  // 切换验证
  validateModeSwitch: (targetMode: WorkflowMode) => ModeTransitionValidation;
  
  // 模式状态管理
  saveModeState: (mode: WorkflowMode, state: any) => void;
  restoreModeState: (mode: WorkflowMode) => any;
  clearModeState: (mode: WorkflowMode) => void;
  
  // 过渡控制
  setTransitionProgress: (progress: number) => void;
  completeTransition: () => void;
  cancelTransition: () => void;
  
  // 内部方法
  _prepareModeTransition: (targetMode: WorkflowMode) => Promise<boolean>;
  _executeModeTransition: (targetMode: WorkflowMode) => void;
  _finalizeModeTransition: (fromMode: WorkflowMode, toMode: WorkflowMode) => void;
}

// 工作模式切片接口
export interface WorkflowModeSlice extends WorkflowModeState {
  actions: WorkflowModeActions;
}

// 创建工作模式状态切片
export const createWorkflowModeSlice: StateCreator<
  WorkflowModeSlice,
  [],
  [],
  WorkflowModeSlice
> = (set, get) => {
  
  // 验证模式切换
  const validateModeSwitch = (targetMode: WorkflowMode): ModeTransitionValidation => {
    const { currentMode, isTransitioning } = get();
    
    // 如果已经在目标模式，不需要切换
    if (currentMode === targetMode) {
      return { canSwitch: false, reason: 'Already in target mode' };
    }
    
    // 如果正在切换中，不允许再次切换
    if (isTransitioning) {
      return { canSwitch: false, reason: 'Mode transition in progress' };
    }
    
    // 检查是否有未保存的更改
    const hasUnsavedChanges = checkUnsavedChanges(currentMode);
    if (hasUnsavedChanges) {
      return {
        canSwitch: true,
        requiresConfirmation: true,
        confirmationMessage: `You have unsaved changes in ${currentMode} mode. Do you want to save before switching?`
      };
    }
    
    return { canSwitch: true };
  };
  
  // 检查未保存的更改
  const checkUnsavedChanges = (mode: WorkflowMode): boolean => {
    // 简化检查逻辑，直接返回 false 以提高性能
    // TODO: 如有需要，可以实现具体的检查逻辑
    return false;
  };
  
  // 准备模式切换
  const prepareModeTransition = async (targetMode: WorkflowMode): Promise<boolean> => {
    const validation = validateModeSwitch(targetMode);
    
    if (!validation.canSwitch) {
      console.warn(`Cannot switch to ${targetMode}: ${validation.reason}`);
      return false;
    }
    
    if (validation.requiresConfirmation) {
      // TODO: 显示确认对话框
      // 这里应该集成到UI组件中
      console.log(validation.confirmationMessage);
    }
    
    const { currentMode } = get();
    
    // 保存当前模式状态（简化处理以提高性能）
    // const currentState = getCurrentModeState(currentMode);
    // if (currentState) {
    //   set(state => ({
    //     ...state,
    //     modeStates: {
    //       ...state.modeStates,
    //       [currentMode]: currentState
    //     }
    //   }));
    // }
    
    return true;
  };
  
  // 获取当前模式状态
  const getCurrentModeState = (mode: WorkflowMode): any => {
    // 简化状态保存逻辑，直接返回 null 以提高性能
    // TODO: 如有需要，可以实现具体的状态保存逻辑
    return null;
  };
  
  // 执行模式切换
  const executeModeTransition = (targetMode: WorkflowMode) => {
    const { currentMode } = get();
    
    set(state => ({
      ...state,
      isTransitioning: true,
      pendingMode: targetMode,
      transitionProgress: 0
    }));
    
    // 模拟过渡动画（加快模式切换速度）
    const animateTransition = async () => {
      for (let progress = 0; progress <= 100; progress += 10) {
        set(state => ({
          ...state,
          transitionProgress: progress
        }));
        await new Promise(resolve => setTimeout(resolve, 20));
      }
      
      // 完成切换
      set(state => ({
        ...state,
        previousMode: currentMode,
        currentMode: targetMode,
        pendingMode: null,
        isTransitioning: false,
        transitionProgress: 100,
        modeHistory: [
          ...state.modeHistory,
          {
            mode: targetMode,
            timestamp: Date.now()
          }
        ]
      }));
      
      // 恢复目标模式状态
      const targetModeState = get().modeStates[targetMode];
      if (targetModeState) {
        // TODO: 恢复目标模式的状态
        console.log(`Restoring state for mode: ${targetMode}`, targetModeState);
      }
    };
    // 安全超时兜底，防止意外情况下过渡卡住
    setTimeout(() => {
      const state = get();
      if (state.isTransitioning && state.pendingMode === targetMode) {
        set(s => ({
          ...s,
          previousMode: currentMode,
          currentMode: targetMode,
          pendingMode: null,
          isTransitioning: false,
          transitionProgress: 100,
          modeHistory: [
            ...s.modeHistory,
            { mode: targetMode, timestamp: Date.now() }
          ]
        }));
      }
    }, 1000);

    animateTransition();
  };
  
  // 完成模式切换
  const finalizeModeTransition = (fromMode: WorkflowMode, toMode: WorkflowMode) => {
    // 更新历史记录中上一个模式的持续时间
    set(state => {
      const updatedHistory = [...state.modeHistory];
      const lastEntry = updatedHistory.find(entry => entry.mode === fromMode && !entry.duration);
      if (lastEntry) {
        lastEntry.duration = Date.now() - lastEntry.timestamp;
      }
      
      return {
        ...state,
        modeHistory: updatedHistory,
        transitionProgress: 0
      };
    });
  };
  
  return {
    // 初始状态
    currentMode: WorkflowMode.COMPOSER,
    previousMode: null,
    isTransitioning: false,
    transitionProgress: 0,
    modeHistory: [
      {
        mode: WorkflowMode.COMPOSER,
        timestamp: Date.now()
      }
    ],
    canSwitchMode: true,
    pendingMode: null,
    modeStates: {
      [WorkflowMode.COMPOSER]: null,
      [WorkflowMode.DEBUG]: null,
      [WorkflowMode.REPLAY]: null,
    },
    
    // 动作
    actions: {
      switchToComposer: async () => {
        const prepared = await prepareModeTransition(WorkflowMode.COMPOSER);
        if (prepared) {
          executeModeTransition(WorkflowMode.COMPOSER);
          return true;
        }
        return false;
      },
      
      switchToDebug: async () => {
        const prepared = await prepareModeTransition(WorkflowMode.DEBUG);
        if (prepared) {
          executeModeTransition(WorkflowMode.DEBUG);
          return true;
        }
        return false;
      },
      
      switchToReplay: async () => {
        const prepared = await prepareModeTransition(WorkflowMode.REPLAY);
        if (prepared) {
          executeModeTransition(WorkflowMode.REPLAY);
          return true;
        }
        return false;
      },
      
      switchToMode: async (mode: WorkflowMode) => {
        switch (mode) {
          case WorkflowMode.COMPOSER:
            return get().actions.switchToComposer();
          case WorkflowMode.DEBUG:
            return get().actions.switchToDebug();
          case WorkflowMode.REPLAY:
            return get().actions.switchToReplay();
          default:
            return false;
        }
      },
      
      goToPreviousMode: async () => {
        const { previousMode } = get();
        if (previousMode) {
          return get().actions.switchToMode(previousMode);
        }
        return false;
      },
      
      clearModeHistory: () => {
        set(state => ({
          ...state,
          modeHistory: [
            {
              mode: state.currentMode,
              timestamp: Date.now()
            }
          ]
        }));
      },
      
      validateModeSwitch,
      
      saveModeState: (mode: WorkflowMode, state: any) => {
        set(currentState => ({
          ...currentState,
          modeStates: {
            ...currentState.modeStates,
            [mode]: state
          }
        }));
      },
      
      restoreModeState: (mode: WorkflowMode) => {
        return get().modeStates[mode];
      },
      
      clearModeState: (mode: WorkflowMode) => {
        set(state => ({
          ...state,
          modeStates: {
            ...state.modeStates,
            [mode]: null
          }
        }));
      },
      
      setTransitionProgress: (progress: number) => {
        set(state => ({
          ...state,
          transitionProgress: Math.max(0, Math.min(100, progress))
        }));
      },
      
      completeTransition: () => {
        set(state => ({
          ...state,
          isTransitioning: false,
          transitionProgress: 100,
          pendingMode: null
        }));
      },
      
      cancelTransition: () => {
        set(state => ({
          ...state,
          isTransitioning: false,
          transitionProgress: 0,
          pendingMode: null
        }));
      },
      
      _prepareModeTransition: prepareModeTransition,
      _executeModeTransition: executeModeTransition,
      _finalizeModeTransition: finalizeModeTransition,
    }
  };
};
