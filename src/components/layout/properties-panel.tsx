import React, { useState } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
    Settings,
    Info,
    Zap,
    Eye,
    Bug,
    Clock,
    Target,
    Link,
    Code,
    AlertCircle,
    CheckCircle,
    XCircle,
    Play
} from 'lucide-react'
import { cn } from '@/core/utils/utils'

// 节点属性接口
interface NodeProperty {
    key: string
    label: string
    type: 'string' | 'number' | 'boolean' | 'select' | 'textarea'
    value: any
    options?: { label: string; value: string }[]
    description?: string
    required?: boolean
}

// 节点信息接口
interface SelectedNodeInfo {
    id: string
    name: string
    type: string
    category: string
    description: string
    status?: 'idle' | 'running' | 'success' | 'failure'
    properties: NodeProperty[]
    ports: {
        input: { id: string; name: string; type: string }[]
        output: { id: string; name: string; type: string }[]
    }
    debugInfo?: {
        executionCount: number
        lastExecutionTime: number
        averageExecutionTime: number
        successRate: number
    }
}

interface PropertiesPanelProps {
    selectedNode?: SelectedNodeInfo | null
    onPropertyChange?: (nodeId: string, propertyKey: string, value: any) => void
    onAddBreakpoint?: (nodeId: string) => void
    onRemoveBreakpoint?: (nodeId: string) => void
    hasBreakpoint?: boolean
    className?: string
}

export function PropertiesPanel({
    selectedNode,
    onPropertyChange,
    onAddBreakpoint,
    onRemoveBreakpoint,
    hasBreakpoint = false,
    className
}: PropertiesPanelProps) {
    const [activeTab, setActiveTab] = useState('properties')

    const getStatusIcon = (status?: string) => {
        switch (status) {
            case 'running':
                return <Play className="w-4 h-4 text-blue-500" />
            case 'success':
                return <CheckCircle className="w-4 h-4 text-green-500" />
            case 'failure':
                return <XCircle className="w-4 h-4 text-red-500" />
            default:
                return <AlertCircle className="w-4 h-4 text-gray-500" />
        }
    }

    const getStatusText = (status?: string) => {
        switch (status) {
            case 'running':
                return '运行中'
            case 'success':
                return '成功'
            case 'failure':
                return '失败'
            default:
                return '空闲'
        }
    }

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'control':
                return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
            case 'decorator':
                return 'bg-purple-500/10 text-purple-400 border-purple-500/20'
            case 'condition':
                return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
            case 'action':
                return 'bg-green-500/10 text-green-400 border-green-500/20'
            default:
                return 'bg-gray-500/10 text-gray-400 border-gray-500/20'
        }
    }

    const handlePropertyChange = (propertyKey: string, value: any) => {
        if (selectedNode && onPropertyChange) {
            onPropertyChange(selectedNode.id, propertyKey, value)
        }
    }

    const renderPropertyInput = (property: NodeProperty) => {
        switch (property.type) {
            case 'boolean':
                return (
                    <div className="flex items-center space-x-2">
                        <Switch
                            checked={property.value}
                            onCheckedChange={(checked) => handlePropertyChange(property.key, checked)}
                        />
                        <Label className="text-sm text-gray-300">{property.value ? '是' : '否'}</Label>
                    </div>
                )
            case 'select':
                return (
                    <Select
                        value={property.value}
                        onValueChange={(value) => handlePropertyChange(property.key, value)}
                    >
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {property.options?.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )
            case 'textarea':
                return (
                    <Textarea
                        value={property.value}
                        onChange={(e) => handlePropertyChange(property.key, e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                        rows={3}
                    />
                )
            case 'number':
                return (
                    <Input
                        type="number"
                        value={property.value}
                        onChange={(e) => handlePropertyChange(property.key, parseFloat(e.target.value))}
                        className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    />
                )
            default:
                return (
                    <Input
                        value={property.value}
                        onChange={(e) => handlePropertyChange(property.key, e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    />
                )
        }
    }

    if (!selectedNode) {
        return (
            <div className={cn("h-full flex flex-col bg-gray-800", className)}>
                <div className="p-4 border-b border-gray-700">
                    <h2 className="text-lg font-semibold text-white">属性面板</h2>
                </div>
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center text-gray-400">
                        <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>选择一个节点查看其属性</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className={cn("h-full flex flex-col bg-gray-800", className)}>
            {/* 标题栏 */}
            <div className="p-4 border-b border-gray-700">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-semibold text-white">属性面板</h2>
                    <div className="flex items-center space-x-2">
                        {getStatusIcon(selectedNode.status)}
                        <span className="text-sm text-gray-400">
                            {getStatusText(selectedNode.status)}
                        </span>
                    </div>
                </div>

                {/* 节点基本信息 */}
                <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                        <Badge className={cn("text-xs", getCategoryColor(selectedNode.category))}>
                            {selectedNode.category}
                        </Badge>
                        <span className="text-sm font-medium text-white">{selectedNode.name}</span>
                    </div>
                    <p className="text-xs text-gray-400">{selectedNode.description}</p>
                </div>
            </div>

            {/* 标签页内容 */}
            <div className="flex-1 overflow-hidden">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                    <TabsList className="grid w-full grid-cols-4 bg-gray-700 m-2">
                        <TabsTrigger value="properties" className="text-xs">属性</TabsTrigger>
                        <TabsTrigger value="ports" className="text-xs">端口</TabsTrigger>
                        <TabsTrigger value="debug" className="text-xs">调试</TabsTrigger>
                        <TabsTrigger value="code" className="text-xs">代码</TabsTrigger>
                    </TabsList>

                    <div className="flex-1 overflow-hidden">
                        <TabsContent value="properties" className="h-full m-0">
                            <ScrollArea className="h-full">
                                <div className="p-4 space-y-4">
                                    {selectedNode.properties.map((property) => (
                                        <div key={property.key} className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-sm font-medium text-gray-300">
                                                    {property.label}
                                                    {property.required && (
                                                        <span className="text-red-400 ml-1">*</span>
                                                    )}
                                                </Label>
                                                {property.description && (
                                                    <Info className="w-4 h-4 text-gray-400" />
                                                )}
                                            </div>
                                            {renderPropertyInput(property)}
                                            {property.description && (
                                                <p className="text-xs text-gray-500">{property.description}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </TabsContent>

                        <TabsContent value="ports" className="h-full m-0">
                            <ScrollArea className="h-full">
                                <div className="p-4 space-y-4">
                                    {/* 输入端口 */}
                                    <Card className="bg-gray-700 border-gray-600">
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-sm text-white flex items-center">
                                                <Target className="w-4 h-4 mr-2" />
                                                输入端口
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-2">
                                            {selectedNode.ports.input.map((port) => (
                                                <div key={port.id} className="flex items-center justify-between p-2 bg-gray-800 rounded">
                                                    <span className="text-sm text-gray-300">{port.name}</span>
                                                    <Badge variant="outline" className="text-xs">
                                                        {port.type}
                                                    </Badge>
                                                </div>
                                            ))}
                                        </CardContent>
                                    </Card>

                                    {/* 输出端口 */}
                                    <Card className="bg-gray-700 border-gray-600">
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-sm text-white flex items-center">
                                                <Link className="w-4 h-4 mr-2" />
                                                输出端口
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-2">
                                            {selectedNode.ports.output.map((port) => (
                                                <div key={port.id} className="flex items-center justify-between p-2 bg-gray-800 rounded">
                                                    <span className="text-sm text-gray-300">{port.name}</span>
                                                    <Badge variant="outline" className="text-xs">
                                                        {port.type}
                                                    </Badge>
                                                </div>
                                            ))}
                                        </CardContent>
                                    </Card>
                                </div>
                            </ScrollArea>
                        </TabsContent>

                        <TabsContent value="debug" className="h-full m-0">
                            <ScrollArea className="h-full">
                                <div className="p-4 space-y-4">
                                    {/* 断点控制 */}
                                    <Card className="bg-gray-700 border-gray-600">
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-sm text-white flex items-center">
                                                <Bug className="w-4 h-4 mr-2" />
                                                断点控制
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-300">
                                                    {hasBreakpoint ? '已设置断点' : '未设置断点'}
                                                </span>
                                                <Button
                                                    size="sm"
                                                    variant={hasBreakpoint ? "destructive" : "default"}
                                                    onClick={() => {
                                                        if (hasBreakpoint) {
                                                            onRemoveBreakpoint?.(selectedNode.id)
                                                        } else {
                                                            onAddBreakpoint?.(selectedNode.id)
                                                        }
                                                    }}
                                                >
                                                    {hasBreakpoint ? '移除断点' : '添加断点'}
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* 执行统计 */}
                                    {selectedNode.debugInfo && (
                                        <Card className="bg-gray-700 border-gray-600">
                                            <CardHeader className="pb-3">
                                                <CardTitle className="text-sm text-white flex items-center">
                                                    <Clock className="w-4 h-4 mr-2" />
                                                    执行统计
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-3">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <div className="text-xs text-gray-400">执行次数</div>
                                                        <div className="text-lg font-semibold text-white">
                                                            {selectedNode.debugInfo.executionCount}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-gray-400">成功率</div>
                                                        <div className="text-lg font-semibold text-white">
                                                            {(selectedNode.debugInfo.successRate * 100).toFixed(1)}%
                                                        </div>
                                                    </div>
                                                </div>
                                                <Separator className="bg-gray-600" />
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <div className="text-xs text-gray-400">最后执行时间</div>
                                                        <div className="text-sm text-white">
                                                            {selectedNode.debugInfo.lastExecutionTime}ms
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-gray-400">平均执行时间</div>
                                                        <div className="text-sm text-white">
                                                            {selectedNode.debugInfo.averageExecutionTime}ms
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>
                            </ScrollArea>
                        </TabsContent>

                        <TabsContent value="code" className="h-full m-0">
                            <ScrollArea className="h-full">
                                <div className="p-4">
                                    <Card className="bg-gray-700 border-gray-600">
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-sm text-white flex items-center">
                                                <Code className="w-4 h-4 mr-2" />
                                                节点代码
                                            </CardTitle>
                                            <CardDescription className="text-gray-400">
                                                查看节点的XML表示和生成的代码
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="bg-gray-800 rounded-lg p-3 font-mono text-sm">
                                                <div className="text-gray-400 mb-2">XML:</div>
                                                <pre className="text-green-400 whitespace-pre-wrap">
                                                    {`<${selectedNode.type} name="${selectedNode.name}"${selectedNode.properties.map(p => ` ${p.key}="${p.value}"`).join('')}>
${selectedNode.ports.input.length > 0 ? selectedNode.ports.input.map(p => `  <input name="${p.name}" type="${p.type}" />`).join('\n') : ''}
${selectedNode.ports.output.length > 0 ? selectedNode.ports.output.map(p => `  <output name="${p.name}" type="${p.type}" />`).join('\n') : ''}
</${selectedNode.type}>`}
                                                </pre>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </ScrollArea>
                        </TabsContent>
                    </div>
                </Tabs>
            </div>
        </div>
    )
}

// 默认的示例节点数据
export const createSampleNodeInfo = (nodeId: string): SelectedNodeInfo => ({
    id: nodeId,
    name: 'Sample Node',
    type: 'Sequence',
    category: 'control',
    description: '这是一个示例节点，用于演示属性面板功能',
    status: 'idle',
    properties: [
        {
            key: 'name',
            label: '节点名称',
            type: 'string',
            value: 'Sample Node',
            required: true,
            description: '节点的显示名称'
        },
        {
            key: 'enabled',
            label: '启用状态',
            type: 'boolean',
            value: true,
            description: '是否启用此节点'
        },
        {
            key: 'priority',
            label: '优先级',
            type: 'select',
            value: 'normal',
            options: [
                { label: '低', value: 'low' },
                { label: '正常', value: 'normal' },
                { label: '高', value: 'high' }
            ],
            description: '节点执行优先级'
        },
        {
            key: 'timeout',
            label: '超时时间',
            type: 'number',
            value: 5000,
            description: '节点执行超时时间（毫秒）'
        },
        {
            key: 'description',
            label: '描述',
            type: 'textarea',
            value: '这是一个示例节点的详细描述',
            description: '节点的详细说明'
        }
    ],
    ports: {
        input: [
            { id: 'in1', name: '输入', type: 'flow' }
        ],
        output: [
            { id: 'out1', name: '成功', type: 'flow' },
            { id: 'out2', name: '失败', type: 'flow' }
        ]
    },
    debugInfo: {
        executionCount: 42,
        lastExecutionTime: 150,
        averageExecutionTime: 125,
        successRate: 0.85
    }
})