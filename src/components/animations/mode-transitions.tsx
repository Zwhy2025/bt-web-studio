import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/core/utils/utils';
import { useWorkflowMode, useIsTransitioning } from '@/core/store/behavior-tree-store';
import { WorkflowMode } from '@/core/store/workflowModeState';

// 动画类型
export type TransitionType = 'fade' | 'slide' | 'scale' | 'none';

// 模式切换方向
const getModeDirection = (from: WorkflowMode, to: WorkflowMode): number => {
  const modeOrder = {
    [WorkflowMode.COMPOSER]: 0,
    [WorkflowMode.DEBUG]: 1,
    [WorkflowMode.REPLAY]: 2
  };
  
  return modeOrder[to] - modeOrder[from];
};

// 模式切换动画包装器
interface ModeTransitionWrapperProps {
  children: React.ReactNode;
  mode: WorkflowMode;
  transitionType?: TransitionType;
  className?: string;
}

export function ModeTransitionWrapper({
  children,
  mode,
  transitionType = 'scale',
  className
}: ModeTransitionWrapperProps) {
  const isTransitioning = useIsTransitioning();
  const [isAnimating, setIsAnimating] = useState(false);
  const [previousMode, setPreviousMode] = useState<WorkflowMode>(mode);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    if (mode !== previousMode) {
      setDirection(getModeDirection(previousMode, mode));
      setIsAnimating(true);
      setPreviousMode(mode);
      
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [mode, previousMode]);

  if (transitionType === 'none') {
    return <div className={className}>{children}</div>;
  }

  const getAnimationClass = () => {
    if (!isAnimating) return '';
    
    switch (transitionType) {
      case 'slide':
        return direction > 0 ? 'animate-slide-in-right' : 'animate-slide-in-left';
      case 'fade':
        return 'animate-fade-in';
      case 'scale':
      default:
        return 'animate-scale-in';
    }
  };

  return (
    <div
      className={cn(
        'h-full transition-all duration-500 ease-in-out',
        getAnimationClass(),
        isTransitioning && 'opacity-80',
        className
      )}
    >
      {children}
    </div>
  );
}

// 加载动画组件
interface LoadingTransitionProps {
  isLoading: boolean;
  children: React.ReactNode;
  loadingContent?: React.ReactNode;
  className?: string;
}

export function LoadingTransition({
  isLoading,
  children,
  loadingContent,
  className
}: LoadingTransitionProps) {
  const defaultLoadingContent = (
    <div className="flex items-center justify-center h-full">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground animate-pulse">
          正在切换模式...
        </p>
      </div>
    </div>
  );

  return (
    <div className={cn('h-full', className)}>
      {isLoading ? (
        <div className="h-full animate-fade-in">
          {loadingContent || defaultLoadingContent}
        </div>
      ) : (
        <div className="h-full animate-fade-in">
          {children}
        </div>
      )}
    </div>
  );
}

// 面板展开/折叠动画
interface PanelTransitionProps {
  isExpanded: boolean;
  children: React.ReactNode;
  direction?: 'horizontal' | 'vertical';
  className?: string;
}

export function PanelTransition({
  isExpanded,
  children,
  direction = 'horizontal',
  className
}: PanelTransitionProps) {
  return (
    <div
      className={cn(
        'overflow-hidden transition-all duration-300 ease-in-out',
        direction === 'horizontal' 
          ? (isExpanded ? 'w-auto opacity-100' : 'w-0 opacity-0')
          : (isExpanded ? 'h-auto opacity-100' : 'h-0 opacity-0'),
        className
      )}
    >
      <div
        className={cn(
          'transition-opacity duration-200',
          isExpanded ? 'opacity-100' : 'opacity-0'
        )}
      >
        {children}
      </div>
    </div>
  );
}

// 模式指示器动画
interface ModeIndicatorProps {
  currentMode: WorkflowMode;
  modes: WorkflowMode[];
  onModeChange: (mode: WorkflowMode) => void;
  className?: string;
}

export function AnimatedModeIndicator({
  currentMode,
  modes,
  onModeChange,
  className
}: ModeIndicatorProps) {
  const isTransition = useIsTransitioning();
  
  return (
    <div className={cn('flex items-center space-x-1', className)}>
      {modes.map((mode, index) => {
        const isActive = mode === currentMode;
        
        return (
          <button
            key={mode}
            onClick={() => onModeChange(mode)}
            disabled={isTransition}
            className={cn(
              'relative px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
              'hover:scale-105 active:scale-95',
              isActive 
                ? 'bg-primary text-primary-foreground shadow-md' 
                : 'text-muted-foreground hover:text-foreground hover:bg-muted',
              isTransition && 'opacity-50 cursor-not-allowed'
            )}
          >
            {mode}
            {isActive && (
              <div className="absolute inset-0 bg-primary rounded-md animate-pulse opacity-20" />
            )}
          </button>
        );
      })}
    </div>
  );
}

// 状态指示器动画
interface StatusIndicatorProps {
  status: 'idle' | 'loading' | 'success' | 'error';
  message?: string;
  className?: string;
}

export function AnimatedStatusIndicator({
  status,
  message,
  className
}: StatusIndicatorProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'loading': return 'text-blue-500';
      case 'success': return 'text-green-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        );
      case 'success':
        return (
          <div className="w-4 h-4 rounded-full bg-current animate-bounce" />
        );
      case 'error':
        return (
          <div className="w-4 h-4 rounded-full bg-current animate-pulse" />
        );
      default:
        return <div className="w-4 h-4 rounded-full bg-current opacity-50" />;
    }
  };

  return (
    <div
      className={cn(
        'flex items-center space-x-2 animate-fade-in',
        getStatusColor(),
        className
      )}
    >
      {getStatusIcon()}
      {message && (
        <span className="text-sm animate-slide-in-left">
          {message}
        </span>
      )}
    </div>
  );
}

// 工具提示动画
interface AnimatedTooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function AnimatedTooltip({
  content,
  children,
  className
}: AnimatedTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          className={cn(
            'absolute z-50 px-2 py-1 text-xs text-white bg-gray-900 rounded shadow-lg',
            'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
            'animate-fade-in',
            className
          )}
        >
          {content}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
}