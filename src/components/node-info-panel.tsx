import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBehaviorTreeStore } from '@/core/store/behavior-tree-store';
import { useI18n } from '@/hooks/use-i18n';
import { Info, Settings, Code, Link, Play, Pause, CheckCircle, XCircle } from 'lucide-react';

interface NodeInfoPanelProps {
    selectedNodeId?: string;
}

export function NodeInfoPanel({ selectedNodeId }: NodeInfoPanelProps) {
    const { nodes } = useBehaviorTreeStore();
    const { t } = useI18n();

    const selectedNode = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) : null;

    if (!selectedNode) {
        return (
            <Card className="h-full">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        {t('panels:nodeInfo')}
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-32 text-muted-foreground">
                    {t('panels:selectNodeToViewInfo')}
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
                return t('nodes:nodeStatus.running');
            case 'success':
                return t('nodes:nodeStatus.success');
            case 'failure':
                return t('nodes:nodeStatus.failure');
            case 'idle':
            default:
                return t('nodes:nodeStatus.idle');
        }
    };

    const getNodeTypeText = (type: string) => {
        const typeMap: Record<string, string> = {
            'action': t('nodes:actionNodes'),
            'condition': t('nodes:conditionNodes'),
            'control-sequence': t('nodes:sequence'),
            'control-selector': t('nodes:selector'),
            'control-parallel': t('nodes:parallel'),
            'decorator': t('nodes:decoratorNodes'),
            'subtree': t('nodes:subtreeNodes'),
        };
        return typeMap[type] || type;
    };

    const renderParameters = () => {
        const params = selectedNode.data.parameters || {};
        if (Object.keys(params).length === 0) {
            return <div className="text-muted-foreground text-sm">{t('panels:noParameters')}</div>;
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
        const definition = (selectedNode.data as any).subtreeDefinition || (selectedNode.data as any).nodeDefinition;
        const ports = definition?.ports || [];

        if (ports.length === 0) {
            return <div className="text-muted-foreground text-sm">{t('panels:noPortDefinition')}</div>;
        }

        return (
            <div className="space-y-3">
                {ports.map((port: any, index: number) => (
                    <div key={index} className="border rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                            <Badge variant={port.type === 'input' ? 'default' : port.type === 'output' ? 'secondary' : 'outline'}>
                                {port.type === 'input' ? t('nodes:portTypes.input') : port.type === 'output' ? t('nodes:portTypes.output') : t('nodes:portTypes.bidirectional')}
                            </Badge>
                            <span className="font-medium">{port.name}</span>
                        </div>
                        <div className="text-sm space-y-1">
                            <div><span className="font-medium">{t('common:type')}:</span> {port.dataType}</div>
                            {port.default && <div><span className="font-medium">{t('nodes:default')}:</span> {port.default}</div>}
                            {port.description && <div><span className="font-medium">{t('panels:nodeDescription')}:</span> {port.description}</div>}
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
                    <span className="font-medium">{t('panels:subtreeReference')}</span>
                </div>
                <div className="space-y-2">
                    <div><span className="font-medium">{t('panels:subtreeId')}:</span> {selectedNode.data.subtreeId || t('common:unknown')}</div>
                    <div><span className="font-medium">{t('panels:isExpanded')}:</span> {selectedNode.data.isExpanded ? t('common:yes') : t('common:no')}</div>
                    {selectedNode.data.subtreeParameters && (
                        <div>
                            <span className="font-medium">{t('panels:subtreeParameters')}:</span>
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
                    <span className="font-medium">{t('panels:executionCount')}:</span>
                    <Badge variant="outline">{executionCount || 0}</Badge>
                </div>
                {lastExecutionTime && (
                    <div>
                        <span className="font-medium">{t('panels:lastExecutionTime')}:</span>
                        <span className="text-sm text-muted-foreground ml-2">
                            {new Date(lastExecutionTime).toLocaleString()}
                        </span>
                    </div>
                )}
                <div className="flex items-center gap-2">
                    <span className="font-medium">{t('panels:breakpointSet')}:</span>
                    <Badge variant={breakpoint ? 'destructive' : 'outline'}>
                        {breakpoint ? t('panels:breakpointSet') : t('panels:noBreakpointSet')}
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
                    {t('panels:nodeInfo')}
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
                                <TabsTrigger value="basic">{t('panels:basicInfo')}</TabsTrigger>
                                <TabsTrigger value="parameters">{t('nodes:parameters')}</TabsTrigger>
                                <TabsTrigger value="ports">{t('nodes:ports')}</TabsTrigger>
                                <TabsTrigger value="execution">{t('panels:execution')}</TabsTrigger>
                            </TabsList>

                            <TabsContent value="basic" className="space-y-4">
                                <div>
                                    <h4 className="font-medium mb-2">{t('panels:nodeIdentifier')}</h4>
                                    <div className="space-y-2 text-sm">
                                        <div><span className="font-medium">ID:</span> {selectedNode.id}</div>
                                        <div><span className="font-medium">{t('panels:label')}:</span> {selectedNode.data.label}</div>
                                        <div><span className="font-medium">{t('common:type')}:</span> {getNodeTypeText(selectedNode.type || 'unknown')}</div>
                                    </div>
                                </div>

                                <Separator />

                                <div>
                                    <h4 className="font-medium mb-2">{t('panels:positionInfo')}</h4>
                                    <div className="space-y-2 text-sm">
                                        <div><span className="font-medium">X:</span> {selectedNode.position.x}</div>
                                        <div><span className="font-medium">Y:</span> {selectedNode.position.y}</div>
                                        {selectedNode.width && <div><span className="font-medium">{t('panels:width')}:</span> {selectedNode.width}</div>}
                                        {selectedNode.height && <div><span className="font-medium">{t('panels:height')}:</span> {selectedNode.height}</div>}
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
                                            <h4 className="font-medium mb-2">{t('panels:nodeDescription')}</h4>
                                            <p className="text-sm text-muted-foreground">{selectedNode.data.description}</p>
                                        </div>
                                    </>
                                )}
                            </TabsContent>

                            <TabsContent value="parameters" className="space-y-4">
                                <div>
                                    <h4 className="font-medium mb-2 flex items-center gap-2">
                                        <Settings className="h-4 w-4" />
                                        {t('nodes:parameters')}
                                    </h4>
                                    {renderParameters()}
                                </div>
                            </TabsContent>

                            <TabsContent value="ports" className="space-y-4">
                                <div>
                                    <h4 className="font-medium mb-2 flex items-center gap-2">
                                        <Code className="h-4 w-4" />
                                        {t('panels:portDefinition')}
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