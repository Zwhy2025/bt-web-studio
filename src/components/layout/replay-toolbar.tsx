import React, { useState, useCallback } from 'react';
import { cn } from '@/core/utils/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  useReplaySession,
  useReplayActions,
  useCurrentTime,
  useVisibleEvents,
  useTimelineMarkers,
  useReplayEvents,
  useTimelineState,
  useEventFilters
} from '@/core/store/behavior-tree-store';
import { useI18n } from '@/hooks/use-i18n';
import { 
  FolderOpen,
  Save,
  Download,
  Upload,
  Settings,
  FileText,
  Calendar,
  Clock,
  Activity,
  Filter,
  Search,
  RefreshCw,
  BarChart3,
  Eye,
  EyeOff,
  Maximize,
  Minimize,
  ChevronDown
} from 'lucide-react';

interface ReplayToolbarProps {
  className?: string;
}

// 会话管理组件
function SessionControls() {
  const { t } = useI18n();
  const replaySession = useReplaySession();
  const replayActions = useReplayActions();
  const [isLoading, setIsLoading] = useState(false);

  const handleLoadSession = useCallback(async () => {
    setIsLoading(true);
    try {
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = '.json,.log,.txt';
      fileInput.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;
        const text = await file.text();
        let events: any[] = [];
        try {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed)) events = parsed;
          else if (Array.isArray((parsed as any).events)) events = (parsed as any).events;
        } catch {
          const lines = text.split(/\r?\n/).filter(l => l.trim());
          const start = Date.now();
          events = lines.map((line, idx) => ({
            id: `${idx}`,
            timestamp: start + idx * 10,
            nodeId: 'node-1',
            type: 'node_tick',
            status: 'success',
            data: { line }
          }));
        }
        const normalized = events.map((e, idx) => ({
          id: e.id ?? String(idx),
          timestamp: typeof e.timestamp === 'number' ? e.timestamp : Date.now() + idx * 10,
          nodeId: e.nodeId ?? e.node_id ?? 'node-1',
          type: e.type ?? 'node_tick',
          status: e.status ?? 'success',
          data: e.data ?? e.payload ?? null,
        }));
        await replayActions.createSessionFromEvents(normalized, { source: file.name });
      };
      fileInput.click();
    } finally {
      setIsLoading(false);
    }
  }, [replayActions]);

  const handleSaveSession = useCallback(() => {
    if (replaySession) {
      // @ts-ignore: different shape during replay
      replayActions.saveSession(replaySession);
    }
  }, [replaySession, replayActions]);

  const handleExportSession = useCallback(() => {
    if (replaySession) {
      replayActions.exportSession('json');
    }
  }, [replaySession, replayActions]);

  return (
    <div className="flex items-center gap-1">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLoadSession}
              disabled={isLoading}
              className="h-8 gap-1"
            >
              <FolderOpen className="h-4 w-4" />
              <span className="hidden lg:inline">{t('replay:toolbar.load')}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('replay:toolbar.loadSession')}</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {replaySession && (
        <>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleSaveSession}
                  className="h-8 gap-1"
                >
                  <Save className="h-4 w-4" />
                  <span className="hidden lg:inline">{t('replay:toolbar.save')}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('replay:toolbar.saveSession')}</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 gap-1">
                <Download className="h-4 w-4" />
                <span className="hidden lg:inline">{t('replay:toolbar.export')}</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>{t('replay:toolbar.exportFormats')}</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => replayActions.exportReplaySession('json')}>
                <FileText className="h-4 w-4 mr-2" />
                JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => replayActions.exportReplaySession('csv')}>
                <FileText className="h-4 w-4 mr-2" />
                CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => replayActions.exportReplaySession('log')}>
                <FileText className="h-4 w-4 mr-2" />
                Log File
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}
    </div>
  );
}

// 过滤控制组件
function FilterControls() {
  const { t } = useI18n();
  const replayActions = useReplayActions();
  const timelineMarkers = useTimelineMarkers();
  const visibleEvents = useVisibleEvents();
  const replayEvents = useReplayEvents();
  const eventFilters = useEventFilters();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const eventTypes = ['node_enter', 'node_exit', 'node_success', 'node_failure', 'blackboard_update'];

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    replayActions.searchEvents(query);
  }, [replayActions]);

  const handleTypeFilter = useCallback((type: string, enabled: boolean) => {
    const existing = new Set(eventFilters.eventTypes);
    if (enabled) existing.add(type as any);
    else existing.delete(type as any);
    replayActions.filterEvents({ eventTypes: Array.from(existing) as any });
  }, [replayActions, eventFilters.eventTypes]);

  // 事件级别过滤未在状态中实现，这里先省略

  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
    replayActions.clearEventFilter();
  }, [replayActions]);

  return (
    <div className="flex items-center gap-2">
      {/* 搜索框 */}
      <div className="relative">
        <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t('replay:toolbar.searchEvents')}
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-8 h-8 w-40"
        />
      </div>

      {/* 过滤器下拉菜单 */}
      <DropdownMenu open={showFilters} onOpenChange={setShowFilters}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 gap-1">
            <Filter className="h-4 w-4" />
            <span className="hidden lg:inline">{t('replay:toolbar.filters')}</span>
            <Badge variant="secondary" className="text-xs">
              {visibleEvents.length}/{replayEvents?.length || 0}
            </Badge>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>{t('replay:toolbar.eventTypes')}</DropdownMenuLabel>
          {eventTypes.map((type) => (
            <DropdownMenuCheckboxItem
              key={type}
              checked={eventFilters.eventTypes.includes(type as any)}
              onCheckedChange={(checked) => handleTypeFilter(type, !!checked)}
            >
              {t(`replay:events.types.${type}`)}
            </DropdownMenuCheckboxItem>
          ))}
          
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleClearFilters}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('replay:toolbar.clearFilters')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// 视图控制组件
function ViewControls() {
  const { t } = useI18n();
  const replayActions = useReplayActions();
  const [showExecutionPath, setShowExecutionPath] = useState(true);
  const [showNodeAnimations, setShowNodeAnimations] = useState(true);
  const [showEventMarkers, setShowEventMarkers] = useState(true);

  const handleToggleExecutionPath = useCallback(() => {
    const newValue = !showExecutionPath;
    setShowExecutionPath(newValue);
    replayActions.setVisualizationOption('showExecutionPath', newValue);
  }, [showExecutionPath, replayActions]);

  const handleToggleNodeAnimations = useCallback(() => {
    const newValue = !showNodeAnimations;
    setShowNodeAnimations(newValue);
    replayActions.setVisualizationOption('showNodeAnimations', newValue);
  }, [showNodeAnimations, replayActions]);

  const handleToggleEventMarkers = useCallback(() => {
    const newValue = !showEventMarkers;
    setShowEventMarkers(newValue);
    replayActions.setVisualizationOption('showEventMarkers', newValue);
  }, [showEventMarkers, replayActions]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 gap-1">
          <Eye className="h-4 w-4" />
          <span className="hidden lg:inline">{t('replay:toolbar.view')}</span>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{t('replay:toolbar.visualizations')}</DropdownMenuLabel>
        
        <DropdownMenuCheckboxItem
          checked={showExecutionPath}
          onCheckedChange={handleToggleExecutionPath}
        >
          <Activity className="h-4 w-4 mr-2" />
          {t('replay:toolbar.executionPath')}
        </DropdownMenuCheckboxItem>
        
        <DropdownMenuCheckboxItem
          checked={showNodeAnimations}
          onCheckedChange={handleToggleNodeAnimations}
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          {t('replay:toolbar.nodeAnimations')}
        </DropdownMenuCheckboxItem>
        
        <DropdownMenuCheckboxItem
          checked={showEventMarkers}
          onCheckedChange={handleToggleEventMarkers}
        >
          <Calendar className="h-4 w-4 mr-2" />
          {t('replay:toolbar.eventMarkers')}
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// 会话信息组件
function SessionInfo() {
  const { t } = useI18n();
  const replaySession = useReplaySession();
  const timelineState = useTimelineState();

  if (!replaySession) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs">
          {t('replay:toolbar.noSession')}
        </Badge>
      </div>
    );
  }

  const formatDuration = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">{replaySession.name}</span>
      </div>
      
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Clock className="h-3 w-3" />
        <span>{formatDuration(replaySession.duration)}</span>
      </div>
      
      <Badge 
        variant={timelineState.isPlaying ? "default" : "secondary"} 
        className="text-xs"
      >
        {timelineState.isPlaying ? t('replay:status.playing') : t('replay:status.paused')}
      </Badge>
    </div>
  );
}

// 主回放工具栏组件
export default function ReplayToolbar({ className }: ReplayToolbarProps) {
  const { t } = useI18n();

  return (
    <div className={cn(
      'flex items-center justify-between gap-2 px-3 py-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
      className
    )}>
      {/* 左侧会话控制 */}
      <div className="flex items-center gap-2">
        <SessionControls />
        <Separator orientation="vertical" className="h-5" />
        <FilterControls />
      </div>

      {/* 中央会话信息 */}
      <div className="flex-1 flex justify-center">
        <SessionInfo />
      </div>

      {/* 右侧视图控制 */}
      <div className="flex items-center gap-2">
        <ViewControls />
      </div>
    </div>
  );
}
