import React, { useState, useCallback } from 'react';
import { cn } from '@/core/utils/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Slider } from '@/components/ui/slider';
import { 
  useDebugActions,
  useDebugSession,
  useExecutionStatus,
  useBreakpoints,
  useCallStack,
  useDebugLogs
} from '@/core/store/behavior-tree-store';
import { useI18n } from '@/hooks/use-i18n';
import { 
  Play,
  Pause,
  Square,
  SkipForward,
  StepForward,
  ArrowDown,
  ArrowUp,
  RotateCcw,
  Wifi,
  WifiOff,
  Bug,
  Settings,
  Trash2,
  Download,
  Upload,
  Eye,
  EyeOff,
  Zap,
  Target,
  Activity,
  Clock,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  Link,
  Unlink
} from 'lucide-react';

interface DebugToolbarProps {
  className?: string;
}

// 连接控制组件
function ConnectionControls() {
  const { t } = useI18n();
  const debugSession = useDebugSession();
  const debugActions = useDebugActions();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = useCallback(async () => {
    setIsConnecting(true);
    try {
      if (debugSession) {
        debugActions.disconnectSession();
      } else {
        // 这里应该显示连接对话框，暂时使用默认连接
        await debugActions.connectToSession('default');
      }
    } finally {
      setIsConnecting(false);
    }
  }, [debugSession, debugActions]);

  const isConnected = !!debugSession;

  return (
    <div className="flex items-center gap-1">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant={isConnected ? "default" : "outline"}
              size="sm" 
              onClick={handleConnect}
              disabled={isConnecting}
              className="h-8 gap-1"
            >
              {isConnected ? (
                <Wifi className="h-4 w-4" />
              ) : (
                <WifiOff className="h-4 w-4" />
              )}
              <span className="hidden lg:inline">
                {isConnected ? t('debug:connection.connected') : t('debug:connection.connect')}
              </span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isConnected 
              ? t('debug:connection.disconnect') 
              : t('debug:connection.connectToDebugger')
            }
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {isConnected && debugSession && (
        <Badge variant="secondary" className="text-xs">
          {debugSession.name}
        </Badge>
      )}
    </div>
  );
}

// 执行控制组件
function ExecutionControls() {
  const { t } = useI18n();
  const executionStatus = useExecutionStatus();
  const debugActions = useDebugActions();
  const debugSession = useDebugSession();

  const isConnected = !!debugSession;
  const isRunning = executionStatus === 'running';
  const isPaused = executionStatus === 'paused';
  const isStopped = executionStatus === 'stopped';

  const controls = [
    {
      action: isRunning ? debugActions.pauseExecution : debugActions.startExecution,
      icon: isRunning ? Pause : Play,
      label: isRunning ? t('debug:controls.pause') : t('debug:controls.play'),
      shortcut: 'F5',
      disabled: !isConnected,
      variant: isRunning ? 'default' : 'outline' as const
    },
    {
      action: debugActions.stopExecution,
      icon: Square,
      label: t('debug:controls.stop'),
      shortcut: 'Shift+F5',
      disabled: !isConnected || isStopped,
      variant: 'outline' as const
    },
    {
      action: debugActions.stepInto,
      icon: ArrowDown,
      label: t('debug:controls.stepInto'),
      shortcut: 'F11',
      disabled: !isConnected || isRunning,
      variant: 'outline' as const
    },
    {
      action: debugActions.stepOver,
      icon: StepForward,
      label: t('debug:controls.stepOver'),
      shortcut: 'F10',
      disabled: !isConnected || isRunning,
      variant: 'outline' as const
    },
    {
      action: debugActions.stepOut,
      icon: ArrowUp,
      label: t('debug:controls.stepOut'),
      shortcut: 'Shift+F11',
      disabled: !isConnected || isRunning,
      variant: 'outline' as const
    },
  ];

  return (
    <div className="flex items-center gap-1">
      {controls.map(({ action, icon: Icon, label, shortcut, disabled, variant }) => (
        <TooltipProvider key={label}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={variant}
                size="sm"
                onClick={action}
                disabled={disabled}
                className="h-8 w-8 p-0"
              >
                <Icon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-center">
                <div className="font-medium">{label}</div>
                <div className="text-xs text-muted-foreground">({shortcut})</div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
    </div>
  );
}

// 执行速度控制组件
function SpeedControl() {
  const { t } = useI18n();
  const debugActions = useDebugActions();
  const [speed, setSpeed] = useState([50]);

  const handleSpeedChange = useCallback((newSpeed: number[]) => {
    setSpeed(newSpeed);
    debugActions.setExecutionSpeed(newSpeed[0]);
  }, [debugActions]);

  return (
    <div className="flex items-center gap-2 px-2">
      <Zap className="h-4 w-4 text-muted-foreground" />
      <div className="w-20">
        <Slider
          value={speed}
          onValueChange={handleSpeedChange}
          max={100}
          min={1}
          step={1}
          className="w-full"
        />
      </div>
      <span className="text-xs text-muted-foreground w-8">{speed[0]}%</span>
    </div>
  );
}

// 断点控制组件
function BreakpointControls() {
  const { t } = useI18n();
  const breakpoints = useBreakpoints();
  const debugActions = useDebugActions();

  const enabledBreakpoints = Object.values(breakpoints).filter(bp => bp.enabled).length;
  const totalBreakpoints = Object.keys(breakpoints).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 gap-1">
          <Bug className="h-4 w-4" />
          <Badge variant="secondary" className="text-xs">
            {enabledBreakpoints}/{totalBreakpoints}
          </Badge>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>{t('debug:breakpoints.title')}</DropdownMenuLabel>
        <DropdownMenuItem onClick={debugActions.clearAllBreakpoints}>
          <Trash2 className="h-4 w-4 mr-2" />
          {t('debug:breakpoints.clearAll')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {Object.values(breakpoints).slice(0, 5).map((breakpoint) => (
          <DropdownMenuCheckboxItem
            key={breakpoint.id}
            checked={breakpoint.enabled}
            onCheckedChange={() => debugActions.toggleBreakpoint(breakpoint.id)}
          >
            <div className="flex items-center justify-between w-full">
              <span className="truncate">{breakpoint.nodeId}</span>
              <Badge variant="outline" className="text-xs ml-2">
                {breakpoint.hitCount}
              </Badge>
            </div>
          </DropdownMenuCheckboxItem>
        ))}
        {totalBreakpoints > 5 && (
          <div className="px-2 py-1 text-xs text-muted-foreground">
            +{totalBreakpoints - 5} {t('common:more')}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// 可视化控制组件
function VisualizationControls() {
  const { t } = useI18n();
  const debugActions = useDebugActions();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 gap-1">
          <Eye className="h-4 w-4" />
          <span className="hidden lg:inline">{t('debug:visualization.title')}</span>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>{t('debug:visualization.options')}</DropdownMenuLabel>
        <DropdownMenuCheckboxItem 
          checked={true}
          onCheckedChange={debugActions.toggleExecutionPath}
        >
          <Activity className="h-4 w-4 mr-2" />
          {t('debug:visualization.executionPath')}
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem 
          checked={true}
          onCheckedChange={debugActions.toggleNodeStatus}
        >
          <Target className="h-4 w-4 mr-2" />
          {t('debug:visualization.nodeStatus')}
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem 
          checked={true}
          onCheckedChange={debugActions.toggleActiveNodeHighlight}
        >
          <Zap className="h-4 w-4 mr-2" />
          {t('debug:visualization.activeHighlight')}
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// 状态指示器组件
function StatusIndicator() {
  const { t } = useI18n();
  const executionStatus = useExecutionStatus();
  const debugLogs = useDebugLogs();
  const debugSession = useDebugSession();

  const errorCount = debugLogs.filter(log => log.level === 'error').length;
  const warningCount = debugLogs.filter(log => log.level === 'warning').length;

  const getStatusIcon = () => {
    if (!debugSession) return <WifiOff className="h-4 w-4 text-gray-500" />;
    
    switch (executionStatus) {
      case 'running':
        return <Activity className="h-4 w-4 text-green-500 animate-pulse" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-500" />;
      case 'stopped':
        return <Square className="h-4 w-4 text-red-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* 执行状态 */}
      <div className="flex items-center gap-1">
        {getStatusIcon()}
        <span className="text-sm hidden lg:inline">
          {debugSession ? t(`debug:status.${executionStatus}`) : t('debug:status.disconnected')}
        </span>
      </div>

      {/* 错误和警告计数 */}
      {(errorCount > 0 || warningCount > 0) && (
        <>
          <Separator orientation="vertical" className="h-4" />
          {errorCount > 0 && (
            <div className="flex items-center gap-1">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <Badge variant="destructive" className="text-xs">
                {errorCount}
              </Badge>
            </div>
          )}
          {warningCount > 0 && (
            <div className="flex items-center gap-1">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <Badge variant="secondary" className="text-xs">
                {warningCount}
              </Badge>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// 主调试工具栏组件
export default function DebugToolbar({ className }: DebugToolbarProps) {
  const { t } = useI18n();

  return (
    <div className={cn(
      'flex items-center justify-between gap-2 px-3 py-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
      className
    )}>
      {/* 左侧控制组 */}
      <div className="flex items-center gap-2">
        <ConnectionControls />
        <Separator orientation="vertical" className="h-5" />
        <ExecutionControls />
        <Separator orientation="vertical" className="h-5" />
        <SpeedControl />
      </div>

      {/* 中央工具组 */}
      <div className="flex items-center gap-2">
        <BreakpointControls />
        <VisualizationControls />
      </div>

      {/* 右侧状态组 */}
      <div className="flex items-center gap-2">
        <StatusIndicator />
      </div>
    </div>
  );
}