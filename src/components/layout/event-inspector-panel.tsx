import React, { useState, useMemo, useCallback } from 'react';
import { cn } from '@/core/utils/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { 
  useReplaySession,
  useVisibleEvents,
  useCurrentTime,
  useReplayActions,
  useEventFilters
} from '@/core/store/behavior-tree-store';
import { useI18n } from '@/hooks/use-i18n';
import { 
  Activity,
  Search,
  Filter,
  Clock,
  Play,
  Pause,
  ChevronRight,
  ChevronDown,
  Eye,
  EyeOff,
  Target,
  AlertCircle,
  CheckCircle,
  Info,
  XCircle,
  Calendar,
  Hash,
  Type,
  Settings
} from 'lucide-react';

interface EventInspectorPanelProps {
  className?: string;
}

// 事件类型定义
interface ReplayEvent {
  id: string;
  timestamp: number;
  type: 'node_enter' | 'node_exit' | 'node_success' | 'node_failure' | 'blackboard_update' | 'custom';
  nodeId?: string;
  data?: Record<string, any>;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  category: string;
}

// 事件级别颜色映射
const getEventLevelColor = (level: string) => {
  switch (level) {
    case 'error': return 'text-red-600 bg-red-50 border-red-200';
    case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'info': return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'debug': return 'text-gray-600 bg-gray-50 border-gray-200';
    default: return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

// 事件级别图标
const getEventLevelIcon = (level: string) => {
  switch (level) {
    case 'error': return XCircle;
    case 'warning': return AlertCircle;
    case 'info': return Info;
    case 'debug': return CheckCircle;
    default: return Info;
  }
};

// 事件类型图标
const getEventTypeIcon = (type: string) => {
  switch (type) {
    case 'node_enter': return Play;
    case 'node_exit': return Pause;
    case 'node_success': return CheckCircle;
    case 'node_failure': return XCircle;
    case 'blackboard_update': return Activity;
    default: return Target;
  }
};

// 事件搜索和过滤组件
function EventFilters() {
  const { t } = useI18n();
  const eventFilters = useEventFilters();
  const replayActions = useReplayActions();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const eventTypes = ['node_enter', 'node_exit', 'node_success', 'node_failure', 'blackboard_update', 'custom'];
  const eventLevels = ['info', 'warning', 'error', 'debug'];

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    replayActions.setEventFilter('search', query);
  }, [replayActions]);

  const handleTypeFilterChange = useCallback((type: string, enabled: boolean) => {
    replayActions.toggleEventTypeFilter(type, enabled);
  }, [replayActions]);

  const handleLevelFilterChange = useCallback((level: string, enabled: boolean) => {
    replayActions.toggleEventLevelFilter(level, enabled);
  }, [replayActions]);

  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
    replayActions.clearEventFilters();
  }, [replayActions]);

  return (
    <div className="space-y-3 p-3 border-b">
      {/* 搜索框 */}
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t('replay:events.searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-8 h-9"
        />
      </div>

      {/* 快速过滤按钮 */}
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-2">
              <Filter className="h-4 w-4" />
              {t('replay:events.filters')}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>{t('replay:events.eventTypes')}</DropdownMenuLabel>
            {eventTypes.map((type) => (
              <DropdownMenuCheckboxItem
                key={type}
                checked={eventFilters.types.includes(type)}
                onCheckedChange={(checked) => handleTypeFilterChange(type, checked)}
              >
                <div className="flex items-center gap-2">
                  {React.createElement(getEventTypeIcon(type), { className: "h-4 w-4" })}
                  {t(`replay:events.types.${type}`)}
                </div>
              </DropdownMenuCheckboxItem>
            ))}
            
            <DropdownMenuSeparator />
            <DropdownMenuLabel>{t('replay:events.eventLevels')}</DropdownMenuLabel>
            {eventLevels.map((level) => (
              <DropdownMenuCheckboxItem
                key={level}
                checked={eventFilters.levels.includes(level)}
                onCheckedChange={(checked) => handleLevelFilterChange(level, checked)}
              >
                <div className="flex items-center gap-2">
                  {React.createElement(getEventLevelIcon(level), { className: "h-4 w-4" })}
                  {t(`replay:events.levels.${level}`)}
                </div>
              </DropdownMenuCheckboxItem>
            ))}
            
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleClearFilters}>
              <Settings className="h-4 w-4 mr-2" />
              {t('replay:events.clearFilters')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className="h-8"
        >
          {showAdvancedFilters ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          {t('replay:events.advanced')}
        </Button>
      </div>

      {/* 高级过滤选项 */}
      {showAdvancedFilters && (
        <div className="space-y-2 p-2 bg-muted/30 rounded-md">
          <div className="flex items-center gap-2">
            <Checkbox
              id="showTimestamps"
              checked={eventFilters.showTimestamps}
              onCheckedChange={(checked) => replayActions.setEventFilter('showTimestamps', checked)}
            />
            <label htmlFor="showTimestamps" className="text-xs">
              {t('replay:events.showTimestamps')}
            </label>
          </div>
          
          <div className="flex items-center gap-2">
            <Checkbox
              id="groupByCategory"
              checked={eventFilters.groupByCategory}
              onCheckedChange={(checked) => replayActions.setEventFilter('groupByCategory', checked)}
            />
            <label htmlFor="groupByCategory" className="text-xs">
              {t('replay:events.groupByCategory')}
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

// 单个事件项组件
function EventItem({ 
  event, 
  isSelected, 
  onSelect,
  onJumpToTime 
}: { 
  event: ReplayEvent;
  isSelected: boolean;
  onSelect: (eventId: string) => void;
  onJumpToTime: (timestamp: number) => void;
}) {
  const { t } = useI18n();
  const [isExpanded, setIsExpanded] = useState(false);
  
  const TypeIcon = getEventTypeIcon(event.type);
  const LevelIcon = getEventLevelIcon(event.level);
  
  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString() + '.' + date.getMilliseconds().toString().padStart(3, '0');
  };

  const handleClick = useCallback(() => {
    onSelect(event.id);
    if (!isSelected) {
      onJumpToTime(event.timestamp);
    }
  }, [event.id, event.timestamp, isSelected, onSelect, onJumpToTime]);

  return (
    <div
      className={cn(
        'rounded-md border p-2 cursor-pointer transition-all',
        isSelected 
          ? 'border-primary bg-primary/5 shadow-sm' 
          : 'hover:bg-muted/50',
        getEventLevelColor(event.level)
      )}
      onClick={handleClick}
    >
      {/* 事件头部 */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 flex-shrink-0">
          <TypeIcon className="h-4 w-4" />
          <LevelIcon className="h-3 w-3" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">
              {event.nodeId ? `${event.nodeId}` : t(`replay:events.types.${event.type}`)}
            </span>
            <Badge variant="outline" className="text-xs">
              {event.category}
            </Badge>
          </div>
          
          <div className="text-xs text-muted-foreground truncate mt-1">
            {event.message}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-muted-foreground">
            {formatTimestamp(event.timestamp)}
          </span>
          
          {event.data && Object.keys(event.data).length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="h-6 w-6 p-0"
            >
              {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </Button>
          )}
        </div>
      </div>

      {/* 事件详情（展开时显示） */}
      {isExpanded && event.data && Object.keys(event.data).length > 0 && (
        <div className="mt-3 pt-2 border-t">
          <div className="space-y-1">
            {Object.entries(event.data).map(([key, value]) => (
              <div key={key} className="flex items-start gap-2 text-xs">
                <span className="font-medium text-muted-foreground min-w-[60px]">
                  {key}:
                </span>
                <span className="font-mono text-foreground break-all">
                  {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// 事件列表组件
function EventList() {
  const { t } = useI18n();
  const visibleEvents = useVisibleEvents();
  const replayActions = useReplayActions();
  const currentTime = useCurrentTime();
  
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const handleSelectEvent = useCallback((eventId: string) => {
    setSelectedEventId(eventId);
    replayActions.selectEvent(eventId);
  }, [replayActions]);

  const handleJumpToTime = useCallback((timestamp: number) => {
    replayActions.jumpToTime(timestamp);
  }, [replayActions]);

  const sortedEvents = useMemo(() => {
    return [...visibleEvents].sort((a, b) => b.timestamp - a.timestamp);
  }, [visibleEvents]);

  if (sortedEvents.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center space-y-3">
          <Calendar className="w-12 h-12 text-muted-foreground mx-auto" />
          <div className="text-sm font-medium">{t('replay:events.noEvents')}</div>
          <div className="text-xs text-muted-foreground max-w-xs">
            {t('replay:events.noEventsDesc')}
          </div>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="p-2 space-y-1">
        {sortedEvents.map((event) => (
          <EventItem
            key={event.id}
            event={event}
            isSelected={selectedEventId === event.id}
            onSelect={handleSelectEvent}
            onJumpToTime={handleJumpToTime}
          />
        ))}
      </div>
    </ScrollArea>
  );
}

// 事件统计组件
function EventStats() {
  const { t } = useI18n();
  const visibleEvents = useVisibleEvents();
  const replayEvents = useReplayEvents();

  const stats = useMemo(() => {
    const total = replayEvents.length;
    const visible = visibleEvents.length;
    const byLevel = replayEvents.reduce((acc, event) => {
      acc[event.level] = (acc[event.level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return { total, visible, byLevel };
  }, [replayEvents, visibleEvents]);

  return (
    <div className="p-3 border-t bg-muted/30">
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{t('replay:events.stats.total')}:</span>
            <Badge variant="secondary" className="text-xs">{stats.total}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{t('replay:events.stats.visible')}:</span>
            <Badge variant="secondary" className="text-xs">{stats.visible}</Badge>
          </div>
        </div>
        
        <div className="space-y-1">
          {Object.entries(stats.byLevel).map(([level, count]) => (
            <div key={level} className="flex items-center justify-between">
              <span className="text-muted-foreground capitalize">{level}:</span>
              <Badge 
                variant={level === 'error' ? 'destructive' : 'outline'} 
                className="text-xs"
              >
                {count}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 主事件检查器面板组件
export default function EventInspectorPanel({ className }: EventInspectorPanelProps) {
  const { t } = useI18n();

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* 事件过滤器 */}
      <EventFilters />

      {/* 事件列表 */}
      <EventList />

      {/* 事件统计 */}
      <EventStats />
    </div>
  );
}