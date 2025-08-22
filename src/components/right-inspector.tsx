import React from 'react';
import { DebugPanel } from "@/components/debug-panel"
import { BreakpointPanel } from "@/components/breakpoint-panel"
import { BlackboardPanel } from "@/components/blackboard-panel"
import { NodeInfoPanel } from "@/components/node-info-panel"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useI18n } from "@/hooks/use-i18n"

// ---------- Right Inspector ----------
function RightInspector({ selectedNodeId }: { selectedNodeId?: string }) {
  const { t } = useI18n()
  return (
    <div className="h-full flex flex-col">
      <Tabs defaultValue="debug" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-5 mx-3 mt-3">
          <TabsTrigger value="debug">{t('panels:debug')}</TabsTrigger>
          <TabsTrigger value="breakpoints">{t('panels:breakpoints')}</TabsTrigger>
          <TabsTrigger value="blackboard">{t('panels:blackboard')}</TabsTrigger>
          <TabsTrigger value="events">{t('panels:events')}</TabsTrigger>
          <TabsTrigger value="nodeinfo">{t('panels:nodeInfo')}</TabsTrigger>
        </TabsList>
        <TabsContent value="debug" className="flex-1 mt-2">
          <DebugPanel />
        </TabsContent>
        <TabsContent value="breakpoints" className="flex-1 mt-2">
          <BreakpointPanel />
        </TabsContent>
        <TabsContent value="blackboard" className="flex-1 mt-2">
          <BlackboardPanel />
        </TabsContent>
        <TabsContent value="events" className="flex-1 mt-2">
          <div className="flex-1 p-2">
            <div className="text-sm text-muted-foreground">
              {t('panels:eventLogWillShowDuringDebug')}
            </div>
          </div>
        </TabsContent>
        <TabsContent value="nodeinfo" className="flex-1 mt-2">
          <NodeInfoPanel selectedNodeId={selectedNodeId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export { RightInspector }