import React, { useState, useCallback } from 'react';
import { cn } from '@/core/utils/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  useWatchVariables,
  useDebugActions
} from '@/core/store/behavior-tree-store';
import { useI18n } from '@/hooks/use-i18n';
import { 
  Eye,
  Plus,
  X,
  Search,
  AlertTriangle,
  CheckCircle,
  RotateCcw,
  Edit,
  Variable
} from 'lucide-react';

interface WatchVariablesPanelProps {
  className?: string;
}

export default function WatchVariablesPanel({ className }: WatchVariablesPanelProps) {
  const { t } = useI18n();
  const watchVariables = useWatchVariables();
  const debugActions = useDebugActions();
  
  const [newExpression, setNewExpression] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const filteredVariables = watchVariables.filter(variable =>
    variable.expression.toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(variable.value).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddVariable = useCallback(() => {
    if (newExpression.trim()) {
      debugActions.addWatchVariable(newExpression.trim());
      setNewExpression('');
    }
  }, [newExpression, debugActions]);

  const handleRemoveVariable = useCallback((watchId: string) => {
    debugActions.removeWatchVariable(watchId);
  }, [debugActions]);

  const handleEvaluateExpression = useCallback(async (expression: string) => {
    return await debugActions.evaluateExpression(expression);
  }, [debugActions]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddVariable();
    }
  };

  const startEditing = (variable: any) => {
    setEditingId(variable.id);
    setEditValue(String(variable.value));
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditValue('');
  };

  const saveEdit = async (variableId: string) => {
    // 这里可以实现变量值的修改
    console.log('Save edit for variable:', variableId, editValue);
    setEditingId(null);
    setEditValue('');
  };

  const getValueColor = (type: string, isValid: boolean) => {
    if (!isValid) return 'text-red-600';
    
    switch (type) {
      case 'string': return 'text-green-600';
      case 'number': return 'text-blue-600';
      case 'boolean': return 'text-purple-600';
      case 'object': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  const formatValue = (value: any, type: string): string => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    
    switch (type) {
      case 'string':
        return `"${value}"`;
      case 'object':
        return JSON.stringify(value, null, 0);
      case 'boolean':
        return value ? 'true' : 'false';
      default:
        return String(value);
    }
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* 搜索和添加变量 */}
      <div className="p-3 border-b space-y-2">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('debug:watchVariables.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
        
        <div className="flex gap-1">
          <Input
            placeholder={t('debug:watchVariables.addPlaceholder')}
            value={newExpression}
            onChange={(e) => setNewExpression(e.target.value)}
            onKeyPress={handleKeyPress}
            className="h-8"
          />
          <Button
            size="sm"
            onClick={handleAddVariable}
            disabled={!newExpression.trim()}
            className="h-8 px-3"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-xs">
            {filteredVariables.length} / {watchVariables.length} {t('debug:watchVariables.items')}
          </Badge>
        </div>
      </div>

      {/* 变量列表 */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filteredVariables.length === 0 ? (
            <div className="text-center py-8">
              <Variable className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <div className="text-sm font-medium">
                {watchVariables.length === 0 
                  ? t('debug:watchVariables.noVariables')
                  : t('debug:watchVariables.noMatches')
                }
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {t('debug:watchVariables.noVariablesDesc')}
              </div>
            </div>
          ) : (
            filteredVariables.map((variable) => (
              <div
                key={variable.id}
                className={cn(
                  'rounded-md border p-2 transition-colors',
                  variable.isValid 
                    ? 'bg-card border-border hover:bg-muted/50' 
                    : 'bg-red-50 border-red-200'
                )}
              >
                {/* 变量表达式 */}
                <div className="flex items-center gap-2 mb-1">
                  <Eye className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="font-medium text-sm font-mono truncate flex-1">
                    {variable.expression}
                  </span>
                  
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Badge variant="outline" className="text-xs">
                      {variable.type}
                    </Badge>
                    
                    {variable.isValid ? (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-3 w-3 text-red-500" />
                    )}
                  </div>
                </div>

                {/* 变量值 */}
                <div className="ml-6 mb-2">
                  {editingId === variable.id ? (
                    <div className="flex gap-1">
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="h-7 text-xs font-mono"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            saveEdit(variable.id);
                          } else if (e.key === 'Escape') {
                            cancelEditing();
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        onClick={() => saveEdit(variable.id)}
                        className="h-7 px-2"
                      >
                        <CheckCircle className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={cancelEditing}
                        className="h-7 px-2"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div 
                      className={cn(
                        'text-sm font-mono cursor-pointer p-1 rounded',
                        getValueColor(variable.type, variable.isValid),
                        'hover:bg-muted/50'
                      )}
                      onClick={() => startEditing(variable)}
                      title={t('debug:watchVariables.clickToEdit')}
                    >
                      {variable.isValid 
                        ? formatValue(variable.value, variable.type)
                        : t('debug:watchVariables.evaluationError')
                      }
                    </div>
                  )}
                </div>

                {/* 操作和时间戳 */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {t('debug:watchVariables.lastUpdated')}: {new Date(variable.lastUpdated).toLocaleTimeString()}
                  </span>
                  
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEvaluateExpression(variable.expression)}
                      className="h-6 w-6 p-0"
                      title={t('debug:watchVariables.refresh')}
                    >
                      <RotateCcw className="h-3 w-3" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEditing(variable)}
                      className="h-6 w-6 p-0"
                      title={t('debug:watchVariables.edit')}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveVariable(variable.id)}
                      className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                      title={t('common:remove')}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* 底部统计 */}
      {watchVariables.length > 0 && (
        <div className="p-2 border-t bg-muted/30">
          <div className="text-xs text-muted-foreground text-center">
            {t('debug:watchVariables.stats', { 
              valid: watchVariables.filter(v => v.isValid).length,
              total: watchVariables.length
            })}
          </div>
        </div>
      )}
    </div>
  );
}