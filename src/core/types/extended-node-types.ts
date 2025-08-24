import { NodeStatus } from '@/components/nodes/behavior-tree-node';

// 扩展的端口配置接口
export interface ExtendedPortConfig {
  id: string;
  label?: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
  type?: string; // 端口数据类型
  defaultValue?: any; // 默认值
  blackboardKey?: string; // 绑定的黑板键
  required?: boolean; // 是否必填
  description?: string; // 端口描述
}

// 节点模型定义接口
export interface NodeModel {
  id: string;
  name: string;
  category: string;
  description?: string;
  icon?: string;
  color?: string;
  // 静态端口定义（不可删除）
  staticPorts?: {
    inputs?: ExtendedPortConfig[];
    outputs?: ExtendedPortConfig[];
  };
  // 可选端口定义（可添加/删除）
  dynamicPorts?: {
    inputs?: ExtendedPortConfig[];
    outputs?: ExtendedPortConfig[];
  };
  // 模型特定属性
  properties?: Record<string, any>;
}

// 扩展的行为树节点数据接口
export interface ExtendedBehaviorTreeNodeData {
  id: string;
  name: string;
  modelName?: string; // 模型名（类型/模板）
  instanceName?: string; // 实例名（显示用）
  category: string;
  description?: string;
  icon?: string;
  color?: string;
  status?: NodeStatus;
  isBreakpoint?: boolean; // 调试用（编排不显示控件）
  isDisabled?: boolean; // 调试用（编排不显示控件）
  hasError?: boolean;
  errorMessage?: string;
  executionCount?: number;
  lastExecutionTime?: number;
  
  // 扩展属性
  properties?: Record<string, any>; // 节点特定属性
  inputs?: ExtendedPortConfig[]; // 输入端口配置
  outputs?: ExtendedPortConfig[]; // 输出端口配置
  
  // Root节点标识
  isRoot?: boolean;
  
  // 模型引用
  modelId?: string;
  
  // 文档信息
  documentation?: string;
  
  // 高级配置
  advancedConfig?: {
    memory?: boolean; // 是否保持状态
    successPolicy?: string; // 成功策略
    failurePolicy?: string; // 失败策略
    priority?: number; // 优先级
  };
}