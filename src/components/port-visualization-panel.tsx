import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  LogIn, 
  LogOut, 
  ArrowRightLeft, 
  Info,
  GitBranch,
  Eye
} from 'lucide-react';
import { useBehaviorTreeStore } from '@/store/behavior-tree-store';
import { useSelectedNodes } from '@/store/behavior-tree-store';

export function PortVisualizationPanel() {
  const selectedNodeIds = useSelectedNodes();
  const nodes = useBehaviorTreeStore(state => state.nodes);
  
  // 获取选中的节点
  const selectedNodes = nodes.filter(node => selectedNodeIds.includes(node.id));
  
  // 端口类型图标组件
  const PortIcon = ({ type }: { type: string }) => {
    switch (type) {
      case 'input': return <LogIn className="h-3 w-3 text-sky-500" />;
      case 'output': return <LogOut className="h-3 w-3 text-amber-500" />;
      case 'inout': return <ArrowRightLeft className="h-3 w-3 text-violet-500" />;
      default: return <Info className="h-3 w-3" />;
    }
  };
  
  // 端口类型标签颜色
  const getPortTypeColor = (type: string) => {
    switch (type) {
      case 'input': return 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200';
      case 'output': return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
      case 'inout': return 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };
  
  // 获取选中节点的端口信息
  const getPortInfo = () => {
    if (selectedNodes.length !== 1) return null;
    
    const node = selectedNodes[0];
    
    // 检查是否为子树节点且有定义信息
    if (node.type === 'subtree' && node.data?.subtreeDefinition?.ports) {
      return {
        ports: node.data.subtreeDefinition.ports,
        title: `子树: ${node.data.subtreeId || 'Unknown'}`
      };
    }
    
    // 对于其他节点，可以在这里添加端口信息（如果有的话）
    return null;
  };
  
  const portInfo = getPortInfo();
  
  return (
    <Card className="h-full flex flex-col min-h-0">
      <CardHeader className="pb-3 flex-shrink-0">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Eye className="h-4 w-4" />
          端口可视化
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col gap-3 p-3 min-h-0">
        {selectedNodes.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-xs">
            请选择一个节点查看端口信息
          </div>
        ) : selectedNodes.length > 1 ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-xs">
            请选择单个节点查看详细端口信息
          </div>
        ) : !portInfo ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-xs">
            该节点没有端口信息
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="text-sm font-medium mb-2 truncate">{portInfo.title}</div>
            
            <ScrollArea className="flex-1">
              <div className="space-y-3">
                {portInfo.ports && portInfo.ports.length > 0 ? (
                  portInfo.ports.map((port, index) => (
                    <div key={index} className="rounded-md border p-3 bg-card/60">
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5">
                          <PortIcon type={port.type} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm truncate">{port.name}</span>
                            <Badge 
                              variant="secondary" 
                              className={`text-xs px-1.5 py-0 ${getPortTypeColor(port.type)}`}
                            >
                              {port.type}
                            </Badge>
                          </div>
                          
                          <div className="text-xs text-muted-foreground mb-1 font-mono">
                            {port.dataType}
                          </div>
                          
                          {port.description && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {port.description}
                            </div>
                          )}
                          
                          {port.default && (
                            <div className="text-xs text-muted-foreground mt-1">
                              默认值: <code className="font-mono">{port.default}</code>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground text-xs py-4">
                    该节点没有定义端口
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}