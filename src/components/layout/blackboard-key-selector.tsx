import React, { useMemo, useState } from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { 
  Command, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem 
} from '@/components/ui/command';
import { 
  Button 
} from '@/components/ui/button';
import { 
  Input 
} from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Plus, 
  Search, 
  Link,
  Hash,
  Type
} from 'lucide-react';
import { useBlackboard, useBehaviorTreeStore } from '@/core/store/behavior-tree-store';

interface BlackboardKeySelectorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const BlackboardKeySelector: React.FC<BlackboardKeySelectorProps> = ({
  value,
  onChange,
  placeholder = "选择黑板键",
  disabled = false
}) => {
  const blackboard = useBlackboard();
  const actions = useBehaviorTreeStore((state) => state.actions);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newKeyType, setNewKeyType] = useState<'string' | 'number' | 'boolean' | 'object'>('string');

  const blackboardEntries = useMemo(() => {
    if (!blackboard) return [];
    return Object.entries(blackboard).map(([key, entry]) => ({
      key,
      type: entry.type,
      value: entry.value
    }));
  }, [blackboard]);

  const filteredEntries = useMemo(() => {
    if (!search) return blackboardEntries;
    return blackboardEntries.filter(entry => 
      entry.key.toLowerCase().includes(search.toLowerCase())
    );
  }, [blackboardEntries, search]);

  const handleCreateKey = () => {
    if (!newKey.trim()) return;
    
    // 创建新的黑板键
    actions.setBlackboardValue(newKey, {
      key: newKey,
      value: newKeyType === 'string' ? '' : 
             newKeyType === 'number' ? 0 : 
             newKeyType === 'boolean' ? false : {},
      type: newKeyType,
      timestamp: Date.now()
    });
    
    // 选择新创建的键
    if (onChange) {
      onChange(newKey);
    }
    
    // 重置状态
    setNewKey('');
    setNewKeyType('string');
    setShowCreateDialog(false);
  };

  return (
    <div className="flex gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
          >
            {value ? (
              <div className="flex items-center">
                <Link className="h-3 w-3 mr-2" />
                {value}
              </div>
            ) : (
              placeholder
            )}
            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command>
            <CommandInput 
              placeholder="搜索黑板键..." 
              value={search}
              onValueChange={setSearch}
            />
            <CommandEmpty>
              <div className="p-2 text-center text-sm">
                未找到匹配的黑板键
              </div>
            </CommandEmpty>
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  if (onChange) onChange('');
                  setOpen(false);
                }}
              >
                <div className="flex items-center">
                  <span className="mr-2 text-muted-foreground">无绑定</span>
                </div>
              </CommandItem>
              {filteredEntries.map((entry) => (
                <CommandItem
                  key={entry.key}
                  onSelect={() => {
                    if (onChange) onChange(entry.key);
                    setOpen(false);
                  }}
                >
                  <div className="flex items-center">
                    <Link className="h-3 w-3 mr-2" />
                    <span className="font-medium">{entry.key}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {entry.type}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
      
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            disabled={disabled}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>创建新的黑板键</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">键名</label>
              <Input
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="输入键名"
              />
            </div>
            <div>
              <label className="text-sm font-medium">数据类型</label>
              <Select
                value={newKeyType}
                onValueChange={(value: any) => setNewKeyType(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="string">
                    <div className="flex items-center">
                      <Type className="h-3 w-3 mr-2" />
                      字符串 (string)
                    </div>
                  </SelectItem>
                  <SelectItem value="number">
                    <div className="flex items-center">
                      <Hash className="h-3 w-3 mr-2" />
                      数字 (number)
                    </div>
                  </SelectItem>
                  <SelectItem value="boolean">布尔值 (boolean)</SelectItem>
                  <SelectItem value="object">对象 (object)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
              >
                取消
              </Button>
              <Button
                onClick={handleCreateKey}
                disabled={!newKey.trim()}
              >
                创建
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BlackboardKeySelector;