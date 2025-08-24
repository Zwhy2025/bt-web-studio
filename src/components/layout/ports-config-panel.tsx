import React, { useCallback, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  Plus, 
  Minus, 
  ArrowUp, 
  ArrowDown,
  Hash,
  Type,
  Link
} from 'lucide-react';
import { ExtendedPortConfig } from '@/core/types/extended-node-types';
import { useBlackboard } from '@/core/store/behavior-tree-store';

interface PortsConfigPanelProps {
  inputs?: ExtendedPortConfig[];
  outputs?: ExtendedPortConfig[];
  onInputsChange?: (inputs: ExtendedPortConfig[]) => void;
  onOutputsChange?: (outputs: ExtendedPortConfig[]) => void;
  isRoot?: boolean;
  disabled?: boolean;
}

const PortsConfigPanel: React.FC<PortsConfigPanelProps> = ({
  inputs = [],
  outputs = [],
  onInputsChange,
  onOutputsChange,
  isRoot = false,
  disabled = false
}) => {
  const blackboard = useBlackboard();
  const blackboardKeys = useMemo(() => Object.keys(blackboard || {}), [blackboard]);

  // 添加输入端口
  const handleAddInput = useCallback(() => {
    if (isRoot || disabled || !onInputsChange) return;
    
    const newPort: ExtendedPortConfig = {
      id: `input_${inputs.length + 1}`,
      label: `Input ${inputs.length + 1}`,
      side: 'top',
      type: 'string'
    };
    
    onInputsChange([...inputs, newPort]);
  }, [inputs, isRoot, disabled, onInputsChange]);

  // 添加输出端口
  const handleAddOutput = useCallback(() => {
    if (disabled || !onOutputsChange) return;
    
    const newPort: ExtendedPortConfig = {
      id: `output_${outputs.length + 1}`,
      label: `Output ${outputs.length + 1}`,
      side: 'bottom',
      type: 'string'
    };
    
    onOutputsChange([...outputs, newPort]);
  }, [outputs, disabled, onOutputsChange]);

  // 更新输入端口
  const handleUpdateInput = useCallback((index: number, updates: Partial<ExtendedPortConfig>) => {
    if (disabled || !onInputsChange) return;
    
    const updatedInputs = [...inputs];
    updatedInputs[index] = { ...updatedInputs[index], ...updates };
    onInputsChange(updatedInputs);
  }, [inputs, disabled, onInputsChange]);

  // 更新输出端口
  const handleUpdateOutput = useCallback((index: number, updates: Partial<ExtendedPortConfig>) => {
    if (disabled || !onOutputsChange) return;
    
    const updatedOutputs = [...outputs];
    updatedOutputs[index] = { ...updatedOutputs[index], ...updates };
    onOutputsChange(updatedOutputs);
  }, [outputs, disabled, onOutputsChange]);

  // 删除输入端口
  const handleRemoveInput = useCallback((index: number) => {
    if (isRoot || disabled || !onInputsChange) return;
    
    const updatedInputs = [...inputs];
    updatedInputs.splice(index, 1);
    onInputsChange(updatedInputs);
  }, [inputs, isRoot, disabled, onInputsChange]);

  // 删除输出端口
  const handleRemoveOutput = useCallback((index: number) => {
    if (disabled || !onOutputsChange) return;
    
    const updatedOutputs = [...outputs];
    updatedOutputs.splice(index, 1);
    onOutputsChange(updatedOutputs);
  }, [outputs, disabled, onOutputsChange]);

  // 移动输入端口位置
  const handleMoveInput = useCallback((index: number, direction: 'up' | 'down') => {
    if (disabled || !onInputsChange) return;
    
    const updatedInputs = [...inputs];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < updatedInputs.length) {
      [updatedInputs[index], updatedInputs[targetIndex]] = [updatedInputs[targetIndex], updatedInputs[index]];
      onInputsChange(updatedInputs);
    }
  }, [inputs, disabled, onInputsChange]);

  // 移动输出端口位置
  const handleMoveOutput = useCallback((index: number, direction: 'up' | 'down') => {
    if (disabled || !onOutputsChange) return;
    
    const updatedOutputs = [...outputs];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < updatedOutputs.length) {
      [updatedOutputs[index], updatedOutputs[targetIndex]] = [updatedOutputs[targetIndex], updatedOutputs[index]];
      onOutputsChange(updatedOutputs);
    }
  }, [outputs, disabled, onOutputsChange]);

  return (
    <div className="space-y-4">
      <Accordion type="multiple" defaultValue={["input", "output"]}>
        {/* 输入端口配置 */}
        <AccordionItem value="input">
          <AccordionTrigger className="text-sm">
            输入端口 ({inputs.length})
            {isRoot && <span className="ml-2 text-xs text-muted-foreground">(Root节点无输入端口)</span>}
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              {inputs.map((port, index) => (
                <div key={`input-${index}`} className="flex items-center gap-2 p-2 border rounded">
                  <div className="flex-1 grid grid-cols-12 gap-2">
                    <div className="col-span-3">
                      <Label className="text-xs">ID</Label>
                      <Input
                        className="h-8 text-xs"
                        value={port.id || ''}
                        onChange={(e) => handleUpdateInput(index, { id: e.target.value })}
                        disabled={disabled}
                      />
                    </div>
                    <div className="col-span-3">
                      <Label className="text-xs">标签</Label>
                      <Input
                        className="h-8 text-xs"
                        value={port.label || ''}
                        onChange={(e) => handleUpdateInput(index, { label: e.target.value })}
                        disabled={disabled}
                      />
                    </div>
                    <div className="col-span-3">
                      <Label className="text-xs">方向</Label>
                      <Select
                        value={port.side || 'top'}
                        onValueChange={(value: 'top' | 'bottom' | 'left' | 'right') => 
                          handleUpdateInput(index, { side: value })
                        }
                        disabled={disabled}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="top">top</SelectItem>
                          <SelectItem value="bottom">bottom</SelectItem>
                          <SelectItem value="left">left</SelectItem>
                          <SelectItem value="right">right</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-3">
                      <Label className="text-xs">类型</Label>
                      <Select
                        value={port.type || 'string'}
                        onValueChange={(value: string) => 
                          handleUpdateInput(index, { type: value })
                        }
                        disabled={disabled}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="string">
                            <div className="flex items-center">
                              <Type className="h-3 w-3 mr-1" />
                              string
                            </div>
                          </SelectItem>
                          <SelectItem value="number">
                            <div className="flex items-center">
                              <Hash className="h-3 w-3 mr-1" />
                              number
                            </div>
                          </SelectItem>
                          <SelectItem value="boolean">boolean</SelectItem>
                          <SelectItem value="object">object</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs">默认值</Label>
                    <Input
                      className="h-8 text-xs"
                      value={port.defaultValue || ''}
                      onChange={(e) => handleUpdateInput(index, { defaultValue: e.target.value })}
                      placeholder="默认值"
                      disabled={disabled}
                    />
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs">黑板绑定</Label>
                    <Select
                      value={port.blackboardKey || ''}
                      onValueChange={(value: string) => 
                        handleUpdateInput(index, { blackboardKey: value || undefined })
                      }
                      disabled={disabled}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="选择黑板键" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">无绑定</SelectItem>
                        {blackboardKeys.map((key) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center">
                              <Link className="h-3 w-3 mr-1" />
                              {key}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex flex-col gap-1 justify-end">
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleMoveInput(index, 'up')}
                        disabled={index === 0 || disabled}
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleMoveInput(index, 'down')}
                        disabled={index === inputs.length - 1 || disabled}
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleRemoveInput(index)}
                        disabled={isRoot || disabled}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddInput}
                disabled={isRoot || disabled}
                className="w-full"
              >
                <Plus className="h-3 w-3 mr-1" /> 添加输入端口
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* 输出端口配置 */}
        <AccordionItem value="output">
          <AccordionTrigger className="text-sm">
            输出端口 ({outputs.length})
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              {outputs.map((port, index) => (
                <div key={`output-${index}`} className="flex items-center gap-2 p-2 border rounded">
                  <div className="flex-1 grid grid-cols-12 gap-2">
                    <div className="col-span-3">
                      <Label className="text-xs">ID</Label>
                      <Input
                        className="h-8 text-xs"
                        value={port.id || ''}
                        onChange={(e) => handleUpdateOutput(index, { id: e.target.value })}
                        disabled={disabled}
                      />
                    </div>
                    <div className="col-span-3">
                      <Label className="text-xs">标签</Label>
                      <Input
                        className="h-8 text-xs"
                        value={port.label || ''}
                        onChange={(e) => handleUpdateOutput(index, { label: e.target.value })}
                        disabled={disabled}
                      />
                    </div>
                    <div className="col-span-3">
                      <Label className="text-xs">方向</Label>
                      <Select
                        value={port.side || 'bottom'}
                        onValueChange={(value: 'top' | 'bottom' | 'left' | 'right') => 
                          handleUpdateOutput(index, { side: value })
                        }
                        disabled={disabled}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="top">top</SelectItem>
                          <SelectItem value="bottom">bottom</SelectItem>
                          <SelectItem value="left">left</SelectItem>
                          <SelectItem value="right">right</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-3">
                      <Label className="text-xs">类型</Label>
                      <Select
                        value={port.type || 'string'}
                        onValueChange={(value: string) => 
                          handleUpdateOutput(index, { type: value })
                        }
                        disabled={disabled}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="string">
                            <div className="flex items-center">
                              <Type className="h-3 w-3 mr-1" />
                              string
                            </div>
                          </SelectItem>
                          <SelectItem value="number">
                            <div className="flex items-center">
                              <Hash className="h-3 w-3 mr-1" />
                              number
                            </div>
                          </SelectItem>
                          <SelectItem value="boolean">boolean</SelectItem>
                          <SelectItem value="object">object</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs">默认值</Label>
                    <Input
                      className="h-8 text-xs"
                      value={port.defaultValue || ''}
                      onChange={(e) => handleUpdateOutput(index, { defaultValue: e.target.value })}
                      placeholder="默认值"
                      disabled={disabled}
                    />
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs">黑板绑定</Label>
                    <Select
                      value={port.blackboardKey || ''}
                      onValueChange={(value: string) => 
                        handleUpdateOutput(index, { blackboardKey: value || undefined })
                      }
                      disabled={disabled}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="选择黑板键" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">无绑定</SelectItem>
                        {blackboardKeys.map((key) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center">
                              <Link className="h-3 w-3 mr-1" />
                              {key}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex flex-col gap-1 justify-end">
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleMoveOutput(index, 'up')}
                        disabled={index === 0 || disabled}
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleMoveOutput(index, 'down')}
                        disabled={index === outputs.length - 1 || disabled}
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleRemoveOutput(index)}
                        disabled={disabled}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddOutput}
                disabled={disabled}
                className="w-full"
              >
                <Plus className="h-3 w-3 mr-1" /> 添加输出端口
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default PortsConfigPanel;