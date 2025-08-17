import { useState, useEffect } from 'react'

export function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState<boolean>(false)

    useEffect(() => {
        const media = window.matchMedia(query)

        // 设置初始值
        setMatches(media.matches)

        // 创建监听器
        const listener = (event: MediaQueryListEvent) => {
            setMatches(event.matches)
        }

        // 添加监听器
        if (media.addEventListener) {
            media.addEventListener('change', listener)
        } else {
            // 兼容旧版浏览器
            media.addListener(listener)
        }

        // 清理函数
        return () => {
            if (media.removeEventListener) {
                media.removeEventListener('change', listener)
            } else {
                media.removeListener(listener)
            }
        }
    }, [query])

    return matches
}

// 预定义的常用断点
export const useIsTablet = () => useMediaQuery('(max-width: 1024px)')
export const useIsDesktop = () => useMediaQuery('(min-width: 1025px)')
export const useIsLargeScreen = () => useMediaQuery('(min-width: 1440px)')
