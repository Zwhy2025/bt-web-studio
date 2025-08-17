import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBehaviorTreeStore } from '@/core/store/behavior-tree-store';
import { Info, Settings, Code, Link, Play, Pause, CheckCircle, XCircle } from 'lucide-react';

interface NodeInfoPanelProps {
    selectedNodeId?: string;
}

export function NodeInfoPanel({ selectedNodeId }: NodeInfoPanelProps) {
    const { nodes } = useBehaviorTreeStore();

    const selectedNode = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) : null;

    if (!selectedNode) {
        return (
            <Card className="h-full">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        节点信息
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-32 text-muted-foreground">
                    请选择一个节点查看详细信息
                </CardContent>
            </Card>
        );
    }

    const getStatusIcon = (status?: string) => {
        switch (status) {
            case 'running':
                return <Play className="h-4 w-4 text-blue-500" />;
            case 'success':
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'failure':
                return <XCircle className="h-4 w-4 text-red-500" />;
            case 'idle':
            default:
                return <Pause className="h-4 w-4 text-gray-500" />;
        }
    };

    const getStatusText = (status?: string) => {
        switch (status) {
            case 'running':
                return '运行中';
            case 'success':
                return '成功';
            case 'failure':
                return '失败';
            case 'idle':
            default:
                return '空闲';
        }
    };

    const getNodeTypeText = (type: string) => {
        const typeMap: Record<string, string> = {
            'action': '动作节点',
            'condition': '条件节点',
            'control-sequence': '顺序控制',
            'control-selector': '选择控制',
            'control-parallel': '并行控制',
            'decorator': '装饰器',
            'subtree': '子树',
        };
        return typeMap[type] || type;
    };

    const renderParameters = () => {
        const params = selectedNode.data.parameters || selectedNode.data.attributes || {};
        if (Object.keys(params).length === 0) {
            return <div className="text-muted-foreground text-sm">无参数</div>;
        }

        return (
            <div className="space-y-2">
                {Object.entries(params).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-start">
                        <span className="font-medium text-sm">{key}:</span>
                        <span className="text-sm text-muted-foreground ml-2 break-all">
                            {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                        </span>
                    </div>
                ))}
            </div>
        );
    };

    const renderPorts = () => {
        const definition = selectedNode.data.subtreeDefinition || selectedNode.data.nodeDefinition;
        const ports = definition?.ports || [];

        if (ports.length === 0) {
            return <div className="text-muted-foreground text-sm">无端口定义</div>;
        }

        return (
            <div className="space-y-3">
                {ports.map((port: any, index: number) => (
                    <div key={index} className="border rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                            <Badge variant={port.type === 'input' ? 'default' : port.type === 'output' ? 'secondary' : 'outline'}>
                                {port.type === 'input' ? '输入' : port.type === 'output' ? '输出' : '输入输出'}
                            </Badge>
                            <span className="font-medium">{port.name}</span>
                        </div>
                        <div className="text-sm space-y-1">
                            <div><span className="font-medium">类型:</span> {port.dataType}</div>
                            {port.default && <div><span className="font-medium">默认值:</span> {port.default}</div>}
                            {port.description && <div><span className="font-medium">描述:</span> {port.description}</div>}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const renderSubtreeInfo = () => {
        if (selectedNode.type !== 'subtree') return null;

        return (
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <Link className="h-4 w-4" />
                    <span className="font-medium">子树引用</span>
                </div>
                <div className="space-y-2">
                    <div><span className="font-medium">子树ID:</span> {selectedNode.data.subtreeId || '未知'}</div>
                    <div><span className="font-medium">是否展开:</span> {selectedNode.data.isExpanded ? '是' : '否'}</div>
                    {selectedNode.data.subtreeParameters && (
                        <div>
                            <span className="font-medium">子树参数:</span>
                            <pre className="mt-1 text-xs bg-muted p-2 rounded">
                                {JSON.stringify(selectedNode.data.subtreeParameters, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderExecutionInfo = () => {
        const { executionCount, lastExecutionTime, breakpoint } = selectedNode.data;

        return (
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <span className="font-medium">执行次数:</span>
                    <Badge variant="outline">{executionCount || 0}</Badge>
                </div>
                {lastExecutionTime && (
                    <div>
                        <span className="font-medium">最后执行:</span>
                        <span className="text-sm text-muted-foreground ml-2">
                            {new Date(lastExecutionTime).toLocaleString()}
                        </span>
                    </div>
                )}
                <div className="flex items-center gap-2">
                    <span className="font-medium">断点:</span>
                    <Badge variant={breakpoint ? 'destructive' : 'outline'}>
                        {breakpoint ? '已设置' : '未设置'}
                    </Badge>
                </div>
            </div>
        );
    };

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    节点信息
                </CardTitle>
                <div className="flex items-center gap-2">
                    {getStatusIcon(selectedNode.data.status)}
                    <span className="text-sm font-medium">{getStatusText(selectedNode.data.status)}</span>
                    <Badge variant="outline">{getNodeTypeText(selectedNode.type || 'unknown')}</Badge>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <ScrollArea className="h-[calc(100vh-200px)]">
                    <div className="p-6">
                        <Tabs defaultValue="basic" className="w-full">
                            <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger value="basic">基本信息</TabsTrigger>
                                <TabsTrigger value="parameters">参数</TabsTrigger>
                                <TabsTrigger value="ports">端口</TabsTrigger>
                                <TabsTrigger value="execution">执行</TabsTrigger>
                            </TabsList>

                            <TabsContent value="basic" className="space-y-4">
                                <div>
                                    <h4 className="font-medium mb-2">节点标识</h4>
                                    <div className="space-y-2 text-sm">
                                        <div><span className="font-medium">ID:</span> {selectedNode.id}</div>
                                        <div><span className="font-medium">标签:</span> {selectedNode.data.label}</div>
                                        <div><span className="font-medium">类型:</span> {getNodeTypeText(selectedNode.type || 'unknown')}</div>
                                    </div>
                                </div>

                                <Separator />

                                <div>
                                    <h4 className="font-medium mb-2">位置信息</h4>
                                    <div className="space-y-2 text-sm">
                                        <div><span className="font-medium">X:</span> {selectedNode.position.x}</div>
                                        <div><span className="font-medium">Y:</span> {selectedNode.position.y}</div>
                                        {selectedNode.width && <div><span className="font-medium">宽度:</span> {selectedNode.width}</div>}
                                        {selectedNode.height && <div><span className="font-medium">高度:</span> {selectedNode.height}</div>}
                                    </div>
                                </div>

                                {selectedNode.type === 'subtree' && (
                                    <>
                                        <Separator />
                                        {renderSubtreeInfo()}
                                    </>
                                )}

                                {selectedNode.data.description && (
                                    <>
                                        <Separator />
                                        <div>
                                            <h4 className="font-medium mb-2">描述</h4>
                                            <p className="text-sm text-muted-foreground">{selectedNode.data.description}</p>
                                        </div>
                                    </>
                                )}
                            </TabsContent>

                            <TabsContent value="parameters" className="space-y-4">
                                <div>
                                    <h4 className="font-medium mb-2 flex items-center gap-2">
                                        <Settings className="h-4 w-4" />
                                        节点参数
                                    </h4>
                                    {renderParameters()}
                                </div>
                            </TabsContent>

                            <TabsContent value="ports" className="space-y-4">
                                <div>
                                    <h4 className="font-medium mb-2 flex items-center gap-2">
                                        <Code className="h-4 w-4" />
                                        端口定义
                                    </h4>
                                    {renderPorts()}
                                </div>
                            </TabsContent>

                            <TabsContent value="execution" className="space-y-4">
                                <div>
                                    <h4 className="font-medium mb-2 flex items-center gap-2">
                                        <Play className="h-4 w-4" />
                                        执行信息
                                    </h4>
                                    {renderExecutionInfo()}
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}