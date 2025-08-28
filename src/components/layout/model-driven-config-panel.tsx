import React, { useCallback, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Hash,
  Type,
  ToggleLeft,
  List
} from 'lucide-react';
import { ExtendedBehaviorTreeNodeData } from '@/core/types/extended-node-types';

interface ModelDrivenConfigPanelProps {
  nodeData: ExtendedBehaviorTreeNodeData;
  onChange: (data: Partial<ExtendedBehaviorTreeNodeData>) => void;
  disabled?: boolean;
}

// 属性配置项接口
interface PropertyConfig {
  key: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'textarea';
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

const ModelDrivenConfigPanel: React.FC<ModelDrivenConfigPanelProps> = ({
  nodeData,
  onChange,
  disabled = false
}) => {
  // 基础属性配置
  const basicProperties: PropertyConfig[] = useMemo(() => [
    {
      key: 'instanceName',
      label: '实例名',
      type: 'string',
      value: nodeData.instanceName || '',
      description: '节点在行为树中的实例名称'
    },
    {
      key: 'description',
      label: '描述',
      type: 'textarea',
      value: nodeData.description || '',
      description: '节点的详细描述信息'
    }
  ], [nodeData.instanceName, nodeData.description]);

  // 高级属性配置
  const advancedProperties: PropertyConfig[] = useMemo(() => {
    const advancedConfig = nodeData.advancedConfig || {};
    
    return [
      {
        key: 'memory',
        label: '记忆模式',
        type: 'boolean',
        value: advancedConfig.memory ?? false,
        description: '是否保持节点执行状态'
      },
      {
        key: 'successPolicy',
        label: '成功策略',
        type: 'select',
        value: advancedConfig.successPolicy || 'all',
        options: [
          { label: '全部成功', value: 'all' },
          { label: '任一成功', value: 'any' }
        ],
        description: '定义节点成功的条件'
      },
      {
        key: 'failurePolicy',
        label: '失败策略',
        type: 'select',
        value: advancedConfig.failurePolicy || 'any',
        options: [
          { label: '任一失败', value: 'any' },
          { label: '全部失败', value: 'all' }
        ],
        description: '定义节点失败的条件'
      },
      {
        key: 'priority',
        label: '优先级',
        type: 'number',
        value: advancedConfig.priority ?? 0,
        validation: {
          min: 0,
          max: 100
        },
        description: '节点执行优先级 (0-100)'
      }
    ];
  }, [nodeData.advancedConfig]);

  // 处理属性变更
  const handlePropertyChange = useCallback((key: string, value: any) => {
    // 特殊处理高级配置属性
    if (['memory', 'successPolicy', 'failurePolicy', 'priority'].includes(key)) {
      const advancedConfig = { ...(nodeData.advancedConfig || {}), [key]: value };
      onChange({ advancedConfig });
    } else {
      // 处理基础属性
      onChange({ [key]: value });
    }
  }, [nodeData.advancedConfig, onChange]);

  // 渲染属性编辑器
  const renderPropertyEditor = (property: PropertyConfig) => {
    const handleChange = (value: any) => {
      handlePropertyChange(property.key, value);
    };

    switch (property.type) {
      case 'string':
        return (
          <Input
            value={property.value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={property.defaultValue || ''}
            disabled={disabled}
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
            disabled={disabled}
          />
        );

      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Switch
              checked={property.value || false}
              onCheckedChange={handleChange}
              disabled={disabled}
            />
            <span className="text-sm">
              {property.value ? '启用' : '禁用'}
            </span>
          </div>
        );

      case 'select':
        return (
          <Select 
            value={property.value} 
            onValueChange={handleChange}
            disabled={disabled}
          >
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

      case 'textarea':
        return (
          <Textarea
            value={property.value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={property.defaultValue || ''}
            className="min-h-[80px]"
            disabled={disabled}
          />
        );

      default:
        return (
          <Input
            value={property.value || ''}
            onChange={(e) => handleChange(e.target.value)}
            disabled={disabled}
          />
        );
    }
  };

  // 渲染属性项
  const renderPropertyItem = (property: PropertyConfig) => (
    <div className="space-y-2" key={property.key}>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">
          {property.label}
          {property.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        {property.type === 'boolean' && <ToggleLeft className="h-4 w-4 text-muted-foreground" />}
        {property.type === 'number' && <Hash className="h-4 w-4 text-muted-foreground" />}
        {property.type === 'string' && <Type className="h-4 w-4 text-muted-foreground" />}
        {property.type === 'select' && <List className="h-4 w-4 text-muted-foreground" />}
      </div>
      
      {renderPropertyEditor(property)}
      
      {property.description && (
        <p className="text-xs text-muted-foreground">{property.description}</p>
      )}
      
      {property.validation?.message && (
        <p className="text-xs text-orange-600">{property.validation.message}</p>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* 基础属性 */}
      <div className="space-y-4">
        <h3 className="font-medium text-sm">基础属性</h3>
        <div className="space-y-3">
          {basicProperties.map(renderPropertyItem)}
        </div>
      </div>

      {/* 高级属性 */}
      <div className="space-y-4">
        <h3 className="font-medium text-sm">高级属性</h3>
        <div className="space-y-3">
          {advancedProperties.map(renderPropertyItem)}
        </div>
      </div>

      {/* 模型特定属性 */}
      {nodeData.properties && Object.keys(nodeData.properties).length > 0 && (
        <div className="space-y-4">
          <h3 className="font-medium text-sm">模型特定属性</h3>
          <div className="space-y-3">
            {Object.entries(nodeData.properties).map(([key, value]) => (
              <div className="space-y-2" key={key}>
                <Label className="text-sm font-medium">{key}</Label>
                <Input
                  value={String(value)}
                  onChange={(e) => {
                    const newProperties = { ...nodeData.properties, [key]: e.target.value };
                    onChange({ properties: newProperties });
                  }}
                  disabled={disabled}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelDrivenConfigPanel;