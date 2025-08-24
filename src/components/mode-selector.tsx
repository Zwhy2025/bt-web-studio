import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  const [animatingMode, setAnimatingMode] = useState<WorkflowMode | null>(null);
  const prevModeRef = useRef(currentMode);
  const containerRef = useRef<HTMLDivElement | null>(null)
  const itemRefs = useRef<Record<WorkflowMode, HTMLDivElement | null>>({
    [WorkflowMode.COMPOSER]: null,
    [WorkflowMode.DEBUG]: null,
    [WorkflowMode.REPLAY]: null,
  })

  // 波浪与推挤/弹入状态
  const [wave, setWave] = useState<{
    from: WorkflowMode
    to: WorkflowMode
    key: number
  } | null>(null)
  const [hitMode, setHitMode] = useState<WorkflowMode | null>(null)
  useEffect(() => {
    if (prevModeRef.current !== currentMode) {
      const from = prevModeRef.current
      const to = currentMode
      setWave({ from, to, key: Date.now() })
      setAnimatingMode(currentMode)
      // 计算中间按钮“被波经过”的时间点（仅 tabs 横向）
      if (containerRef.current && orientation === 'horizontal') {
        const order = [WorkflowMode.COMPOSER, WorkflowMode.DEBUG, WorkflowMode.REPLAY]
        const aIdx = order.indexOf(from)
        const bIdx = order.indexOf(to)
        if (Math.abs(aIdx - bIdx) === 2) {
          const mid = order[1]
          const c = containerRef.current.getBoundingClientRect()
          const ax = itemRefs.current[from]?.getBoundingClientRect().left ?? 0
          const bx = itemRefs.current[to]?.getBoundingClientRect().left ?? 0
          const mx = itemRefs.current[mid]?.getBoundingClientRect().left ?? 0
          const fromX = ax + (itemRefs.current[from]?.getBoundingClientRect().width ?? 0) / 2
          const toX = bx + (itemRefs.current[to]?.getBoundingClientRect().width ?? 0) / 2
          const midX = mx + (itemRefs.current[mid]?.getBoundingClientRect().width ?? 0) / 2
          const total = Math.abs(toX - fromX) || 1
          const frac = Math.min(1, Math.max(0, Math.abs(midX - fromX) / total))
          const arriveMs = 650 * frac
          const hold = 180
          const t1 = window.setTimeout(() => setHitMode(mid), arriveMs)
          const t2 = window.setTimeout(() => setHitMode(null), arriveMs + hold)
          return () => { window.clearTimeout(t1); window.clearTimeout(t2) }
        } else {
          setHitMode(null)
        }
      }
      const t = setTimeout(() => {
        setAnimatingMode(null)
        setWave(null)
        setHitMode(null)
      }, 300)
      prevModeRef.current = currentMode
      return () => clearTimeout(t)
    }
  }, [currentMode])

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
      'relative flex items-center gap-2 transition-all duration-500 overflow-hidden',
      orientation === 'vertical' && 'w-full justify-start',
      !canSwitch && 'opacity-50 cursor-not-allowed'
    );

    const sizeClasses = {
      sm: 'px-2 py-1 text-xs',
      md: 'px-3 py-2 text-sm',
      lg: 'px-4 py-3 text-base',
    };

    const emphasisMap: Record<WorkflowMode, string> = {
      [WorkflowMode.COMPOSER]: 'ring-1 ring-blue-400/40 shadow-[0_0_0_4px_rgba(59,130,246,.10)]',
      [WorkflowMode.DEBUG]: 'ring-1 ring-orange-400/40 shadow-[0_0_0_4px_rgba(251,146,60,.10)]',
      [WorkflowMode.REPLAY]: 'ring-1 ring-green-400/40 shadow-[0_0_0_4px_rgba(34,197,94,.10)]',
    };

    const variantClasses = {
      tabs: cn(
        'border-b-2 border-transparent hover:border-gray-300',
        isActive && 'border-current',
        isActive ? cn(activeColor, 'rounded-md', emphasisMap[mode]) : color
      ),
      pills: cn(
        'rounded-full border',
        isActive ? cn(activeColor, emphasisMap[mode]) : `border-transparent hover:bg-gray-50 ${color}`
      ),
      buttons: cn(
        'rounded-md border border-gray-200 hover:bg-gray-50',
        isActive ? cn(activeColor, emphasisMap[mode]) : color
      ),
    };

    const isOutgoing = wave?.from === mode
    const isIncoming = wave?.to === mode
    const isHit = hitMode === mode

    const content = (
      <div
        ref={(el) => (itemRefs.current[mode] = el)}
        className={cn(
          baseClasses,
          sizeClasses[size],
          variantClasses[variant],
          (isOutgoing || isIncoming || isHit) && 'mode-contrast-boost',
          isHit && 'bg-accent/30',
          isOutgoing && 'mode-outgoing',
          isIncoming && 'mode-incoming'
        )}
      >
        {isActive && animatingMode === mode && (
          <span
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full opacity-30 mode-droplet animate-droplet"
            aria-hidden="true"
          />
        )}
        <Icon className={cn('h-4 w-4 relative z-10', size === 'sm' && 'h-3 w-3', size === 'lg' && 'h-5 w-5')} />
        
        {showLabels && (
          <span className="font-medium relative z-10">
            {t(labelKey)}
          </span>
        )}
        
        {statusIndicator && (
          <div className="ml-auto relative z-10">
            {statusIndicator}
          </div>
        )}
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
      ref={containerRef}
      className={cn(
        'relative flex',
        orientation === 'vertical' ? 'flex-col space-y-1' : 'flex-row space-x-1',
        variant === 'tabs' && orientation === 'horizontal' && 'border-b border-gray-200',
        className
      )}
      role="tablist"
      aria-orientation={orientation}
    >
      {variant === 'tabs' && orientation === 'horizontal' && wave && containerRef.current && (
        <RippleOverlay
          key={`ripple-${wave.key}`}
          container={containerRef.current}
          fromEl={itemRefs.current[wave.from]}
          toEl={itemRefs.current[wave.to]}
          toMode={wave.to}
        />
      )}
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


// 扩散涟漪覆盖层（径向渐变扩大）
function RippleOverlay({
  container,
  fromEl,
  toEl,
  toMode,
}: {
  container: HTMLElement
  fromEl: HTMLElement | null
  toEl: HTMLElement | null
  toMode: WorkflowMode
}) {
  const [geom, setGeom] = useState<{
    cx: number
    cy: number
    scale: number
  } | null>(null)

  useEffect(() => {
    if (!fromEl || !toEl) return
    const c = container.getBoundingClientRect()
    const a = fromEl.getBoundingClientRect()
    const b = toEl.getBoundingClientRect()
    const fromX = a.left + a.width / 2 - c.left
    const fromY = a.top + a.height / 2 - c.top
    const toX = b.left + b.width / 2 - c.left
    const toY = b.top + b.height / 2 - c.top
    const dx = toX - fromX
    const dy = toY - fromY
    const dist = Math.sqrt(dx * dx + dy * dy)
    const base = 48
    const scale = Math.max(1.4, (dist + 40) / (base / 2))
    setGeom({ cx: fromX, cy: fromY, scale })
  }, [container, fromEl, toEl])

  const colorClass = useMemo(() => {
    switch (toMode) {
      case WorkflowMode.COMPOSER:
        return 'text-blue-400'
      case WorkflowMode.DEBUG:
        return 'text-orange-400'
      case WorkflowMode.REPLAY:
        return 'text-green-400'
      default:
        return 'text-primary'
    }
  }, [toMode])

  if (!geom) return null

  const style: React.CSSProperties = {
    left: geom.cx,
    top: geom.cy,
    ['--ripple-scale' as any]: geom.scale,
    ['--ripple-size' as any]: '48px',
  }

  return (
    <div className={cn('absolute pointer-events-none z-0', colorClass)} style={{ left: 0, top: 0, right: 0, bottom: 0 }} aria-hidden>
      <div className="mode-wave-ripple" style={style} />
    </div>
  )
}
