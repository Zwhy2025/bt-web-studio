import React, { useState, useCallback, useMemo } from 'react';
import { cn } from '@/core/utils/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  useComposerSelectedNodes,
  useComposerActions,
  useValidationErrors 
} from '@/core/store/behavior-tree-store';
import { useI18n } from '@/hooks/use-i18n';
import { 
  Settings,
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Plus,
  Minus,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  RefreshCw,
  Edit3,
  Hash,
  Type,
  ToggleLeft,
  List,
  Link
} from 'lucide-react';

// 属性类型定义
interface NodeProperty {
  key: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'array' | 'object';
  value: any;
  defaultValue?: any;
  description?: string;
  required?: boolean;
  options?: Array<{ label: string; value: any }>;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

// 模拟节点数据
interface MockNode {
  id: string;
  name: string;
  type: string;
  description: string;
  properties: NodeProperty[];
  ports: {
    input: Array<{ id: string; name: string; type: string }>;
    output: Array<{ id: string; name: string; type: string }>;
  };
  documentation?: string;
  warnings?: string[];
  errors?: string[];
}

// 获取模拟节点数据
const getMockNodeData = (nodeId: string): MockNode | null => {
  // 这里模拟从实际的节点数据中获取信息
  return {
    id: nodeId,
    name: 'Sequence Node',
    type: 'control-sequence',
    description: '顺序执行所有子节点，直到一个失败或全部成功',
    properties: [
      {
        key: 'name',
        label: '节点名称',
        type: 'string',
        value: 'Sequence Node',
        required: true,
        description: '节点在行为树中的显示名称'
      },
      {
        key: 'description',
        label: '描述',
        type: 'string',
        value: '顺序执行所有子节点',
        description: '节点的详细描述'
      },
      {
        key: 'enabled',
        label: '启用状态',
        type: 'boolean',
        value: true,
        defaultValue: true,
        description: '是否启用此节点'
      },
      {
        key: 'maxChildren',
        label: '最大子节点数',
        type: 'number',
        value: 10,
        defaultValue: -1,
        validation: {
          min: -1,
          message: '最大子节点数必须大于等于-1（-1表示无限制）'
        },
        description: '允许的最大子节点数量，-1表示无限制'
      },
      {
        key: 'executeMode',
        label: '执行模式',
        type: 'select',
        value: 'sequential',
        defaultValue: 'sequential',
        options: [
          { label: '顺序执行', value: 'sequential' },
          { label: '并行执行', value: 'parallel' },
          { label: '随机执行', value: 'random' }
        ],
        description: '子节点的执行方式'
      },
      {
        key: 'parameters',
        label: '自定义参数',
        type: 'array',
        value: [
          { name: 'timeout', value: '5000', type: 'number' },
          { name: 'retryCount', value: '3', type: 'number' }
        ],
        description: '节点的自定义参数列表'
      }
    ],
    ports: {
      input: [
        { id: 'input1', name: '输入', type: 'control' }
      ],
      output: [
        { id: 'output1', name: '输出', type: 'control' }
      ]
    },
    documentation: `# Sequence Node

Sequence 节点按顺序执行其所有子节点。当一个子节点返回失败时，整个序列立即停止并返回失败。只有当所有子节点都成功执行时，序列才会返回成功。

## 使用场景
- 需要按特定顺序执行的任务序列
- 依赖关系明确的操作链
- 条件检查后的动作执行

## 注意事项
- 子节点的执行顺序很重要
- 任何一个子节点失败都会导致整个序列失败
- 适合用于必须完整执行的任务序列`,
    warnings: [
      '该节点有10个子节点，可能影响性能',
      '建议为节点添加更详细的描述'
    ],
    errors: []
  };
};

// 属性编辑器组件
function PropertyEditor({ 
  property, 
  onChange 
}: { 
  property: NodeProperty; 
  onChange: (key: string, value: any) => void; 
}) {
  const handleChange = useCallback((value: any) => {
    onChange(property.key, value);
  }, [property.key, onChange]);

  const renderEditor = () => {
    switch (property.type) {
      case 'string':
        return (
          <Input
            value={property.value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={property.defaultValue || ''}
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={property.value || ''}
            onChange={(e) => handleChange(Number(e.target.value))}
            min={property.validation?.min}
            max={property.validation?.max}
          />
        );

      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Switch
              checked={property.value || false}
              onCheckedChange={handleChange}
            />
            <span className="text-sm">
              {property.value ? '启用' : '禁用'}
            </span>
          </div>
        );

      case 'select':
        return (
          <Select value={property.value} onValueChange={handleChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {property.options?.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'array':
        return (
          <div className="space-y-2">
            {(property.value || []).map((item: any, index: number) => (
              <div key={index} className="flex items-center gap-2 p-2 border rounded">
                <Input
                  value={item.name || ''}
                  onChange={(e) => {
                    const newArray = [...(property.value || [])];
                    newArray[index] = { ...item, name: e.target.value };
                    handleChange(newArray);
                  }}
                  placeholder="参数名"
                  className="flex-1"
                />
                <Input
                  value={item.value || ''}
                  onChange={(e) => {
                    const newArray = [...(property.value || [])];
                    newArray[index] = { ...item, value: e.target.value };
                    handleChange(newArray);
                  }}
                  placeholder="参数值"
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newArray = [...(property.value || [])];
                    newArray.splice(index, 1);
                    handleChange(newArray);
                  }}
                  className="h-8 w-8 p-0"
                >
                  <Minus className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newArray = [...(property.value || []), { name: '', value: '', type: 'string' }];
                handleChange(newArray);
              }}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              添加参数
            </Button>
          </div>
        );

      default:
        return (
          <Input
            value={property.value || ''}
            onChange={(e) => handleChange(e.target.value)}
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">
          {property.label}
          {property.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        {property.type === 'boolean' && <ToggleLeft className="h-4 w-4 text-muted-foreground" />}
        {property.type === 'number' && <Hash className="h-4 w-4 text-muted-foreground" />}
        {property.type === 'string' && <Type className="h-4 w-4 text-muted-foreground" />}
        {property.type === 'select' && <List className="h-4 w-4 text-muted-foreground" />}
        {property.type === 'array' && <List className="h-4 w-4 text-muted-foreground" />}
      </div>
      
      {renderEditor()}
      
      {property.description && (
        <p className="text-xs text-muted-foreground">{property.description}</p>
      )}
      
      {property.validation?.message && (
        <p className="text-xs text-orange-600">{property.validation.message}</p>
      )}
    </div>
  );
}

// 主组件
export default function ComposerPropertyPanel() {
  const { t } = useI18n();
  const selectedNodeIds = useComposerSelectedNodes();
  const composerActions = useComposerActions();
  const validationErrors = useValidationErrors();

  // 获取当前选中的节点数据
  const selectedNode = useMemo(() => {
    if (selectedNodeIds.length !== 1) return null;
    return getMockNodeData(selectedNodeIds[0]);
  }, [selectedNodeIds]);

  // 属性变更处理
  const handlePropertyChange = useCallback((key: string, value: any) => {
    if (!selectedNode) return;
    
    console.log(`更新节点 ${selectedNode.id} 的属性 ${key}:`, value);
    // TODO: 集成到实际的状态管理中
    // composerActions.updateNodeProperty(selectedNode.id, key, value);
  }, [selectedNode]);

  // 节点相关的错误和警告
  const nodeValidationErrors = useMemo(() => {
    if (!selectedNode) return [];
    return validationErrors.filter(error => error.nodeId === selectedNode.id);
  }, [selectedNode, validationErrors]);

  if (selectedNodeIds.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center space-y-2">
          <Settings className="h-12 w-12 text-muted-foreground mx-auto" />
          <div className="font-medium text-sm">{t('composer:propertyPanel.noSelection')}</div>
          <div className="text-xs text-muted-foreground">
            {t('composer:propertyPanel.noSelectionDesc')}
          </div>
        </div>
      </div>
    );
  }

  if (selectedNodeIds.length > 1) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center space-y-2">
          <Settings className="h-12 w-12 text-muted-foreground mx-auto" />
          <div className="font-medium text-sm">{t('composer:propertyPanel.multiSelection')}</div>
          <div className="text-xs text-muted-foreground">
            {t('composer:propertyPanel.multiSelectionDesc', { count: selectedNodeIds.length })}
          </div>
          <Button variant="outline" size="sm" className="mt-4">
            {t('composer:propertyPanel.batchEdit')}
          </Button>
        </div>
      </div>
    );
  }

  if (!selectedNode) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center space-y-2">
          <XCircle className="h-12 w-12 text-red-500 mx-auto" />
          <div className="font-medium text-sm">{t('composer:propertyPanel.nodeNotFound')}</div>
          <div className="text-xs text-muted-foreground">
            {t('composer:propertyPanel.nodeNotFoundDesc')}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* 节点基本信息 */}
      <div className="p-3 border-b">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm truncate">{selectedNode.name}</div>
            <div className="text-xs text-muted-foreground">{selectedNode.type}</div>
          </div>
          <div className="flex items-center gap-1 ml-2">
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <Copy className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <Edit3 className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        {selectedNode.description && (
          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
            {selectedNode.description}
          </p>
        )}
      </div>

      {/* 错误和警告 */}
      {(selectedNode.errors.length > 0 || selectedNode.warnings.length > 0 || nodeValidationErrors.length > 0) && (
        <div className="p-3 border-b space-y-2">
          {/* 验证错误 */}
          {nodeValidationErrors.map((error, index) => (
            <Alert key={index} variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                {error.message}
              </AlertDescription>
            </Alert>
          ))}
          
          {/* 节点错误 */}
          {selectedNode.errors.map((error, index) => (
            <Alert key={index} variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">{error}</AlertDescription>
            </Alert>
          ))}
          
          {/* 节点警告 */}
          {selectedNode.warnings.map((warning, index) => (
            <Alert key={index}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">{warning}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* 属性标签页 */}
      <div className="flex-1 min-h-0">
        <Tabs defaultValue="properties" className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-3 mx-3 mt-2">
            <TabsTrigger value="properties" className="text-xs">
              <Settings className="w-3 h-3 mr-1" />
              {t('composer:propertyPanel.tabs.properties')}
            </TabsTrigger>
            <TabsTrigger value="ports" className="text-xs">
              <Link className="w-3 h-3 mr-1" />
              {t('composer:propertyPanel.tabs.ports')}
            </TabsTrigger>
            <TabsTrigger value="docs" className="text-xs">
              <FileText className="w-3 h-3 mr-1" />
              {t('composer:propertyPanel.tabs.documentation')}
            </TabsTrigger>
          </TabsList>

          {/* 属性编辑 */}
          <TabsContent value="properties" className="flex-1 mt-2">
            <ScrollArea className="h-full">
              <div className="p-3 space-y-4">
                {selectedNode.properties.map((property) => (
                  <PropertyEditor
                    key={property.key}
                    property={property}
                    onChange={handlePropertyChange}
                  />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* 端口配置 */}
          <TabsContent value="ports" className="flex-1 mt-2">
            <ScrollArea className="h-full">
              <div className="p-3 space-y-4">
                <Accordion type="multiple" defaultValue={["input", "output"]}>
                  <AccordionItem value="input">
                    <AccordionTrigger className="text-sm">
                      {t('composer:propertyPanel.ports.input')} ({selectedNode.ports.input.length})
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        {selectedNode.ports.input.map((port) => (
                          <div key={port.id} className="flex items-center justify-between p-2 border rounded">
                            <div className="flex-1">
                              <div className="font-medium text-xs">{port.name}</div>
                              <div className="text-xs text-muted-foreground">{port.type}</div>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {port.type}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="output">
                    <AccordionTrigger className="text-sm">
                      {t('composer:propertyPanel.ports.output')} ({selectedNode.ports.output.length})
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        {selectedNode.ports.output.map((port) => (
                          <div key={port.id} className="flex items-center justify-between p-2 border rounded">
                            <div className="flex-1">
                              <div className="font-medium text-xs">{port.name}</div>
                              <div className="text-xs text-muted-foreground">{port.type}</div>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {port.type}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* 文档说明 */}
          <TabsContent value="docs" className="flex-1 mt-2">
            <ScrollArea className="h-full">
              <div className="p-3">
                {selectedNode.documentation ? (
                  <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap text-xs">
                      {selectedNode.documentation}
                    </pre>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <div className="text-sm font-medium">{t('composer:propertyPanel.noDocs')}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {t('composer:propertyPanel.noDocsDesc')}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>

      {/* 底部操作按钮 */}
      <div className="p-3 border-t bg-muted/30">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="flex-1 text-xs">
            <RefreshCw className="w-3 h-3 mr-1" />
            {t('composer:propertyPanel.actions.reset')}
          </Button>
          <Button variant="outline" size="sm" className="flex-1 text-xs">
            <Trash2 className="w-3 h-3 mr-1" />
            {t('composer:propertyPanel.actions.delete')}
          </Button>
        </div>
      </div>
    </div>
  );
}