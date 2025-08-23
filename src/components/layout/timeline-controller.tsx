import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { cn } from '@/core/utils/utils';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  useReplayActions,
  useReplaySession,
  useCurrentTime,
  useReplayStatus,
  useVisibleEvents,
  useTimelineState
} from '@/core/store/behavior-tree-store';
import { useI18n } from '@/hooks/use-i18n';
import { 
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  Clock,
  Gauge,
  RotateCcw,
  FastForward,
  Rewind
} from 'lucide-react';

interface TimelineControllerProps {
  className?: string;
}

// 简化的播放控制组件
function PlaybackControls() {
  const { t } = useI18n();
  const replayActions = useReplayActions();
  const replayStatus = useReplayStatus();
  const replaySession = useReplaySession();

  const isPlaying = replayStatus === 'playing';
  const isSessionActive = !!replaySession;

  const handlePlay = useCallback(() => {
    if (isPlaying) {
      replayActions.pausePlayback();
    } else {
      replayActions.startPlayback();
    }
  }, [isPlaying, replayActions]);

  const handleStop = useCallback(() => {
    replayActions.stopPlayback();
  }, [replayActions]);

  const handleStepBack = useCallback(() => {
    replayActions.stepBackward();
  }, [replayActions]);

  const handleStepForward = useCallback(() => {
    replayActions.stepForward();
  }, [replayActions]);

  const handleJumpToStart = useCallback(() => {
    replayActions.jumpToTime(0);
  }, [replayActions]);

  const handleJumpToEnd = useCallback(() => {
    if (replaySession) {
      replayActions.jumpToTime(replaySession.duration);
    }
  }, [replayActions, replaySession]);

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleJumpToStart}
        disabled={!isSessionActive}
        className="h-8 w-8 p-0"
        title={t('replay:controls.jumpToStart')}
      >
        <SkipBack className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleStepBack}
        disabled={!isSessionActive}
        className="h-8 w-8 p-0"
        title={t('replay:controls.stepBack')}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <Button
        variant={isPlaying ? "default" : "outline"}
        size="sm"
        onClick={handlePlay}
        disabled={!isSessionActive}
        className="h-8 w-8 p-0"
        title={isPlaying ? t('replay:controls.pause') : t('replay:controls.play')}
      >
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleStop}
        disabled={!isSessionActive}
        className="h-8 w-8 p-0"
        title={t('replay:controls.stop')}
      >
        <Square className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleStepForward}
        disabled={!isSessionActive}
        className="h-8 w-8 p-0"
        title={t('replay:controls.stepForward')}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleJumpToEnd}
        disabled={!isSessionActive}
        className="h-8 w-8 p-0"
        title={t('replay:controls.jumpToEnd')}
      >
        <SkipForward className="h-4 w-4" />
      </Button>
    </div>
  );
}

// 简化的时间显示组件
function TimeDisplay() {
  const { t } = useI18n();
  const currentTime = useCurrentTime();
  const replaySession = useReplaySession();

  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const ms = Math.floor((milliseconds % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const currentTimeFormatted = formatTime(currentTime);
  const totalTime = replaySession ? formatTime(replaySession.duration || 0) : '00:00.00';

  return (
    <div className="flex items-center gap-2 text-sm font-mono">
      <Clock className="h-4 w-4 text-muted-foreground" />
      <span className="min-w-[80px] text-right">{currentTimeFormatted}</span>
      <span className="text-muted-foreground">/</span>
      <span className="min-w-[80px]">{totalTime}</span>
    </div>
  );
}

// 简化的播放速度控制
function PlaybackSpeedControl() {
  const { t } = useI18n();
  const [playbackRate, setPlaybackRate] = useState(1);
  const replayActions = useReplayActions();

  const speedOptions = [0.25, 0.5, 1, 1.5, 2, 4];
  const [customSpeed, setCustomSpeed] = useState(false);

  const handleSpeedChange = useCallback((speed: number) => {
    setPlaybackRate(speed);
    replayActions.setPlaybackRate(speed);
    setCustomSpeed(false);
  }, [replayActions]);

  const handleCustomSpeedToggle = useCallback(() => {
    setCustomSpeed(!customSpeed);
  }, [customSpeed]);

  return (
    <div className="flex items-center gap-2">
      <Gauge className="h-4 w-4 text-muted-foreground" />
      
      {!customSpeed ? (
        <div className="flex items-center gap-1">
          {speedOptions.map((speed) => (
            <Button
              key={speed}
              variant={playbackRate === speed ? "default" : "ghost"}
              size="sm"
              onClick={() => handleSpeedChange(speed)}
              className="h-7 px-2 text-xs"
            >
              {speed}x
            </Button>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCustomSpeedToggle}
            className="h-7 px-2 text-xs"
          >
            ...
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-1">
          <Input
            type="number"
            min="0.1"
            max="10"
            step="0.1"
            value={playbackRate}
            onChange={(e) => handleSpeedChange(Number(e.target.value))}
            className="h-7 w-16 text-xs"
          />
          <span className="text-xs text-muted-foreground">x</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCustomSpeedToggle}
            className="h-7 px-2 text-xs"
          >
            ✓
          </Button>
        </div>
      )}
    </div>
  );
}

// 简化的进度条组件
function ProgressSlider() {
  const timelineState = useTimelineState();
  const replaySession = useReplaySession();
  const replayActions = useReplayActions();
  const [isDragging, setIsDragging] = useState(false);
  const [localValue, setLocalValue] = useState([0]);

  const duration = replaySession?.duration || 1;
  const progress = (timelineState.currentTime / duration) * 100;

  useEffect(() => {
    if (!isDragging) {
      setLocalValue([progress]);
    }
  }, [progress, isDragging]);

  const handleValueChange = useCallback((value: number[]) => {
    setLocalValue(value);
    setIsDragging(true);
  }, []);

  const handleValueCommit = useCallback((value: number[]) => {
    const newTime = (value[0] / 100) * duration;
    replayActions.jumpToTime(newTime);
    setIsDragging(false);
  }, [duration, replayActions]);

  return (
    <div className="flex-1 px-4">
      <Slider
        value={localValue}
        onValueChange={handleValueChange}
        onValueCommit={handleValueCommit}
        max={100}
        min={0}
        step={0.1}
        disabled={!replaySession}
        className="w-full"
      />
    </div>
  );
}

// 简化的状态指示器
function StatusIndicator() {
  const { t } = useI18n();
  const timelineState = useTimelineState();
  const replaySession = useReplaySession();
  const replayEvents = useReplayEvents();

  const getStatusText = () => {
    if (!replaySession) return t('replay:status.noSession');
    if (timelineState.isPlaying) return t('replay:status.playing');
    return t('replay:status.paused');
  };

  return (
    <div className="flex items-center gap-2">
      <Badge variant="secondary" className="text-xs">
        {getStatusText()}
      </Badge>
      
      {replaySession && (
        <Badge variant="outline" className="text-xs">
          {replayEvents.length} {t('replay:events.items')}
        </Badge>
      )}
    </div>
  );
}

// 主时间轴控制器组件
export default function TimelineController({ className }: TimelineControllerProps) {
  return (
    <div className={cn(
      'flex items-center gap-4 px-4 py-3 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
      className
    )}>
      {/* 左侧播放控制 */}
      <PlaybackControls />

      {/* 中央进度条区域 */}
      <div className="flex-1 flex items-center gap-4">
        <TimeDisplay />
        <ProgressSlider />
        <PlaybackSpeedControl />
      </div>

      {/* 右侧状态指示 */}
      <StatusIndicator />
    </div>
  );
}