import React from 'react'
import { useI18n } from '@/hooks/use-i18n'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Languages, Globe } from 'lucide-react'
import { cn } from '@/core/utils/utils'

interface LanguageSwitcherProps {
  position?: 'topBar' | 'settings' | 'standalone'
  variant?: 'dropdown' | 'toggle'
  showLabel?: boolean
  className?: string
}

export function LanguageSwitcher({
  position = 'topBar',
  variant = 'dropdown',
  showLabel = false,
  className
}: LanguageSwitcherProps) {
  const { t, changeLanguage, getCurrentLanguage, getLanguageConfig, getAvailableLanguages } = useI18n()
  
  const currentLanguage = getCurrentLanguage()
  const currentConfig = getLanguageConfig()
  const availableLanguages = getAvailableLanguages()
  
  const handleLanguageChange = async (languageCode: string) => {
    if (languageCode !== currentLanguage) {
      await changeLanguage(languageCode)
      // 可以在这里添加 toast 提示
      console.log(`Language changed to: ${languageCode}`)
    }
  }
  
  // 根据位置调整样式
  const getButtonVariant = () => {
    switch (position) {
      case 'topBar':
        return 'ghost'
      case 'settings':
        return 'outline'
      case 'standalone':
        return 'default'
      default:
        return 'ghost'
    }
  }
  
  const getButtonSize = () => {
    switch (position) {
      case 'topBar':
        return 'sm'
      case 'settings':
        return 'default'
      case 'standalone':
        return 'default'
      default:
        return 'sm'
    }
  }
  
  if (variant === 'toggle') {
    // 简单的切换按钮，只在两种语言间切换
    const otherLanguage = availableLanguages.find(lang => lang.code !== currentLanguage)
    
    return (
      <Button
        variant={getButtonVariant()}
        size={getButtonSize()}
        onClick={() => otherLanguage && handleLanguageChange(otherLanguage.code)}
        className={cn('gap-2', className)}
        title={t('toolbar:language')}
      >
        <span className="text-lg">{currentConfig.flag}</span>
        {showLabel && (
          <span className="hidden sm:inline">
            {currentConfig.name}
          </span>
        )}
      </Button>
    )
  }
  
  // 下拉菜单模式
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={getButtonVariant()}
          size={getButtonSize()}
          className={cn('gap-2', className)}
          title={t('toolbar:language')}
        >
          {position === 'topBar' ? (
            <>
              <span className="text-lg">{currentConfig.flag}</span>
              {showLabel && (
                <span className="hidden sm:inline">
                  {currentConfig.name}
                </span>
              )}
            </>
          ) : (
            <>
              <Globe className="h-4 w-4" />
              {showLabel && (
                <span>{currentConfig.name}</span>
              )}
            </>
          )}
          {position !== 'topBar' && <Languages className="h-4 w-4 ml-auto" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[120px]">
        {availableLanguages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className={cn(
              'gap-2 cursor-pointer',
              currentLanguage === language.code && 'bg-accent'
            )}
          >
            <span className="text-lg">{language.flag}</span>
            <span>{language.name}</span>
            {currentLanguage === language.code && (
              <div className="ml-auto h-2 w-2 rounded-full bg-blue-500" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// 导出便利组件
export function TopBarLanguageSwitcher(props: Omit<LanguageSwitcherProps, 'position'>) {
  return <LanguageSwitcher {...props} position="topBar" />
}

export function SettingsLanguageSwitcher(props: Omit<LanguageSwitcherProps, 'position'>) {
  return <LanguageSwitcher {...props} position="settings" showLabel={true} />
}

export function StandaloneLanguageSwitcher(props: Omit<LanguageSwitcherProps, 'position'>) {
  return <LanguageSwitcher {...props} position="standalone" showLabel={true} />
}