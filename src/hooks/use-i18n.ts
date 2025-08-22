import { useTranslation } from 'react-i18next'
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from '../i18n'

// 自定义i18n Hook，提供额外的便利方法
export function useI18n() {
  const { t, i18n } = useTranslation()
  
  const changeLanguage = async (language: string) => {
    if (language in SUPPORTED_LANGUAGES) {
      await i18n.changeLanguage(language)
      // 保存到localStorage (由language detector自动处理)
    }
  }
  
  const getCurrentLanguage = () => {
    let currentLang = i18n.language || DEFAULT_LANGUAGE
    // 处理地区变体，确保返回支持的语言代码
    if (currentLang.startsWith('zh')) currentLang = 'zh'
    if (currentLang.startsWith('en')) currentLang = 'en'
    
    // 确保返回的语言是支持的
    if (!(currentLang in SUPPORTED_LANGUAGES)) {
      currentLang = DEFAULT_LANGUAGE
    }
    
    return currentLang
  }
  
  const getLanguageConfig = () => {
    const currentLang = getCurrentLanguage()
    return SUPPORTED_LANGUAGES[currentLang as keyof typeof SUPPORTED_LANGUAGES] || SUPPORTED_LANGUAGES[DEFAULT_LANGUAGE]
  }
  
  const isLanguageSupported = (language: string) => {
    return language in SUPPORTED_LANGUAGES
  }
  
  const getAvailableLanguages = () => {
    return Object.values(SUPPORTED_LANGUAGES)
  }
  
  // 格式化日期
  const formatDate = (date: Date, format?: string) => {
    const config = getLanguageConfig()
    const targetFormat = format || config.dateFormat
    
    // 简单的日期格式化，可以后续使用更强大的库如 date-fns
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    
    switch (targetFormat) {
      case 'YYYY-MM-DD':
        return `${year}-${month}-${day}`
      case 'MM/DD/YYYY':
        return `${month}/${day}/${year}`
      default:
        return date.toLocaleDateString()
    }
  }
  
  // 格式化数字
  const formatNumber = (number: number, decimals?: number) => {
    const config = getLanguageConfig()
    return new Intl.NumberFormat(getCurrentLanguage(), {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(number)
  }
  
  return {
    t,
    i18n,
    changeLanguage,
    getCurrentLanguage,
    getLanguageConfig,
    isLanguageSupported,
    getAvailableLanguages,
    formatDate,
    formatNumber,
    isReady: i18n.isInitialized
  }
}

// 便利的翻译函数，可以在非组件中使用
export const translate = (key: string, options?: any) => {
  // 这个需要在 i18n 初始化后使用
  return typeof window !== 'undefined' && window.i18next ? window.i18next.t(key, options) : key
}

// 声明全局类型以支持 window.i18next
declare global {
  interface Window {
    i18next: any
  }
}