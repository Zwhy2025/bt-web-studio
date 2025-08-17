import React from "react"
import { Menubar, MenubarMenu, MenubarTrigger, MenubarContent, MenubarItem, MenubarSeparator } from "@/components/ui/menubar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Brain, Plus, Import, Download, Save, Bug } from "lucide-react"

interface TopBarProps {
  onImportClick: () => void;
  onExportClick: () => void;
  onNewProject: () => void;
}

export function TopBar({ onImportClick, onExportClick, onNewProject }: TopBarProps) {
  return (
    <header className="w-full border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-3 px-3 py-2">
        <Brain className="h-5 w-5 text-primary" aria-hidden />
        <div className="font-semibold tracking-tight">BT Web Studio</div>
        <Menubar className="ml-2">
          <MenubarMenu>
            <MenubarTrigger>文件</MenubarTrigger>
            <MenubarContent>
              <MenubarItem onSelect={onNewProject}>
                <Plus className="mr-2 h-4 w-4" /> 新建项目
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem onSelect={onImportClick}>
                <Import className="mr-2 h-4 w-4" /> 导入 XML
              </MenubarItem>
              <MenubarItem onSelect={onExportClick}>
                <Download className="mr-2 h-4 w-4" /> 导出 XML
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem>
                <Save className="mr-2 h-4 w-4" /> 保存
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger>编辑</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>撤销</MenubarItem>
              <MenubarItem>重做</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger>视图</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>缩放至适配</MenubarItem>
              <MenubarItem>显示最小地图</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger>调试</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>
                <Bug className="mr-2 h-4 w-4" /> 打开断点面板
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger>帮助</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>快捷键</MenubarItem>
              <MenubarItem>关于</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
        {/* 调试工具栏已移至 DebugPanel
        <DebugToolbar />
        */}
        <div className="ml-auto flex items-center gap-2">
          <div className="relative w-64 max-w-[40vw]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-8" placeholder="搜索节点、模板或命令..." aria-label="全局搜索" />
          </div>
          <Button variant="outline" size="sm" onClick={onImportClick}>
            <Import className="mr-2 h-4 w-4" />
            导入
          </Button>
          <Button size="sm" onClick={onExportClick}>
            <Download className="mr-2 h-4 w-4" />
            导出
          </Button>
        </div>
      </div>
    </header>
  )
}