import React, { useState, useCallback } from 'react';
import { cn } from '@/core/utils/utils';
import { ResizablePanel, ResizablePanelGroup, ResizableHandle } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  useDebugActions,
  useDebugSession,
  useExecutionStatus,
  useBreakpoints,
  useCallStack,
  useWatchVariables,
  useDebugLogs
} from '@/core/store/behavior-tree-store';
import { useI18n } from '@/hooks/use-i18n';
import { 
  ChevronLeft,
  ChevronRight,
  Activity,
  Monitor,
  Bug,
  AlertCircle
} from 'lucide-react';

// 延迟加载子组件
const DebugCanvas = React.lazy(() => import('./debug-canvas'));
const DebugToolbar = React.lazy(() => import('./debug-toolbar'));
const StateMonitorPanel = React.lazy(() => import('./state-monitor-panel'));
const BreakpointPanel = React.lazy(() => import('./breakpoint-panel'));
const CallStackPanel = React.lazy(() => import('./call-stack-panel'));
const WatchVariablesPanel = React.lazy(() => import('./watch-variables-panel'));
const DebugLogsPanel = React.lazy(() => import('./debug-logs-panel'));

interface DebugLayoutProps {
  children?: React.ReactNode;
  className?: string;
}

// 面板折叠控制器
function PanelToggle({ 
  isExpanded, 
  onToggle, 
  position 
}: { 
  isExpanded: boolean; 
  onToggle: () => void; 
  position: 'left' | 'right' 
}) {
  const Icon = position === 'left' 
    ? (isExpanded ? ChevronLeft : ChevronRight)
    : (isExpanded ? ChevronRight : ChevronLeft);

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onToggle}
      className="h-8 w-6 p-0 rounded-none border-l border-r"
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
}

// 调试状态指示器
function DebugStatusIndicator() {
  const { t } = useI18n();
  const debugSession = useDebugSession();
  const executionStatus = useExecutionStatus();
  const breakpoints = useBreakpoints();
  const logs = useDebugLogs();

  const getStatusColor = () => {
    if (!debugSession) return 'bg-gray-500';
    switch (executionStatus) {
      case 'running': return 'bg-green-500';
      case 'paused': return 'bg-yellow-500';
      case 'stopped': return 'bg-red-500';
      default: return 'bg-blue-500';
    }
  };

  const getStatusText = () => {
    if (!debugSession) return t('debug:status.disconnected');
    switch (executionStatus) {
      case 'running': return t('debug:status.running');
      case 'paused': return t('debug:status.paused');
      case 'stopped': return t('debug:status.stopped');
      default: return t('debug:status.idle');
    }
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b bg-muted/30">
      <div className="flex items-center gap-2">
        <div className={cn('w-2 h-2 rounded-full', getStatusColor())} />
        <span className="text-sm font-medium">{getStatusText()}</span>
      </div>
      
      <div className="flex items-center gap-3 ml-auto">
        <div className="flex items-center gap-1">
          <Bug className="h-4 w-4 text-muted-foreground" />
          <Badge variant="secondary" className="text-xs">
            {Object.keys(breakpoints).length}
          </Badge>
        </div>
        
        <div className="flex items-center gap-1">
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
          <Badge variant="secondary" className="text-xs">
            {logs.filter(log => log.level === 'error').length}
          </Badge>
        </div>
      </div>
    </div>
  );
}

// 左侧调试面板
function LeftDebugPanel({ 
  isExpanded, 
  onToggle 
}: { 
  isExpanded: boolean; 
  onToggle: () => void 
}) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<'breakpoints' | 'callstack' | 'variables'>('breakpoints');

  if (!isExpanded) return null;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-2 border-b bg-muted/50">
        <div className="flex items-center gap-2">
          <Bug className="h-4 w-4" />
          <h3 className="font-medium text-sm">{t('debug:panels.debugger')}</h3>
        </div>
        <PanelToggle 
          isExpanded={true}
          onToggle={onToggle}
          position="left"
        />
      </div>

      {/* 标签页切换 */}
      <div className="flex border-b">
        <button
          className={cn(
            'flex-1 px-3 py-2 text-xs font-medium transition-colors',
            activeTab === 'breakpoints' 
              ? 'bg-background border-b-2 border-primary text-primary' 
              : 'text-muted-foreground hover:text-foreground'
          )}
          onClick={() => setActiveTab('breakpoints')}
        >
          {t('debug:tabs.breakpoints')}
        </button>
        <button
          className={cn(
            'flex-1 px-3 py-2 text-xs font-medium transition-colors',
            activeTab === 'callstack' 
              ? 'bg-background border-b-2 border-primary text-primary' 
              : 'text-muted-foreground hover:text-foreground'
          )}
          onClick={() => setActiveTab('callstack')}
        >
          {t('debug:tabs.callStack')}
        </button>
        <button
          className={cn(
            'flex-1 px-3 py-2 text-xs font-medium transition-colors',
            activeTab === 'variables' 
              ? 'bg-background border-b-2 border-primary text-primary' 
              : 'text-muted-foreground hover:text-foreground'
          )}
          onClick={() => setActiveTab('variables')}
        >
          {t('debug:tabs.variables')}
        </button>
      </div>

      {/* 面板内容 */}
      <div className="flex-1 min-h-0">
        <React.Suspense fallback={
          <div className="flex-1 flex items-center justify-center">
            <div className="text-sm text-muted-foreground">{t('common:loading')}</div>
          </div>
        }>
          {activeTab === 'breakpoints' && <BreakpointPanel />}
          {activeTab === 'callstack' && <CallStackPanel />}
          {activeTab === 'variables' && <WatchVariablesPanel />}
        </React.Suspense>
      </div>
    </div>
  );
}

// 右侧状态监控面板
function RightMonitorPanel({ 
  isExpanded, 
  onToggle 
}: { 
  isExpanded: boolean; 
  onToggle: () => void 
}) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<'monitor' | 'logs'>('monitor');

  if (!isExpanded) return null;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-2 border-b bg-muted/50">
        <div className="flex items-center gap-2">
          <Monitor className="h-4 w-4" />
          <h3 className="font-medium text-sm">{t('debug:panels.monitor')}</h3>
        </div>
        <PanelToggle 
          isExpanded={true}
          onToggle={onToggle}
          position="right"
        />
      </div>

      {/* 标签页切换 */}
      <div className="flex border-b">
        <button
          className={cn(
            'flex-1 px-3 py-2 text-xs font-medium transition-colors',
            activeTab === 'monitor' 
              ? 'bg-background border-b-2 border-primary text-primary' 
              : 'text-muted-foreground hover:text-foreground'
          )}
          onClick={() => setActiveTab('monitor')}
        >
          {t('debug:tabs.monitor')}
        </button>
        <button
          className={cn(
            'flex-1 px-3 py-2 text-xs font-medium transition-colors',
            activeTab === 'logs' 
              ? 'bg-background border-b-2 border-primary text-primary' 
              : 'text-muted-foreground hover:text-foreground'
          )}
          onClick={() => setActiveTab('logs')}
        >
          {t('debug:tabs.logs')}
        </button>
      </div>

      {/* 面板内容 */}
      <div className="flex-1 min-h-0">
        <React.Suspense fallback={
          <div className="flex-1 flex items-center justify-center">
            <div className="text-sm text-muted-foreground">{t('common:loading')}</div>
          </div>
        }>
          {activeTab === 'monitor' && <StateMonitorPanel />}
          {activeTab === 'logs' && <DebugLogsPanel />}
        </React.Suspense>
      </div>
    </div>
  );
}

// 主调试布局组件
export default function DebugLayout({ children, className }: DebugLayoutProps) {
  const { t } = useI18n();
  
  // 面板状态
  const [leftPanelExpanded, setLeftPanelExpanded] = useState(true);
  const [rightPanelExpanded, setRightPanelExpanded] = useState(true);
  const [leftPanelSize, setLeftPanelSize] = useState(25);
  const [rightPanelSize, setRightPanelSize] = useState(25);

  const handleToggleLeftPanel = useCallback(() => {
    setLeftPanelExpanded(!leftPanelExpanded);
  }, [leftPanelExpanded]);

  const handleToggleRightPanel = useCallback(() => {
    setRightPanelExpanded(!rightPanelExpanded);
  }, [rightPanelExpanded]);

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* 调试工具栏 */}
      <React.Suspense fallback={
        <div className="h-12 border-b bg-muted/50 animate-pulse" />
      }>
        <DebugToolbar />
      </React.Suspense>

      {/* 调试状态指示器 */}
      <DebugStatusIndicator />
      
      {/* 主要内容区域 */}
      <div className="flex-1 min-h-0">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* 左侧调试面板 */}
          {leftPanelExpanded && (
            <>
              <ResizablePanel 
                defaultSize={leftPanelSize}
                minSize={15}
                maxSize={40}
                onResize={setLeftPanelSize}
                className="border-r"
              >
                <LeftDebugPanel 
                  isExpanded={leftPanelExpanded}
                  onToggle={handleToggleLeftPanel}
                />
              </ResizablePanel>
              <ResizableHandle withHandle />
            </>
          )}

          {/* 中央调试画布区域 */}
          <ResizablePanel defaultSize={leftPanelExpanded && rightPanelExpanded ? 50 : 75}>
            <div className="h-full flex flex-col relative">
              {/* 左侧面板折叠按钮 */}
              {!leftPanelExpanded && (
                <div className="absolute top-2 left-2 z-10">
                  <PanelToggle 
                    isExpanded={false}
                    onToggle={handleToggleLeftPanel}
                    position="left"
                  />
                </div>
              )}

              {/* 右侧面板折叠按钮 */}
              {!rightPanelExpanded && (
                <div className="absolute top-2 right-2 z-10">
                  <PanelToggle 
                    isExpanded={false}
                    onToggle={handleToggleRightPanel}
                    position="right"
                  />
                </div>
              )}

              {/* 调试画布组件 */}
              <React.Suspense fallback={
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <Activity className="h-12 w-12 mx-auto text-muted-foreground" />
                    <div className="text-lg font-medium">{t('debug:canvas.loading')}</div>
                    <div className="text-sm text-muted-foreground">{t('debug:canvas.loadingDesc')}</div>
                  </div>
                </div>
              }>
                <DebugCanvas>
                  {children}
                </DebugCanvas>
              </React.Suspense>
            </div>
          </ResizablePanel>

          {/* 右侧状态监控面板 */}
          {rightPanelExpanded && (
            <>
              <ResizableHandle withHandle />
              <ResizablePanel 
                defaultSize={rightPanelSize}
                minSize={15}
                maxSize={40}
                onResize={setRightPanelSize}
                className="border-l"
              >
                <RightMonitorPanel 
                  isExpanded={rightPanelExpanded}
                  onToggle={handleToggleRightPanel}
                />
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>
    </div>
  );
}