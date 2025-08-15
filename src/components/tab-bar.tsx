import React from 'react'
import { X, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  ContextMenu, 
  ContextMenuContent, 
  ContextMenuItem, 
  ContextMenuTrigger 
} from '@/components/ui/context-menu'
import { useBehaviorTreeStore, useActions, useCurrentSession } from '@/store/behavior-tree-store'

export const TabBar: React.FC = () => {
  const sessions = useBehaviorTreeStore(state => state.sessions)
  const activeSessionId = useBehaviorTreeStore(state => state.activeSessionId)
  const currentSession = useCurrentSession()
  const actions = useActions()
  
  const [editingSessionId, setEditingSessionId] = React.useState<string | null>(null)
  const [editingName, setEditingName] = React.useState('')

  // 重命名会话
  const handleRenameSession = (sessionId: string) => {
    const newName = editingName.trim()
    if (newName) {
      actions.updateSession(sessionId, { name: newName })
    }
    // 无论成功与否，都退出编辑模式
    setEditingSessionId(null)
    setEditingName('')
  }

  // 开始重命名
  const startRename = (sessionId: string, currentName: string) => {
    setEditingSessionId(sessionId)
    setEditingName(currentName)
  }

  // 取消重命名
  const cancelRename = () => {
    setEditingSessionId(null)
    setEditingName('')
  }

  // 删除会话
  const handleDeleteSession = (sessionId: string) => {
    if (sessions.length > 1) {
      actions.deleteSession(sessionId)
    }
  }

  // 切换会话
  const handleSwitchSession = (sessionId: string) => {
    if (sessionId !== activeSessionId) {
      actions.switchSession(sessionId)
    }
  }

  return (
    <div className="flex items-center gap-1 px-2 py-1 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      {/* 标签列表 */}
      <div className="flex items-center gap-1 flex-1 overflow-x-auto">
        {sessions.map((session) => (
          <ContextMenu key={session.id}>
            <ContextMenuTrigger asChild>
              <div
                className={`
                  group relative flex items-center gap-2 px-3 py-1.5 rounded-md text-sm cursor-pointer
                  transition-colors duration-200 min-w-0 max-w-48
                  ${session.id === activeSessionId 
                    ? 'bg-primary/10 text-primary border border-primary/20' 
                    : 'hover:bg-muted/60 text-muted-foreground hover:text-foreground'
                  }
                `}
                onClick={() => handleSwitchSession(session.id)}
              >
                <FileText className="h-3 w-3 flex-shrink-0" />
                
                {editingSessionId === session.id ? (
                  <Input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => {
                      e.stopPropagation()
                      if (e.key === 'Enter') {
                        handleRenameSession(session.id)
                      } else if (e.key === 'Escape') {
                        cancelRename()
                      }
                    }}
                    onBlur={() => handleRenameSession(session.id)}
                    className="h-5 px-1 py-0 text-xs bg-transparent border-none focus:ring-1 focus:ring-primary"
                    autoFocus
                  />
                ) : (
                  <span className="truncate flex-1 min-w-0">
                    {session.name}
                  </span>
                )}

                {/* 修改状态指示器 */}
                {session.modifiedAt > session.createdAt && (
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-500 flex-shrink-0" />
                )}

                {/* 关闭按钮 */}
                {sessions.length > 1 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteSession(session.id)
                    }}
                    className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/20 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </ContextMenuTrigger>
            
            <ContextMenuContent>
              <ContextMenuItem onClick={() => startRename(session.id, session.name)}>
                重命名
              </ContextMenuItem>
              <ContextMenuItem onClick={() => actions.createSession(`${session.name} 副本`)}>
                复制
              </ContextMenuItem>
              {sessions.length > 1 && (
                <ContextMenuItem 
                  onClick={() => handleDeleteSession(session.id)}
                  className="text-destructive focus:text-destructive"
                >
                  关闭
                </ContextMenuItem>
              )}
            </ContextMenuContent>
          </ContextMenu>
        ))}
      </div>


      {/* 会话信息 */}
      {currentSession && (
        <div className="text-xs text-muted-foreground px-2 border-l">
          节点: {currentSession.nodes.length} | 
          连线: {currentSession.edges.length}
        </div>
      )}
    </div>
  )
}