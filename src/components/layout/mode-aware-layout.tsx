import React, { Suspense, useState, useEffect, useRef } from 'react';
import { cn } from '@/core/utils/utils';
import { useCurrentMode, useIsTransitioning, useTransitionProgress } from '@/core/store/behavior-tree-store';
import { WorkflowMode } from '@/core/store/workflowModeState';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';

// 懒加载模式布局组件
const ComposerLayout = React.lazy(() => import('./composer-layout'));
const DebugLayout = React.lazy(() => import('./debug-layout'));
const ReplayLayout = React.lazy(() => import('./replay-layout'));

interface ModeAwareLayoutProps {
  children?: React.ReactNode;
  className?: string;
}

// 加载指示器组件
function LoadingIndicator({ mode, progress }: { mode: WorkflowMode; progress?: number }) {
  const getModeLabel = (mode: WorkflowMode) => {
    switch (mode) {
      case WorkflowMode.COMPOSER:
        return '编排模式';
      case WorkflowMode.DEBUG:
        return '调试模式';
      case WorkflowMode.REPLAY:
        return '回放模式';
      default:
        return '未知模式';
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-background">
      <div className="text-center space-y-4 p-8">
        <div className="flex items-center justify-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-lg font-medium">
            正在加载{getModeLabel(mode)}...
          </span>
        </div>

        {typeof progress === 'number' && (
          <div className="w-64 space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground">
              {progress}%
            </p>
          </div>
        )}

        <div className="space-y-2">
          <Skeleton className="h-4 w-48 mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    </div>
  );
}

// 模式过渡组件
function ModeTransition({ children, isTransitioning, progress }: {
  children: React.ReactNode;
  isTransitioning: boolean;
  progress: number;
}) {
  const [showOverlay, setShowOverlay] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isTransitioning) {
      // 延迟 0.8s 才显示全局覆盖层，避免闪烁
      timerRef.current = window.setTimeout(() => setShowOverlay(true), 800);
    } else {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = null;
      setShowOverlay(false);
    }
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = null;
    };
  }, [isTransitioning]);

  if (!isTransitioning && !showOverlay) return <>{children}</>;

  return (
    <div className="relative">
      {/* 过渡覆盖层（延时显示） */}
      {showOverlay && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <div className="space-y-2">
              <p className="text-sm font-medium">正在切换模式...</p>
              <div className="w-48 space-y-1">
                <Progress value={progress} className="h-1" />
                <p className="text-xs text-muted-foreground">{progress}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 原内容（模糊处理） */}
      <div className={cn('transition-all duration-300', isTransitioning && 'blur-sm')}>
        {children}
      </div>
    </div>
  );
}

// 错误边界组件
class ModeLayoutErrorBoundary extends React.Component<
  { children: React.ReactNode; mode: WorkflowMode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; mode: WorkflowMode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`Error in ${this.props.mode} layout:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex items-center justify-center bg-background">
          <div className="text-center space-y-4 p-8 max-w-md">
            <div className="text-red-500">
              <svg className="h-12 w-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 18.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold">模式加载失败</h3>
            <p className="text-muted-foreground">
              {this.props.mode} 模式无法正常加载。
            </p>
            {this.state.error && (
              <div className="text-sm text-muted-foreground bg-muted p-3 rounded text-left">
                <strong>错误详情:</strong>
                <br />
                {this.state.error.message}
              </div>
            )}
            <div className="flex gap-2 justify-center">
              <button
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                onClick={() => {
                  this.setState({ hasError: false, error: undefined });
                  // 强制重新渲染
                  window.location.reload();
                }}
              >
                重试
              </button>
              <button
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors"
                onClick={() => {
                  // 尝试切换到编排模式
                  window.location.href = '/?mode=composer';
                }}
              >
                返回编排模式
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// 主布局组件
export function ModeAwareLayout({ children, className }: ModeAwareLayoutProps) {
  const currentMode = useCurrentMode();
  const isTransitioning = useIsTransitioning();
  const transitionProgress = useTransitionProgress();

  // 根据当前模式渲染对应的布局
  const renderModeLayout = () => {
    const commonProps = {
      className: "flex-1 flex flex-col"
    };

    switch (currentMode) {
      case WorkflowMode.COMPOSER:
        return (
          <Suspense fallback={<LoadingIndicator mode={currentMode} />}>
            <ModeLayoutErrorBoundary mode={currentMode}>
              <ComposerLayout {...commonProps}>
                {children}
              </ComposerLayout>
            </ModeLayoutErrorBoundary>
          </Suspense>
        );

      case WorkflowMode.DEBUG:
        return (
          <Suspense fallback={<LoadingIndicator mode={currentMode} />}>
            <ModeLayoutErrorBoundary mode={currentMode}>
              <DebugLayout {...commonProps}>
                {children}
              </DebugLayout>
            </ModeLayoutErrorBoundary>
          </Suspense>
        );

      case WorkflowMode.REPLAY:
        return (
          <Suspense fallback={<LoadingIndicator mode={currentMode} />}>
            <ModeLayoutErrorBoundary mode={currentMode}>
              <ReplayLayout {...commonProps}>
                {children}
              </ReplayLayout>
            </ModeLayoutErrorBoundary>
          </Suspense>
        );

      default:
        return (
          <div className="flex-1 flex items-center justify-center bg-background">
            <div className="text-center space-y-4">
              <h3 className="text-lg font-semibold">未知模式</h3>
              <p className="text-muted-foreground">
                当前模式 "{currentMode}" 不被支持。
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <ModeTransition
        isTransitioning={isTransitioning}
        progress={transitionProgress}
      >
        {renderModeLayout()}
      </ModeTransition>
    </div>
  );
}

// 导出默认组件
export default ModeAwareLayout;

// 导出额外的工具组件
export { LoadingIndicator, ModeTransition, ModeLayoutErrorBoundary };
