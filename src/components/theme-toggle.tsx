import React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useI18n } from '@/hooks/use-i18n'

export function ThemeToggle() {
    const { t } = useI18n()
    const { setTheme, theme } = useTheme()

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8">
                    <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">{t('common:toggleTheme')}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme('light')}>
                    <Sun className="mr-2 h-4 w-4" />
                    <span>{t('common:light')}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('dark')}>
                    <Moon className="mr-2 h-4 w-4" />
                    <span>{t('common:dark')}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('system')}>
                    <span className="mr-2">💻</span>
                    <span>{t('common:followSystem')}</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

// 简单的主题切换按钮（用于工具栏）
export function SimpleThemeToggle() {
    const { t } = useI18n()
    const { setTheme, theme } = useTheme()

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark')
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-8 w-8"
            title={t('common:toggleTheme')}
        >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">{t('common:toggleTheme')}</span>
        </Button>
    )
}

// 主题状态指示器
export function ThemeIndicator() {
    const { t } = useI18n()
    const { theme, resolvedTheme } = useTheme()

    if (!theme) return null

    return (
        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
            {resolvedTheme === 'dark' ? (
                <Moon className="h-3 w-3" />
            ) : (
                <Sun className="h-3 w-3" />
            )}
            <span>{resolvedTheme === 'dark' ? t('common:dark') : t('common:light')}</span>
        </div>
    )
}