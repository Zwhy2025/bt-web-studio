import React from 'react';
import { DebugPanel } from "@/components/debug-panel"
import { BreakpointPanel } from "@/components/breakpoint-panel"
import { BlackboardPanel } from "@/components/blackboard-panel"
import { NodeInfoPanel } from "@/components/node-info-panel"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// ---------- Right Inspector ----------
function RightInspector({ selectedNodeId }: { selectedNodeId?: string }) {
  return (
    <div className="h-full flex flex-col">
      <Tabs defaultValue="debug" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-5 mx-3 mt-3">
          <TabsTrigger value="debug">调试</TabsTrigger>
          <TabsTrigger value="breakpoints">断点</TabsTrigger>
          <TabsTrigger value="blackboard">黑板</TabsTrigger>
          <TabsTrigger value="events">事件</TabsTrigger>
          <TabsTrigger value="nodeinfo">节点信息</TabsTrigger>
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
              事件日志将在调试时显示
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