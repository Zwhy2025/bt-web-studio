import React from "react"
import { Menubar, MenubarMenu, MenubarTrigger, MenubarContent, MenubarItem, MenubarSeparator } from "@/components/ui/menubar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Brain, Plus, Import, Download, Save, Bug, Languages, Keyboard, Info } from "lucide-react"
import { useI18n } from "@/hooks/use-i18n"
import { LanguageSwitcher } from "@/components/language-switcher"

interface TopBarProps {
  onImportClick: () => void;
  onExportClick: () => void;
  onNewProject: () => void;
}

export function TopBar({ onImportClick, onExportClick, onNewProject }: TopBarProps) {
  const { t } = useI18n()
  return (
    <header className="w-full border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-3 px-3 py-2">
        <Brain className="h-5 w-5 text-primary" aria-hidden />
        <div className="font-semibold tracking-tight">BT Web Studio</div>
        <Menubar className="ml-2">
          <MenubarMenu>
            <MenubarTrigger>{t('menu:file')}</MenubarTrigger>
            <MenubarContent>
              <MenubarItem onSelect={onNewProject}>
                <Plus className="mr-2 h-4 w-4" /> {t('menu:newProject')}
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem onSelect={onImportClick}>
                <Import className="mr-2 h-4 w-4" /> {t('menu:importXML')}
              </MenubarItem>
              <MenubarItem onSelect={onExportClick}>
                <Download className="mr-2 h-4 w-4" /> {t('menu:exportXML')}
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem>
                <Save className="mr-2 h-4 w-4" /> {t('menu:save')}
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger>{t('menu:edit')}</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>{t('menu:undo')}</MenubarItem>
              <MenubarItem>{t('menu:redo')}</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger>{t('menu:view')}</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>{t('menu:zoomToFit')}</MenubarItem>
              <MenubarItem>{t('menu:showMinimap')}</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger>{t('menu:debug')}</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>
                <Bug className="mr-2 h-4 w-4" /> {t('menu:openBreakpointPanel')}
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger>{t('menu:help')}</MenubarTrigger>
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
        {/* 调试工具栏已移至 DebugPanel
        <DebugToolbar />
        */}
        <div className="ml-auto flex items-center gap-2">
          <div className="relative w-64 max-w-[40vw]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-8" placeholder={t('toolbar:searchPlaceholder')} aria-label={t('toolbar:globalSearch')} />
          </div>
          <Button variant="outline" size="sm" onClick={onImportClick}>
            <Import className="mr-2 h-4 w-4" />
            {t('menu:import')}
          </Button>
          <Button size="sm" onClick={onExportClick}>
            <Download className="mr-2 h-4 w-4" />
            {t('menu:export')}
          </Button>
        </div>
      </div>
    </header>
  )
}