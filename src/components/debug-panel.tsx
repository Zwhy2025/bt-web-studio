import React, { useState } from 'react';
import { useBehaviorTreeStore } from '@/core/store/behavior-tree-store';
import { BlackboardEntry } from '@/core/store/behavior-tree-store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Play,
  Pause,
  Square,
  StepForward,
  MemoryStick,
  ListOrdered,
  Eye
} from 'lucide-react';
import { DebugToolbar } from './debug-toolbar';
import { PortVisualizationPanel } from './port-visualization-panel';
import { useI18n } from '@/hooks/use-i18n';

export function DebugPanel() {
  const { t } = useI18n()
  const {
    blackboard,
    executionEvents,
    actions,
    isDebuggerConnected,
    debugState
  } = useBehaviorTreeStore();

  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newType, setNewType] = useState<'string' | 'number' | 'boolean' | 'object'>('string');

  // 处理添加/修改黑板变量
  const handleSetBlackboardValue = () => {
    if (!newKey) return;

    let parsedValue: any = newValue;
    if (newType === 'number') {
      parsedValue = Number(newValue);
      if (isNaN(parsedValue)) {
        console.error('Invalid number value');
        return;
      }
    } else if (newType === 'boolean') {
      parsedValue = newValue === 'true';
    } else if (newType === 'object') {
      try {
        parsedValue = JSON.parse(newValue);
      } catch (e) {
        console.error('Invalid JSON object', e);
        return;
      }
    }

    // 在真实场景中，这应该发送到调试器
    // actions.sendDebuggerCommand('set_blackboard_value', { key: newKey, value: parsedValue, type: newType });
    // 为了演示，我们直接在本地更新
    actions.setBlackboardValue(newKey, parsedValue, newType);

    // {t("common:clear")}输入框
    setNewKey('');
    setNewValue('');
  };

  return (
    <div className="h-full flex flex-col">
      {/* 将 DebugToolbar 移动到这里 */}
      <div className="p-2 border-b">
        <DebugToolbar />
      </div>

      <Tabs defaultValue="blackboard" className="flex-1 flex flex-col min-h-0">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="blackboard" className="flex items-center gap-2">
            <MemoryStick className="h-4 w-4" />
            {t('panels:blackboard')}
          </TabsTrigger>
          <TabsTrigger value="events" className="flex items-center gap-2">
            <ListOrdered className="h-4 w-4" />
            {t('panels:eventStream')}
          </TabsTrigger>
          <TabsTrigger value="ports" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            {t('panels:nodePorts')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="blackboard" className="flex-1 flex flex-col min-h-0 mt-0">
          <div className="flex-1 flex flex-col min-h-0 p-2">
            {/* 添加黑板变量 */}
            {isDebuggerConnected && (
              <div className="mb-4 p-2 bg-muted rounded-md">
                <h4 className="text-sm font-medium mb-2">{t('panels:addVariable')}</h4>
                <div className="grid grid-cols-[1fr_1fr_80px_1fr] gap-2">
                  <Input
                    placeholder={t('panels:variableName')}
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                  />
                  <Input
                    placeholder={t('panels:variableValue')}
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                  />
                  <select
                    className="border rounded-md px-2 text-sm"
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as 'string' | 'number' | 'boolean' | 'object')}
                  >
                    <option value="string">{t('nodes:dataTypes.string')}</option>
                    <option value="number">{t('nodes:dataTypes.number')}</option>
                    <option value="boolean">{t('nodes:dataTypes.boolean')}</option>
                    <option value="object">{t('nodes:dataTypes.object')}</option>
                  </select>
                  <Button size="sm" onClick={handleSetBlackboardValue}>{t('common:save')}</Button>
                </div>
              </div>
            )}

            {/* 黑板变量列表 */}
            <ScrollArea className="flex-1">
              {Object.keys(blackboard).length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  {t('panels:blackboardVariables')}
                </div>
              ) : (
                <div className="space-y-2">
                  {Object.entries(blackboard).map(([key, entry]) => (
                    <div key={key} className="flex items-center justify-between p-2 bg-card rounded-md border">
                      <div>
                        <div className="font-medium text-sm">{key}</div>
                        <div className="text-xs text-muted-foreground">
                          {entry.type}: {entry.type === 'object' ? JSON.stringify(entry.value) : String(entry.value)}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </TabsContent>

        <TabsContent value="events" className="flex-1 flex flex-col min-h-0 mt-0">
          <div className="flex-1 flex flex-col min-h-0 p-2">
            <ScrollArea className="flex-1">
              {executionEvents.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  {t('panels:executionHistory')}
                </div>
              ) : (
                <div className="space-y-2">
                  {executionEvents.map((event) => (
                    <div key={event.id} className="flex items-center justify-between p-2 bg-card rounded-md border">
                      <div>
                        <div className="font-medium text-sm">
                          Node: {event.nodeId} - {event.type}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Status: {event.status}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </TabsContent>

        <TabsContent value="ports" className="flex-1 flex flex-col min-h-0 mt-0">
          <div className="flex-1 flex flex-col min-h-0 p-2">
            <PortVisualizationPanel />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}