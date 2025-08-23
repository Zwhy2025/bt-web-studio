import React from 'react';
import { cn } from '@/core/utils/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  useCurrentMode, 
  useIsTransitioning, 
  useTransitionProgress,
  useBehaviorTreeStore 
} from '@/core/store/behavior-tree-store';
import { WorkflowMode } from '@/core/store/workflowModeState';
import { useI18n } from '@/hooks/use-i18n';
import { Edit, Bug, PlayCircle } from 'lucide-react';

// 模式配置
interface ModeConfig {
  mode: WorkflowMode;
  icon: React.ComponentType<{ className?: string }>;
  labelKey: string;
  descriptionKey: string;
  color: string;
  activeColor: string;
}

const modeConfigs: ModeConfig[] = [
  {
    mode: WorkflowMode.COMPOSER,
    icon: Edit,
    labelKey: 'modes.composer.label',
    descriptionKey: 'modes.composer.description',
    color: 'text-blue-600 hover:text-blue-700',
    activeColor: 'text-blue-700 bg-blue-50 border-blue-200',
  },
  {
    mode: WorkflowMode.DEBUG,
    icon: Bug,
    labelKey: 'modes.debug.label',
    descriptionKey: 'modes.debug.description',
    color: 'text-orange-600 hover:text-orange-700',
    activeColor: 'text-orange-700 bg-orange-50 border-orange-200',
  },
  {
    mode: WorkflowMode.REPLAY,
    icon: PlayCircle,
    labelKey: 'modes.replay.label',
    descriptionKey: 'modes.replay.description',
    color: 'text-green-600 hover:text-green-700',
    activeColor: 'text-green-700 bg-green-50 border-green-200',
  },
];

interface ModeSelectorProps {
  variant?: 'tabs' | 'pills' | 'buttons';
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  showDescription?: boolean;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export function ModeSelector({
  variant = 'tabs',
  size = 'md',
  showLabels = true,
  showDescription = false,
  orientation = 'horizontal',
  className,
}: ModeSelectorProps) {
  const { t } = useI18n();
  const currentMode = useCurrentMode();
  const isTransitioning = useIsTransitioning();
  const transitionProgress = useTransitionProgress();
  const actions = useBehaviorTreeStore((state) => state.actions);

  // 处理模式切换
  const handleModeSwitch = async (targetMode: WorkflowMode) => {
    if (currentMode === targetMode || isTransitioning) {
      return;
    }

    try {
      await actions.switchToMode(targetMode);
    } catch (error) {
      console.error('Failed to switch mode:', error);
    }
  };

  // 顶部模式旁不显示加载/状态图标，保持简洁

  // 检查模式是否可切换
  const canSwitchToMode = (mode: WorkflowMode) => {
    if (isTransitioning) return false;
    if (currentMode === mode) return false;
    
    // TODO: 添加具体的模式切换验证逻辑
    return true;
  };

  // 渲染单个模式按钮/标签
  const renderModeItem = (config: ModeConfig) => {
    const { mode, icon: Icon, labelKey, descriptionKey, color, activeColor } = config;
    const isActive = currentMode === mode;
    const canSwitch = canSwitchToMode(mode);
    const statusIndicator = null;

    const baseClasses = cn(
      'relative flex items-center gap-2 transition-all duration-200',
      orientation === 'vertical' && 'w-full justify-start',
      !canSwitch && 'opacity-50 cursor-not-allowed'
    );

    const sizeClasses = {
      sm: 'px-2 py-1 text-xs',
      md: 'px-3 py-2 text-sm',
      lg: 'px-4 py-3 text-base',
    };

    const variantClasses = {
      tabs: cn(
        'border-b-2 border-transparent hover:border-gray-300',
        isActive && 'border-current',
        isActive ? activeColor : color
      ),
      pills: cn(
        'rounded-full border',
        isActive ? activeColor : `border-transparent hover:bg-gray-50 ${color}`
      ),
      buttons: cn(
        'rounded-md border border-gray-200 hover:bg-gray-50',
        isActive && activeColor,
        !isActive && color
      ),
    };

    const content = (
      <div className={cn(baseClasses, sizeClasses[size], variantClasses[variant])}>
        <Icon className={cn('h-4 w-4', size === 'sm' && 'h-3 w-3', size === 'lg' && 'h-5 w-5')} />
        
        {showLabels && (
          <span className="font-medium">
            {t(labelKey)}
          </span>
        )}
        
        {statusIndicator && (
          <div className="ml-auto">
            {statusIndicator}
          </div>
        )}
        
        {/* 不显示模式按钮内的进度条 */}
      </div>
    );

    const button = (
      <Button
        variant="ghost"
        size="sm"
        className={cn('h-auto p-0', !canSwitch && 'pointer-events-none')}
        onClick={() => canSwitch && handleModeSwitch(mode)}
        disabled={!canSwitch}
      >
        {content}
      </Button>
    );

    // 如果需要显示描述，包装在 Tooltip 中
    if (showDescription) {
      return (
        <TooltipProvider key={mode}>
          <Tooltip>
            <TooltipTrigger asChild>
              {button}
            </TooltipTrigger>
            <TooltipContent side={orientation === 'vertical' ? 'right' : 'bottom'}>
              <div className="max-w-xs">
                <div className="font-semibold">{t(labelKey)}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {t(descriptionKey)}
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return (
      <div key={mode}>
        {button}
      </div>
    );
  };

  return (
    <div
      className={cn(
        'flex',
        orientation === 'vertical' ? 'flex-col space-y-1' : 'flex-row space-x-1',
        variant === 'tabs' && orientation === 'horizontal' && 'border-b border-gray-200',
        className
      )}
      role="tablist"
      aria-orientation={orientation}
    >
      {modeConfigs.map(renderModeItem)}
      
      {/* 顶部不再展示全局过渡状态提示 */}
    </div>
  );
}

// 紧凑版模式选择器（仅图标）
export function CompactModeSelector({ className }: { className?: string }) {
  return (
    <ModeSelector
      variant="pills"
      size="sm"
      showLabels={false}
      showDescription={true}
      className={className}
    />
  );
}

// 垂直模式选择器（侧边栏使用）
export function VerticalModeSelector({ className }: { className?: string }) {
  return (
    <ModeSelector
      variant="buttons"
      size="md"
      showLabels={true}
      showDescription={true}
      orientation="vertical"
      className={className}
    />
  );
}

// 顶部标签页模式选择器
export function TabModeSelector({ className }: { className?: string }) {
  return (
    <ModeSelector
      variant="tabs"
      size="md"
      showLabels={true}
      showDescription={false}
      orientation="horizontal"
      className={className}
    />
  );
}
