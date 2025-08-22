import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Trash2, Database, Plus, Edit2, Check, X } from 'lucide-react'
import { useBlackboard, useActions, BlackboardEntry } from '@/core/store/behavior-tree-store'
import { useToast } from '@/hooks/use-toast'
import { useI18n } from "@/hooks/use-i18n"

// 辅助函数：解析和验证输入值
function parseAndValidateValue(value: string, type: BlackboardEntry['type'], toast: any): { success: boolean; parsedValue?: any } {
  let parsedValue: any = value
  
  try {
    switch (type) {
      case 'number':
        if (value.trim() === '') {
          toast({ title: t('messages:enterNumericValue'), variant: 'destructive' })
          return { success: false }
        }
        parsedValue = parseFloat(value)
        if (isNaN(parsedValue)) {
          toast({ title: t('messages:enterValidNumber'), variant: 'destructive' })
          return { success: false }
        }
        break
      case 'boolean':
        const lowerValue = value.toLowerCase().trim()
        if (lowerValue !== 'true' && lowerValue !== 'false') {
          toast({ title: t('messages:enterBooleanValue'), variant: 'destructive' })
          return { success: false }
        }
        parsedValue = lowerValue === 'true'
        break
      case 'object':
        if (value.trim() === '') {
          parsedValue = {}
        } else {
          parsedValue = JSON.parse(value)
        }
        break
      default:
        parsedValue = value
    }
  } catch (error) {
    toast({ title: t('messages:invalidJsonFormat'), variant: 'destructive' })
    return { success: false }
  }
  
  return { success: true, parsedValue }
}

export function BlackboardPanel() {
    const { t } = useI18n()
  const blackboard = useBlackboard()
  const { setBlackboardValue, deleteBlackboardKey, clearBlackboard } = useActions()
  const { toast } = useToast()
  
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')
  const [newType, setNewType] = useState<BlackboardEntry['type']>('string')
  
  // 编辑状态
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [editType, setEditType] = useState<BlackboardEntry['type']>('string')

  const handleAddEntry = () => {
    if (!newKey.trim()) {
      toast({ title: t('messages:enterKeyName'), variant: 'destructive' })
      return
    }
    
    const result = parseAndValidateValue(newValue, newType, toast)
    if (!result.success) {
      return
    }
    
    setBlackboardValue(newKey.trim(), result.parsedValue, newType, 'user')
    setNewKey('')
    setNewValue('')
    setNewType('string')
  }

  const handleStartEdit = (entry: BlackboardEntry) => {
    setEditingKey(entry.key)
    setEditType(entry.type)
    setEditValue(entry.type === 'object' ? JSON.stringify(entry.value, null, 2) : String(entry.value))
  }

  const handleSaveEdit = (key: string) => {
    const result = parseAndValidateValue(editValue, editType, toast)
    if (!result.success) {
      return
    }
    
    setBlackboardValue(key, result.parsedValue, editType, 'user')
    setEditingKey(null)
    setEditValue('')
    setEditType('string')
  }

  const handleCancelEdit = () => {
    setEditingKey(null)
    setEditValue('')
    setEditType('string')
  }

  const formatValue = (entry: BlackboardEntry) => {
    if (entry.type === 'object') {
      return JSON.stringify(entry.value, null, 2)
    }
    return String(entry.value)
  }

  const getTypeColor = (type: BlackboardEntry['type']) => {
    switch (type) {
      case 'string': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'number': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'boolean': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case 'object': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getPlaceholder = (type: BlackboardEntry['type']) => {
    switch (type) {
      case 'number': return t('panels:numberExample')
      case 'boolean': return t('panels:booleanExample')
      case 'object': return '{"key": "value"}'
      default: return t('panels:enterValue')
    }
  }

  const entries = Object.values(blackboard)

  return (
    <Card className="h-full flex flex-col min-h-0">
      <CardHeader className="pb-3 flex-shrink-0">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Database className="h-4 w-4" />
          {t('panels:blackboard')} ({entries.length})
          {entries.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={clearBlackboard}
              className="ml-auto h-6 px-2"
            >
              {t("common:clear")}
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col gap-3 p-3 min-h-0">
        {/* 添加新条目 */}
        <div className="space-y-2 flex-shrink-0">
          <div className="flex gap-2">
            <Input
              placeholder={t('panels:keyName')}
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              className="text-xs"
            />
            <Select value={newType} onValueChange={(value: BlackboardEntry['type']) => setNewType(value)}>
              <SelectTrigger className="w-20 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="string">{t('common:string')}</SelectItem>
                <SelectItem value="number">{t('common:number')}</SelectItem>
                <SelectItem value="boolean">{t('common:boolean')}</SelectItem>
                <SelectItem value="object">{t('common:object')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder={getPlaceholder(newType)}
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              className="text-xs"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddEntry()
                }
                // 只阻止特定按键的冒泡，允许正常编辑
                if (e.key === 'Enter' || e.key === 'Escape') {
                  e.stopPropagation()
                }
              }}
            />
            <Button size="sm" onClick={handleAddEntry} className="px-3">
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* 数据列表 */}
        <ScrollArea className="flex-1">
          <div className="space-y-2">
            {entries.length === 0 ? (
              <div className="text-center text-muted-foreground text-xs py-4">
                {t('panels:noData')}
              </div>
            ) : (
              entries.map((entry) => (
                <div key={entry.key} className="rounded-md border p-2 bg-card/60">
                  {editingKey === entry.key ? (
                    // 编辑模式
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-xs">{entry.key}</span>
                        <Select value={editType} onValueChange={(value: BlackboardEntry['type']) => setEditType(value)}>
                          <SelectTrigger className="h-6 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="string">{t('common:string')}</SelectItem>
                            <SelectItem value="number">{t('common:number')}</SelectItem>
                            <SelectItem value="boolean">{t('common:boolean')}</SelectItem>
                            <SelectItem value="object">{t('common:object')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        placeholder={getPlaceholder(editType)}
                        className="text-xs"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleSaveEdit(entry.key)
                          } else if (e.key === 'Escape') {
                            e.preventDefault()
                            handleCancelEdit()
                          }
                          // 只阻止特定按键的冒泡，允许正常编辑
                          if (e.key === 'Enter' || e.key === 'Escape') {
                            e.stopPropagation()
                          }
                        }}
                      />
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          onClick={() => handleSaveEdit(entry.key)}
                          className="h-6 px-2 text-xs"
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleCancelEdit}
                          className="h-6 px-2 text-xs"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // 显示模式
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-xs truncate">{entry.key}</span>
                          <Badge variant="secondary" className={`text-xs px-1 py-0 ${getTypeColor(entry.type)}`}>
                            {entry.type}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground break-all">
                          {formatValue(entry)}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(entry.timestamp).toLocaleTimeString()}
                          {entry.source && ` • ${entry.source}`}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleStartEdit(entry)}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-primary"
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteBlackboardKey(entry.key)}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}