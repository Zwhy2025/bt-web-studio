import { useMemo } from 'react';
import { useBehaviorTreeStore } from '@/core/store/behavior-tree-store';
import { ExtendedPortConfig } from '@/core/types/extended-node-types';

/**
 * 节点校验Hook
 * 提供节点配置的实时校验和错误提示
 */
export interface ValidationError {
  id: string;
  nodeId: string;
  type: 'error' | 'warning';
  message: string;
  field?: string;
}

export const useNodeValidation = (nodeId: string) => {
  const nodes = useBehaviorTreeStore((state) => state.nodes);
  const edges = useBehaviorTreeStore((state) => state.edges);

  const node = useMemo(() => {
    return nodes.find((n) => n.id === nodeId) || null;
  }, [nodes, nodeId]);

  const validationErrors = useMemo<ValidationError[]>(() => {
    if (!node) return [];

    const errors: ValidationError[] = [];
    const nodeData = node.data as any;

    // 1. 检查实例名
    if (nodeData.instanceName) {
      // 检查实例名是否唯一（除了Root节点）
      const duplicateNodes = nodes.filter((n) => 
        n.id !== nodeId && 
        (n.data as any)?.instanceName === nodeData.instanceName
      );
      
      if (duplicateNodes.length > 0) {
        errors.push({
          id: `duplicate-name-${nodeId}`,
          nodeId,
          type: 'error',
          message: `实例名 "${nodeData.instanceName}" 已被其他节点使用`,
          field: 'instanceName'
        });
      }
    }

    // 2. 检查端口配置
    const inputs = nodeData.inputs || [];
    const outputs = nodeData.outputs || [];

    // 检查输入端口ID唯一性
    const inputIds = inputs.map((port: ExtendedPortConfig) => port.id);
    const duplicateInputIds = inputIds.filter((id: string, index: number) => 
      inputIds.indexOf(id) !== index
    );
    
    if (duplicateInputIds.length > 0) {
      errors.push({
        id: `duplicate-input-ports-${nodeId}`,
        nodeId,
        type: 'error',
        message: `输入端口ID重复: ${[...new Set(duplicateInputIds)].join(', ')}`,
        field: 'inputs'
      });
    }

    // 检查输出端口ID唯一性
    const outputIds = outputs.map((port: ExtendedPortConfig) => port.id);
    const duplicateOutputIds = outputIds.filter((id: string, index: number) => 
      outputIds.indexOf(id) !== index
    );
    
    if (duplicateOutputIds.length > 0) {
      errors.push({
        id: `duplicate-output-ports-${nodeId}`,
        nodeId,
        type: 'error',
        message: `输出端口ID重复: ${[...new Set(duplicateOutputIds)].join(', ')}`,
        field: 'outputs'
      });
    }

    // 3. Root节点特殊校验
    if (nodeData.instanceName === 'root') {
      // Root节点不能有输入端口
      if (inputs.length > 0) {
        errors.push({
          id: `root-input-ports-${nodeId}`,
          nodeId,
          type: 'error',
          message: 'Root节点不允许有输入端口',
          field: 'inputs'
        });
      }

      // Root节点模型名必须为Sequence
      if (nodeData.modelName !== 'Sequence') {
        errors.push({
          id: `root-model-name-${nodeId}`,
          nodeId,
          type: 'error',
          message: 'Root节点模型名必须为 "Sequence"',
          field: 'modelName'
        });
      }
    }

    // 4. 端口命名规范校验
    const portNamePattern = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
    
    inputs.forEach((port: ExtendedPortConfig, index: number) => {
      if (port.id && !portNamePattern.test(port.id)) {
        errors.push({
          id: `invalid-input-port-name-${nodeId}-${index}`,
          nodeId,
          type: 'error',
          message: `输入端口ID "${port.id}" 不符合命名规范（只能包含字母、数字、下划线，且不能以数字开头）`,
          field: `inputs[${index}].id`
        });
      }
    });

    outputs.forEach((port: ExtendedPortConfig, index: number) => {
      if (port.id && !portNamePattern.test(port.id)) {
        errors.push({
          id: `invalid-output-port-name-${nodeId}-${index}`,
          nodeId,
          type: 'error',
          message: `输出端口ID "${port.id}" 不符合命名规范（只能包含字母、数字、下划线，且不能以数字开头）`,
          field: `outputs[${index}].id`
        });
      }
    });

    // 5. 黑板键绑定校验
    inputs.forEach((port: ExtendedPortConfig, index: number) => {
      if (port.blackboardKey) {
        // 可以添加类型匹配校验等
      }
    });

    outputs.forEach((port: ExtendedPortConfig, index: number) => {
      if (port.blackboardKey) {
        // 可以添加类型匹配校验等
      }
    });

    return errors;
  }, [node, nodes, edges]);

  // 警告信息
  const validationWarnings = useMemo<ValidationError[]>(() => {
    if (!node) return [];

    const warnings: ValidationError[] = [];
    const nodeData = node.data as any;

    // 1. 检查是否缺少描述
    if (!nodeData.description || nodeData.description.trim() === '') {
      warnings.push({
        id: `missing-description-${nodeId}`,
        nodeId,
        type: 'warning',
        message: '建议添加节点描述以提高可读性',
        field: 'description'
      });
    }

    // 2. Root节点警告
    if (nodeData.instanceName === 'root') {
      // 检查Root节点是否只有一个输出端口
      const outputs = nodeData.outputs || [];
      if (outputs.length > 1) {
        warnings.push({
          id: `root-multiple-outputs-${nodeId}`,
          nodeId,
          type: 'warning',
          message: 'Root节点建议只使用一个输出端口',
          field: 'outputs'
        });
      }
    }

    return warnings;
  }, [node]);

  return {
    validationErrors,
    validationWarnings,
    hasErrors: validationErrors.length > 0,
    hasWarnings: validationWarnings.length > 0
  };
};