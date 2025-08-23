import React from "react"
import { Menubar, MenubarMenu, MenubarTrigger, MenubarContent, MenubarItem, MenubarSeparator } from "@/components/ui/menubar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Search, Brain, Plus, Import, Download, Save, Bug, Languages, Keyboard, Info } from "lucide-react"
import { useI18n } from "@/hooks/use-i18n"
import { LanguageSwitcher } from "@/components/language-switcher"
import { TabModeSelector } from "@/components/mode-selector"
import { useCurrentMode } from "@/core/store/behavior-tree-store"
import { WorkflowMode } from "@/core/store/workflowModeState"

interface TopBarProps {
  onImportClick: () => void;
  onExportClick: () => void;
  onNewProject: () => void;
  onSave?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
}

export function TopBar({ 
  onImportClick, 
  onExportClick, 
  onNewProject,
  onSave,
  onUndo,
  onRedo 
}: TopBarProps) {
  const { t } = useI18n()
  const currentMode = useCurrentMode()
  
  // 根据当前模式调整菜单可见性
  const isComposerMode = currentMode === WorkflowMode.COMPOSER
  const isDebugMode = currentMode === WorkflowMode.DEBUG
  const isReplayMode = currentMode === WorkflowMode.REPLAY
  
  return (
    <header className="w-full border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-3 px-3 py-2">
        {/* 应用标识 */}
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" aria-hidden />
          <div className="font-semibold tracking-tight">BT Web Studio</div>
        </div>
        
        <Separator orientation="vertical" className="h-5" />
        
        {/* 模式选择器 */}
        <div className="flex items-center">
          <TabModeSelector />
        </div>
        
        <Separator orientation="vertical" className="h-5" />
        
        {/* 主菜单栏 */}
        <Menubar className="border-none shadow-none">
          <MenubarMenu>
            <MenubarTrigger className="h-8">{t('menu:file')}</MenubarTrigger>
            <MenubarContent>
              {isComposerMode && (
                <>
                  <MenubarItem onSelect={onNewProject}>
                    <Plus className="mr-2 h-4 w-4" /> {t('menu:newProject')}
                  </MenubarItem>
                  <MenubarSeparator />
                </>
              )}
              <MenubarItem onSelect={onImportClick}>
                <Import className="mr-2 h-4 w-4" /> {t('menu:importXML')}
              </MenubarItem>
              <MenubarItem onSelect={onExportClick}>
                <Download className="mr-2 h-4 w-4" /> {t('menu:exportXML')}
              </MenubarItem>
              {isComposerMode && (
                <>
                  <MenubarSeparator />
                  <MenubarItem onSelect={onSave}>
                    <Save className="mr-2 h-4 w-4" /> {t('menu:save')}
                  </MenubarItem>
                </>
              )}
            </MenubarContent>
          </MenubarMenu>
          
          {isComposerMode && (
            <MenubarMenu>
              <MenubarTrigger className="h-8">{t('menu:edit')}</MenubarTrigger>
              <MenubarContent>
                <MenubarItem onSelect={onUndo}>{t('menu:undo')}</MenubarItem>
                <MenubarItem onSelect={onRedo}>{t('menu:redo')}</MenubarItem>
                <MenubarSeparator />
                <MenubarItem>{t('menu:cut')}</MenubarItem>
                <MenubarItem>{t('menu:copy')}</MenubarItem>
                <MenubarItem>{t('menu:paste')}</MenubarItem>
                <MenubarSeparator />
                <MenubarItem>{t('menu:selectAll')}</MenubarItem>
              </MenubarContent>
            </MenubarMenu>
          )}
          
          <MenubarMenu>
            <MenubarTrigger className="h-8">{t('menu:view')}</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>{t('menu:zoomToFit')}</MenubarItem>
              <MenubarItem>{t('menu:showMinimap')}</MenubarItem>
              {isComposerMode && (
                <>
                  <MenubarSeparator />
                  <MenubarItem>{t('menu:showGrid')}</MenubarItem>
                  <MenubarItem>{t('menu:snapToGrid')}</MenubarItem>
                </>
              )}
              {isDebugMode && (
                <>
                  <MenubarSeparator />
                  <MenubarItem>{t('menu:showExecutionPath')}</MenubarItem>
                  <MenubarItem>{t('menu:showNodeStatus')}</MenubarItem>
                </>
              )}
              {isReplayMode && (
                <>
                  <MenubarSeparator />
                  <MenubarItem>{t('menu:showEventFlow')}</MenubarItem>
                  <MenubarItem>{t('menu:showHeatmap')}</MenubarItem>
                </>
              )}
            </MenubarContent>
          </MenubarMenu>
          
          {(isDebugMode || isReplayMode) && (
            <MenubarMenu>
              <MenubarTrigger className="h-8">
                {isDebugMode ? t('menu:debug') : t('menu:replay')}
              </MenubarTrigger>
              <MenubarContent>
                {isDebugMode && (
                  <>
                    <MenubarItem>
                      <Bug className="mr-2 h-4 w-4" /> {t('menu:openBreakpointPanel')}
                    </MenubarItem>
                    <MenubarItem>{t('menu:clearBreakpoints')}</MenubarItem>
                    <MenubarSeparator />
                    <MenubarItem>{t('menu:startDebugging')}</MenubarItem>
                    <MenubarItem>{t('menu:stopDebugging')}</MenubarItem>
                  </>
                )}
                {isReplayMode && (
                  <>
                    <MenubarItem>{t('menu:loadReplaySession')}</MenubarItem>
                    <MenubarItem>{t('menu:exportReplayData')}</MenubarItem>
                    <MenubarSeparator />
                    <MenubarItem>{t('menu:analyzeSession')}</MenubarItem>
                  </>
                )}
              </MenubarContent>
            </MenubarMenu>
          )}
          
          <MenubarMenu>
            <MenubarTrigger className="h-8">{t('menu:help')}</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>
                <Keyboard className="mr-2 h-4 w-4" /> {t('menu:shortcuts')}
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem>
                <Languages className="mr-2 h-4 w-4" /> {t('toolbar:language')}
                <div className="ml-auto">
                  <LanguageSwitcher position="settings" variant="toggle" />
                </div>
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem>
                <Info className="mr-2 h-4 w-4" /> {t('menu:about')}
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
        
        {/* 右侧操作区 */}
        <div className="ml-auto flex items-center gap-2">
          {/* 全局搜索 */}
          <div className="relative w-64 max-w-[40vw]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              className="pl-8 h-8" 
              placeholder={t('toolbar:searchPlaceholder')} 
              aria-label={t('toolbar:globalSearch')} 
            />
          </div>
          
          {/* 快速操作按钮 */}
          {isComposerMode && (
            <>
              <Button variant="outline" size="sm" onClick={onImportClick}>
                <Import className="mr-2 h-4 w-4" />
                {t('menu:import')}
              </Button>
              <Button size="sm" onClick={onExportClick}>
                <Download className="mr-2 h-4 w-4" />
                {t('menu:export')}
              </Button>
            </>
          )}
          
          {isDebugMode && (
            <Button size="sm" variant="outline">
              <Bug className="mr-2 h-4 w-4" />
              {t('debug:connect')}
            </Button>
          )}
          
          {isReplayMode && (
            <Button size="sm" variant="outline">
              <Import className="mr-2 h-4 w-4" />
              {t('replay:loadSession')}
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}