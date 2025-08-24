import React, { useCallback, useMemo } from 'react';
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
  useValidationErrors,
  useBehaviorTreeStore,
  useBlackboard
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
  Link,
  Crown
} from 'lucide-react';

// 导入新创建的组件
import PortsConfigPanel from './ports-config-panel';
import BlackboardKeySelector from './blackboard-key-selector';
import ModelDrivenConfigPanel from './model-driven-config-panel';
import { ExtendedBehaviorTreeNodeData, ExtendedPortConfig } from '@/core/types/extended-node-types';

// 导入校验hook
import { useNodeValidation } from '@/hooks/use-node-validation';

// 导入键盘快捷键hook
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';

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

// 扩展的节点数据类型（用于类型转换）
interface ExtendedNodeData {
  id: string;
  name: string;
  modelName?: string;
  instanceName?: string;
  category: string;
  description?: string;
  icon?: string;
  color?: string;
  status?: string;
  isBreakpoint?: boolean;
  isDisabled?: boolean;
  hasError?: boolean;
  errorMessage?: string;
  executionCount?: number;
  lastExecutionTime?: number;
  properties?: Record<string, any>;
  inputs?: ExtendedPortConfig[];
  outputs?: ExtendedPortConfig[];
  documentation?: string;
  advancedConfig?: {
    memory?: boolean;
    successPolicy?: string;
    failurePolicy?: string;
    priority?: number;
  };
}


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
  const storeValidationErrors = useValidationErrors();
  const nodes = useBehaviorTreeStore((s) => s.nodes);
  const edges = useBehaviorTreeStore((s) => s.edges);
  const actions = useBehaviorTreeStore((s) => s.actions);
  const blackboard = useBlackboard();
  const blackboardKeys = useMemo(() => Object.keys(blackboard || {}), [blackboard]);

  // 获取当前选中的真实节点
  const selectedNode = useMemo(() => {
    if (selectedNodeIds.length !== 1) return null;
    return nodes.find((n) => n.id === selectedNodeIds[0]) || null;
  }, [selectedNodeIds, nodes]);

  // 检查是否为Root节点
  const isRootNode = useMemo(() => {
    if (!selectedNode) return false;
    return (selectedNode.data as any)?.instanceName === 'root';
  }, [selectedNode]);

  // 节点校验
  const { validationErrors: hookValidationErrors, validationWarnings: hookValidationWarnings, hasErrors, hasWarnings } = useNodeValidation(selectedNode?.id || '');
  
  // 键盘快捷键
  useKeyboardShortcuts(selectedNodeIds);

  // 更新节点 data 的便捷方法
  const updateNodeData = useCallback((patch: any) => {
    if (!selectedNode) return;
    actions.updateNode(selectedNode.id, { data: { ...selectedNode.data, ...patch } } as any);
  }, [actions, selectedNode]);

  // 节点相关的错误和警告
  const nodeValidationErrors = useMemo(() => {
    if (!selectedNode) return [] as any[];
    return storeValidationErrors.filter(error => error.nodeId === selectedNode.id);
  }, [selectedNode, storeValidationErrors]);
  
  // 节点错误和警告
  const selErrors: string[] = useMemo(() => (selectedNode as any)?.errors || [], [selectedNode]);
  const selWarnings: string[] = useMemo(() => (selectedNode as any)?.warnings || [], [selectedNode]);

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
            <div className="text-[11px] text-muted-foreground truncate">
              {String((selectedNode.data as any)?.modelName || (selectedNode.data as any)?.name || selectedNode.type || '')}
            </div>
            <div className="font-medium text-sm truncate flex items-center">
              {String((selectedNode.data as any)?.instanceName || '') || '—'}
              {isRootNode && (
                <Crown className="h-3 w-3 ml-1 text-yellow-500" />
              )}
            </div>
            {isRootNode && (
              <div className="text-[10px] text-yellow-600 mt-1">
                Root节点：无输入端口，仅允许一个输出端口
              </div>
            )}
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
        
        {/* 编排模式下不展示描述 */}
      </div>

      {/* 错误和警告 */}
      {(selErrors.length > 0 || selWarnings.length > 0 || nodeValidationErrors.length > 0 || 
        hookValidationErrors.length > 0 || hookValidationWarnings.length > 0) && (
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
          {selErrors.map((error, index) => (
            <Alert key={index} variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">{error}</AlertDescription>
            </Alert>
          ))}
          
          {/* 校验错误 */}
          {hookValidationErrors.map((error, index) => (
            <Alert key={index} variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">{error.message}</AlertDescription>
            </Alert>
          ))}
          
          {/* 节点警告 */}
          {selWarnings.map((warning, index) => (
            <Alert key={index}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">{warning}</AlertDescription>
            </Alert>
          ))}
          
          {/* 校验警告 */}
          {hookValidationWarnings.map((warning, index) => (
            <Alert key={index}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">{warning.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* 属性标签页 */}
      <div className="flex-1 min-h-0">
        <Tabs defaultValue="properties" className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-4 mx-3 mt-2">
            <TabsTrigger value="properties" className="text-xs">
              <Settings className="w-3 h-3 mr-1" />
              {t('composer:propertyPanel.tabs.properties')}
            </TabsTrigger>
            <TabsTrigger value="ports" className="text-xs">
              <Link className="w-3 h-3 mr-1" />
              {t('composer:propertyPanel.tabs.ports')}
            </TabsTrigger>
            <TabsTrigger value="documentation" className="text-xs">
              <FileText className="w-3 h-3 mr-1" />
              {t('composer:propertyPanel.tabs.description')}
            </TabsTrigger>
            <TabsTrigger value="advanced" className="text-xs">
              <Settings className="w-3 h-3 mr-1" />
              高级
            </TabsTrigger>
          </TabsList>

          {/* 属性编辑 */}
          <TabsContent value="properties" className="flex-1 mt-2">
            <ScrollArea className="h-full">
              <div className="p-3">
                <ModelDrivenConfigPanel
                  nodeData={selectedNode.data as ExtendedBehaviorTreeNodeData}
                  onChange={(patch) => {
                    // 特殊处理Root节点实例名
                    if (patch.instanceName === 'root') {
                      // 统一处理 root 唯一与无输入
                      nodes.forEach((n) => {
                        if (n.id !== selectedNode.id && (n.data as any)?.instanceName === 'root') {
                          actions.updateNode(n.id, { data: { ...n.data, instanceName: '' } } as any)
                        }
                      });
                      actions.updateNode(selectedNode.id, { 
                        data: { 
                          ...selectedNode.data, 
                          ...patch, 
                          instanceName: 'root', 
                          modelName: 'Sequence', 
                          category: 'control',
                          inputs: [] 
                        } 
                      } as any)
                    } else {
                      actions.updateNode(selectedNode.id, { 
                        data: { ...selectedNode.data, ...patch } 
                      } as any)
                    }
                  }}
                  disabled={false}
                />
              </div>
            </ScrollArea>
          </TabsContent>

          {/* 描述编辑 */}
          <TabsContent value="docs" className="flex-1 mt-2">
            <ScrollArea className="h-full">
              <div className="p-3 space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs">{t('composer:propertyPanel.fields.description')}</Label>
                  <Textarea
                    value={String((selectedNode.data as any)?.description || '')}
                    onChange={(e) => actions.updateNode(selectedNode.id, { data: { ...selectedNode.data, description: e.target.value } } as any)}
                    placeholder={t('composer:propertyPanel.fields.description')}
                    className="min-h-[120px]"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs">文档</Label>
                  <Textarea
                    value={String((selectedNode.data as any)?.documentation || '')}
                    onChange={(e) => actions.updateNode(selectedNode.id, { data: { ...selectedNode.data, documentation: e.target.value } } as any)}
                    placeholder="在此输入节点的详细文档信息，支持Markdown格式"
                    className="min-h-[150px]"
                  />
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* 端口配置 */}
          <TabsContent value="ports" className="flex-1 mt-2">
            <ScrollArea className="h-full">
              <div className="p-3">
                <PortsConfigPanel
                  inputs={((selectedNode.data as any)?.inputs) || []}
                  outputs={((selectedNode.data as any)?.outputs) || []}
                  onInputsChange={(inputs) => {
                    actions.updateNode(selectedNode.id, { 
                      data: { ...selectedNode.data, inputs } 
                    } as any);
                  }}
                  onOutputsChange={(outputs) => {
                    actions.updateNode(selectedNode.id, { 
                      data: { ...selectedNode.data, outputs } 
                    } as any);
                  }}
                  isRoot={isRootNode}
                  disabled={false}
                />
              </div>
            </ScrollArea>
          </TabsContent>

          {/* 文档说明 */}
          <TabsContent value="documentation" className="flex-1 mt-2">
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
          
          {/* 高级设置 */}
          <TabsContent value="advanced" className="flex-1 mt-2">
            <ScrollArea className="h-full">
              <div className="p-3 space-y-4">
                <div className="space-y-3">
                  <h3 className="font-medium text-sm">节点统计</h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 border rounded">
                      <div className="text-muted-foreground">执行次数</div>
                      <div className="font-medium">{selectedNode.data.executionCount || 0}</div>
                    </div>
                    <div className="p-2 border rounded">
                      <div className="text-muted-foreground">最后执行</div>
                      <div className="font-medium">
                        {selectedNode.data.lastExecutionTime 
                          ? new Date(selectedNode.data.lastExecutionTime).toLocaleTimeString()
                          : '从未执行'}
                      </div>
                    </div>
                  </div>
                </div>
                
                {isRootNode && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-xs">
                    <div className="font-medium text-yellow-800 flex items-center">
                      <Crown className="h-3 w-3 mr-1" />
                      Root节点约束
                    </div>
                    <ul className="list-disc list-inside mt-1 space-y-1 text-yellow-700">
                      <li>整个行为树只能有一个Root节点</li>
                      <li>Root节点不允许有输入端口</li>
                      <li>Root节点模型名强制为"Sequence"</li>
                      <li>不允许任何边连接到Root节点</li>
                    </ul>
                  </div>
                )}
                
                <div className="space-y-3">
                  <h3 className="font-medium text-sm">调试信息</h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">节点ID:</span>
                      <span className="font-mono">{selectedNode.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">节点类型:</span>
                      <span>{selectedNode.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">模型名:</span>
                      <span>{(selectedNode.data as any)?.modelName || (selectedNode.data as any)?.name || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>

      {/* 底部操作按钮 */}
      <div className="p-3 border-t bg-muted/30">
        <div className="grid grid-cols-4 gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs"
            onClick={() => composerActions.undo()}
            disabled={!composerActions.canUndo()}
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            撤销
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs"
            onClick={() => composerActions.redo()}
            disabled={!composerActions.canRedo()}
          >
            <RefreshCw className="w-3 h-3 mr-1 transform rotate-180" />
            重做
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs"
            onClick={() => {
              // 复制节点
              console.log('复制节点:', selectedNode?.id);
            }}
          >
            <Copy className="w-3 h-3 mr-1" />
            复制
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs"
            onClick={() => {
              // 删除节点
              if (selectedNode) {
                actions.deleteNodes([selectedNode.id]);
              }
            }}
          >
            <Trash2 className="w-3 h-3 mr-1" />
            {t('composer:propertyPanel.actions.delete')}
          </Button>
        </div>
      </div>
    </div>
  );
}
