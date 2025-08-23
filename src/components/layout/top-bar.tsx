import React from "react"
import { Separator } from "@/components/ui/separator"
import { Brain } from "lucide-react"
import { useI18n } from "@/hooks/use-i18n"
import { LanguageSwitcher } from "@/components/language-switcher"
import { TabModeSelector } from "@/components/mode-selector"
import { FunctionTabs } from "@/components/layout/function-tabs"

interface TopBarProps {
  onImportClick: () => void;
  onExportClick: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
}

export function TopBar({ 
  onImportClick, 
  onExportClick, 
  onUndo,
  onRedo 
}: TopBarProps) {
  const { t } = useI18n()
  
  return (
    <header className="w-full border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-3 px-3 py-2">
        {/* 应用标识 */}
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" aria-hidden />
          <div className="font-semibold tracking-tight">BT Web Studio</div>
        </div>
        
        <Separator orientation="vertical" className="h-5" />
        
        {/* 左侧：模式切换区域（保持不变） */}
        <div className="flex items-center">
          <TabModeSelector />
        </div>
        
        {/* 右侧：功能特化区域（File / Connection / Load / Help） */}
        <div className="ml-auto flex items-center gap-2">
          <FunctionTabs
            onImportClick={onImportClick}
            onExportClick={onExportClick}
          />
          <Separator orientation="vertical" className="h-5" />
          <LanguageSwitcher position="settings" variant="toggle" />
        </div>
      </div>
    </header>
  )
}
