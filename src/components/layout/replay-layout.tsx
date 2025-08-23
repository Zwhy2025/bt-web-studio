import React, { useState, useCallback } from 'react';
import { cn } from '@/core/utils/utils';
import { ResizablePanel, ResizablePanelGroup, ResizableHandle } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  useReplayActions,
  useReplaySession,
  useReplayStatus,
  useCurrentTime,
  useVisibleEvents,
  useTimelineMarkers,
  useAnalysisResult
} from '@/core/store/behavior-tree-store';
import { useI18n } from '@/hooks/use-i18n';
import { 
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  Clock,
  Activity,
  BarChart3,
  Search,
  Filter,
  Calendar
} from 'lucide-react';

// 延迟加载子组件
const ReplayCanvas = React.lazy(() => import('./replay-canvas'));
const ReplayToolbar = React.lazy(() => import('./replay-toolbar'));
const TimelineController = React.lazy(() => import('./timeline-controller'));
const EventInspectorPanel = React.lazy(() => import('./event-inspector-panel'));
const DataAnalysisPanel = React.lazy(() => import('./data-analysis-panel'));

interface ReplayLayoutProps {
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

// 回放状态指示器
function ReplayStatusIndicator() {
  const { t } = useI18n();
  const replaySession = useReplaySession();
  const replayStatus = useReplayStatus();
  const currentTime = useCurrentTime();
  const visibleEvents = useVisibleEvents();

  const getStatusColor = () => {
    switch (replayStatus) {
      case 'playing': return 'bg-green-500';
      case 'paused': return 'bg-yellow-500';
      case 'stopped': return 'bg-red-500';
      case 'loading': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (replayStatus) {
      case 'playing': return t('replay:status.playing');
      case 'paused': return t('replay:status.paused');
      case 'stopped': return t('replay:status.stopped');
      case 'loading': return t('replay:status.loading');
      default: return t('replay:status.idle');
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b bg-muted/30">
      <div className="flex items-center gap-2">
        <div className={cn('w-2 h-2 rounded-full', getStatusColor())} />
        <span className="text-sm font-medium">{getStatusText()}</span>
      </div>
      
      {replaySession && (
        <>
          <div className="flex items-center gap-3 ml-auto">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{formatTime(currentTime)}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <Badge variant="secondary" className="text-xs">
                {visibleEvents.length} {t('replay:events.count')}
              </Badge>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// 左侧事件面板
function LeftEventPanel({ 
  isExpanded, 
  onToggle 
}: { 
  isExpanded: boolean; 
  onToggle: () => void 
}) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<'events' | 'timeline'>('events');

  if (!isExpanded) return null;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-2 border-b bg-muted/50">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4" />
          <h3 className="font-medium text-sm">{t('replay:panels.events')}</h3>
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
            activeTab === 'events' 
              ? 'bg-background border-b-2 border-primary text-primary' 
              : 'text-muted-foreground hover:text-foreground'
          )}
          onClick={() => setActiveTab('events')}
        >
          {t('replay:tabs.events')}
        </button>
        <button
          className={cn(
            'flex-1 px-3 py-2 text-xs font-medium transition-colors',
            activeTab === 'timeline' 
              ? 'bg-background border-b-2 border-primary text-primary' 
              : 'text-muted-foreground hover:text-foreground'
          )}
          onClick={() => setActiveTab('timeline')}
        >
          {t('replay:tabs.timeline')}
        </button>
      </div>

      {/* 面板内容 */}
      <div className="flex-1 min-h-0">
        <React.Suspense fallback={
          <div className="flex-1 flex items-center justify-center">
            <div className="text-sm text-muted-foreground">{t('common:loading')}</div>
          </div>
        }>
          {activeTab === 'events' && <EventInspectorPanel />}
          {activeTab === 'timeline' && (
            <div className="p-3">
              <div className="text-sm text-muted-foreground text-center">
                {t('replay:timeline.embedded')}
              </div>
            </div>
          )}
        </React.Suspense>
      </div>
    </div>
  );
}

// 右侧分析面板
function RightAnalysisPanel({ 
  isExpanded, 
  onToggle 
}: { 
  isExpanded: boolean; 
  onToggle: () => void 
}) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<'analysis' | 'statistics'>('analysis');

  if (!isExpanded) return null;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-2 border-b bg-muted/50">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          <h3 className="font-medium text-sm">{t('replay:panels.analysis')}</h3>
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
            activeTab === 'analysis' 
              ? 'bg-background border-b-2 border-primary text-primary' 
              : 'text-muted-foreground hover:text-foreground'
          )}
          onClick={() => setActiveTab('analysis')}
        >
          {t('replay:tabs.analysis')}
        </button>
        <button
          className={cn(
            'flex-1 px-3 py-2 text-xs font-medium transition-colors',
            activeTab === 'statistics' 
              ? 'bg-background border-b-2 border-primary text-primary' 
              : 'text-muted-foreground hover:text-foreground'
          )}
          onClick={() => setActiveTab('statistics')}
        >
          {t('replay:tabs.statistics')}
        </button>
      </div>

      {/* 面板内容 */}
      <div className="flex-1 min-h-0">
        <React.Suspense fallback={
          <div className="flex-1 flex items-center justify-center">
            <div className="text-sm text-muted-foreground">{t('common:loading')}</div>
          </div>
        }>
          <DataAnalysisPanel activeTab={activeTab} />
        </React.Suspense>
      </div>
    </div>
  );
}

// 主回放布局组件
export default function ReplayLayout({ children, className }: ReplayLayoutProps) {
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
      {/* 回放工具栏 */}
      <React.Suspense fallback={
        <div className="h-12 border-b bg-muted/50 animate-pulse" />
      }>
        <ReplayToolbar />
      </React.Suspense>

      {/* 回放状态指示器 */}
      <ReplayStatusIndicator />
      
      {/* 主要内容区域 */}
      <div className="flex-1 min-h-0 flex flex-col">
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          {/* 左侧事件面板 */}
          {leftPanelExpanded && (
            <>
              <ResizablePanel 
                defaultSize={leftPanelSize}
                minSize={15}
                maxSize={40}
                onResize={setLeftPanelSize}
                className="border-r"
              >
                <LeftEventPanel 
                  isExpanded={leftPanelExpanded}
                  onToggle={handleToggleLeftPanel}
                />
              </ResizablePanel>
              <ResizableHandle withHandle />
            </>
          )}

          {/* 中央回放画布区域 */}
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

              {/* 回放画布组件 */}
              <div className="flex-1 min-h-0">
                <React.Suspense fallback={
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <Calendar className="h-12 w-12 mx-auto text-muted-foreground" />
                      <div className="text-lg font-medium">{t('replay:canvas.loading')}</div>
                      <div className="text-sm text-muted-foreground">{t('replay:canvas.loadingDesc')}</div>
                    </div>
                  </div>
                }>
                  <ReplayCanvas>
                    {children}
                  </ReplayCanvas>
                </React.Suspense>
              </div>
            </div>
          </ResizablePanel>

          {/* 右侧分析面板 */}
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
                <RightAnalysisPanel 
                  isExpanded={rightPanelExpanded}
                  onToggle={handleToggleRightPanel}
                />
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>

        {/* 简化的时间轴控制器 - 底部固定 */}
        <div className="border-t bg-background">
          <React.Suspense fallback={
            <div className="h-16 bg-muted/50 animate-pulse" />
          }>
            <TimelineController />
          </React.Suspense>
        </div>
      </div>
    </div>
  );
}