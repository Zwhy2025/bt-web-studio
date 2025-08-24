import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/core/utils/utils';
import { useI18n } from '@/hooks/use-i18n';
import { useBehaviorTreeStore, useCurrentMode, useDebugActions } from '@/core/store/behavior-tree-store';
import { DebugSessionStatus } from '@/core/store/debugModeState';
import { WorkflowMode } from '@/core/store/workflowModeState';
import {
  FileText, Upload, Download,
  Link2, Link2Off, Wifi, WifiOff,
  ClipboardList, HelpCircle
} from 'lucide-react';

export type FunctionTabKey = 'file' | 'connection' | 'load' | 'help';

export const getVisibleTabsForMode = (mode: WorkflowMode): FunctionTabKey[] => {
  switch (mode) {
    case WorkflowMode.COMPOSER:
      return ['file', 'help'];
    case WorkflowMode.DEBUG:
      return ['connection', 'help'];
    case WorkflowMode.REPLAY:
      return ['load', 'help'];
    default:
      return ['help'];
  }
};

interface FunctionTabsProps {
  className?: string;
  // File actions
  onImportClick?: () => void;
  onExportClick?: () => void;
}

export function FunctionTabs({ className, onImportClick, onExportClick }: FunctionTabsProps) {
  const { t } = useI18n();
  const mode = useCurrentMode();
  const debugActions = useDebugActions();
  const debugSessions = useBehaviorTreeStore((s: any) => s.availableSessions || []);
  const connectedSession = debugSessions.find((s: any) => s.status === DebugSessionStatus.CONNECTED);
  const isConnected = !!connectedSession;
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const visible = getVisibleTabsForMode(mode);

  const handleConnectToggle = async () => {
    if (isConnected) {
      debugActions.disconnectSession();
    } else {
      // Create a default session if none exists, then connect
      await debugActions.createSession({ host: 'localhost', port: 8080, name: 'Local Debugger' });
      const created = useBehaviorTreeStore.getState().availableSessions?.slice(-1)[0];
      if (created) {
        await debugActions.connectToSession(created.id);
      }
    }
  };

  const handleLoadReplayFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const replayActions = (useBehaviorTreeStore.getState() as any).replayActions as any;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result || '');
        let events: any[] = [];

        // Try JSON first
        try {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed)) {
            events = parsed;
          } else if (Array.isArray((parsed as any).events)) {
            events = (parsed as any).events;
          }
        } catch {
          // Not JSON — fallback: treat each non-empty line as a tick event
          const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
          const start = Date.now();
          events = lines.map((line, idx) => ({
            id: `${idx}`,
            timestamp: start + idx * 10,
            nodeId: 'node-1',
            type: 'tick',
            status: 'success',
            payload: line
          }));
        }

        // Normalize minimal shape for replay slice
        const normalized = events.map((e, idx) => ({
          id: e.id ?? String(idx),
          timestamp: typeof e.timestamp === 'number' ? e.timestamp : Date.now() + idx * 10,
          nodeId: e.nodeId ?? e.node_id ?? 'node-1',
          type: e.type ?? 'tick',
          status: e.status ?? 'success',
        }));

        if (replayActions?.createSessionFromEvents) {
          replayActions.createSessionFromEvents(normalized, { source: file.name });
        } else if (replayActions?.loadSession) {
          // Fallback to filename-only loader
          replayActions.loadSession(file.name);
        }
      } finally {
        // reset input to allow re-select same file
        e.currentTarget.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {/* File (Composer) */}
      {visible.includes('file') && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 gap-1">
              <FileText className="h-4 w-4" />
              <span>{t('menu:file') || 'File'}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={onImportClick}>
              <Upload className="h-4 w-4 mr-2" /> {t('menu:importXML') || 'Import XML'}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onExportClick}>
              <Download className="h-4 w-4 mr-2" /> {t('menu:exportXML') || 'Export XML'}
            </DropdownMenuItem>
            {/* 无保存按钮 */}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Connection (Debug) */}
      {visible.includes('connection') && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 gap-1">
              {isConnected ? <Wifi className="h-4 w-4 text-green-500" /> : <WifiOff className="h-4 w-4 text-red-500" />}
              <span>{t('menu:connection') || 'Connection'}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={handleConnectToggle}>
              {isConnected ? (
                <>
                  <Link2Off className="h-4 w-4 mr-2" /> {t('debug:connection.disconnect') || 'Disconnect'}
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4 mr-2" /> {t('debug:connection.connect') || 'Connect'}
                </>
              )}
            </DropdownMenuItem>
            {connectedSession && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled>
                  {connectedSession.name || 'Session'}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Load (Replay) */}
      {visible.includes('load') && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.log,.txt,.xml"
            onChange={handleLoadReplayFile}
            className="hidden"
            aria-hidden
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 gap-1">
                <ClipboardList className="h-4 w-4" />
                <span>{t('menu:load') || 'Load'}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" /> {t('replay:loadSession') || 'Load Replay Data'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}

      {/* Separator before Help when multiple tabs present */}
      {visible.length > 1 && <Separator orientation="vertical" className="mx-1 h-4" />}

      {/* Help (All modes) */}
      {visible.includes('help') && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 gap-1">
              <HelpCircle className="h-4 w-4" />
              <span>{t('menu:help') || 'Help'}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => window.open('/docs/user-guide.md', '_blank')}>{t('menu:docs') || 'User Guide'}</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => window.open('/AGENTS.md', '_blank')}>Repository Guidelines</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
