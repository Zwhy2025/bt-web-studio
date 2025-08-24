import React from "react"
import { Separator } from "@/components/ui/separator"
import { Brain, Eye, ArrowDown, ArrowRight, Minimize2, Maximize2, Settings, HelpCircle, FileText, Link, Upload } from "lucide-react"
import { useI18n } from "@/hooks/use-i18n"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/core/utils/utils"
import { TabModeSelector } from "@/components/mode-selector"
import { useCurrentMode } from "@/core/store/behavior-tree-store"

interface TopBarProps {
  onUndo?: () => void;
  onRedo?: () => void;
  onToggleTreeDirection?: () => void;
  onToggleCompactMode?: () => void;
  treeDirection?: 'vertical' | 'horizontal';
  isCompactMode?: boolean;
}

export function TopBar({
  onUndo,
  onRedo,
  onToggleTreeDirection,
  onToggleCompactMode,
  treeDirection = 'vertical',
  isCompactMode = false
}: TopBarProps) {
  const { t } = useI18n()
  const currentMode = useCurrentMode()

  // 根据模式决定显示哪些功能按钮
  const shouldShowFile = currentMode === 'composer'
  const shouldShowConnection = currentMode === 'debug'
  const shouldShowLoad = currentMode === 'replay'

  return (
    <header className="w-full border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-3 px-3 py-2">
        {/* 左侧：Logo + 三模式切换区域 */}
        <div className="flex items-center gap-3">
          {/* 应用标识 */}
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" aria-hidden />
            <div className="font-semibold tracking-tight">BT Web Studio</div>
          </div>

          <Separator orientation="vertical" className="h-5" />

          {/* 三模式切换 */}
          <TabModeSelector />
        </div>

        {/* 右侧：功能特化区域 */}
        <div className="ml-auto flex items-center gap-2">
          {/* 文件功能 - 仅编辑模式显示 */}
          {shouldShowFile && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1">
                  <FileText className="h-4 w-4" />
                  文件
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[160px]">
                <DropdownMenuItem className="gap-2 cursor-pointer">
                  导入 XML
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 cursor-pointer">
                  导出 XML
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2 cursor-pointer">
                  新建项目
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 cursor-pointer">
                  最近文件
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* 连接功能 - 仅调试模式显示 */}
          {shouldShowConnection && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1">
                  <Link className="h-4 w-4" />
                  连接
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[160px]">
                <DropdownMenuItem className="gap-2 cursor-pointer">
                  连接调试器
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 cursor-pointer">
                  断开连接
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2 cursor-pointer">
                  连接配置
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* 加载功能 - 仅回放模式显示 */}
          {shouldShowLoad && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1">
                  <Upload className="h-4 w-4" />
                  加载
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[160px]">
                <DropdownMenuItem className="gap-2 cursor-pointer">
                  加载日志文件
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 cursor-pointer">
                  导入 Groot 数据
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* 预览功能 - 所有模式显示 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1">
                <Eye className="h-4 w-4" />
                预览
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[160px]">
              <DropdownMenuItem
                onClick={onToggleTreeDirection}
                className="gap-2 cursor-pointer"
              >
                {treeDirection === 'vertical' ? (
                  <ArrowRight className="w-4 h-4" />
                ) : (
                  <ArrowDown className="w-4 h-4" />
                )}
                <span>
                  {treeDirection === 'vertical' ? '水平布局' : '垂直布局'}
                </span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onToggleCompactMode}
                className="gap-2 cursor-pointer"
              >
                {isCompactMode ? (
                  <Maximize2 className="w-4 h-4" />
                ) : (
                  <Minimize2 className="w-4 h-4" />
                )}
                <span>
                  {isCompactMode ? '宽松模式' : '紧凑模式'}
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 设置功能 - 所有模式显示 */}
          <Button variant="ghost" size="sm" className="gap-1">
            <Settings className="h-4 w-4" />
            设置
          </Button>

          {/* 帮助功能 - 所有模式显示 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1">
                <HelpCircle className="h-4 w-4" />
                帮助
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[160px]">
              <DropdownMenuItem 
                onSelect={() => window.open('/docs/user-guide.md', '_blank')}
                className="gap-2 cursor-pointer"
              >
                用户手册
              </DropdownMenuItem>
              <DropdownMenuItem 
                onSelect={() => window.open('/AGENTS.md', '_blank')}
                className="gap-2 cursor-pointer"
              >
                开发指南
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2 cursor-pointer">
                快捷键说明
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 cursor-pointer">
                关于
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}