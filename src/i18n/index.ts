import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// 导入语言资源
import zhResources from './locales/zh/index'
import enResources from './locales/en/index'

// 支持的语言配置
export const SUPPORTED_LANGUAGES = {
  zh: {
    code: 'zh',
    name: '中文',
    flag: '🇨🇳',
    rtl: false,
    dateFormat: 'YYYY-MM-DD',
    numberFormat: {
      decimal: '.',
      thousands: ','
    }
  },
  en: {
    code: 'en',
    name: 'English',
    flag: '🇺🇸',
    rtl: false,
    dateFormat: 'MM/DD/YYYY',
    numberFormat: {
      decimal: '.',
      thousands: ','
    }
  }
} as const

export const DEFAULT_LANGUAGE = 'zh'

// 语言资源配置
const resources = {
  zh: zhResources,
  en: enResources
}

// i18n 初始化配置
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: DEFAULT_LANGUAGE,
    debug: process.env.NODE_ENV === 'development',
    
    // 语言检测配置
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'bt-web-studio-language',
      // 将地区变体映射到基本语言
      convertDetectedLanguage: (lng: string) => {
        // 将 zh-CN, zh-TW, zh-SG 等都映射到 zh
        if (lng.startsWith('zh')) return 'zh'
        // 将 en-US, en-GB 等都映射到 en
        if (lng.startsWith('en')) return 'en'
        // 其他语言返回默认语言
        return 'zh'
      }
    },
    
    // 插值配置
    interpolation: {
      escapeValue: false // React 已经处理了 XSS
    },
    
    // 命名空间配置
    defaultNS: 'common',
    ns: ['common', 'menu', 'toolbar', 'panels', 'nodes', 'messages'],
    
    // 回退配置
    returnNull: false,
    returnEmptyString: false,
    returnObjects: false,
    
    // 加载配置
    load: 'languageOnly', // 仅加载语言代码，不包含地区
    
    // 键值分隔符配置
    keySeparator: '.',
    nsSeparator: ':', // 使用冒号作为命名空间分隔符
    
    // 支持的语言
    supportedLngs: ['zh', 'en'],
    
    // 翻译键缺失时的处理
    missingKeyHandler: (lng, ns, key, fallbackValue) => {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Missing translation key: ${lng} ${ns} ${key}`)
      }
      return fallbackValue || key
    }
  })

// 添加到全局 window 对象以便在非组件中使用
if (typeof window !== 'undefined') {
  window.i18next = i18n
}

export default i18n