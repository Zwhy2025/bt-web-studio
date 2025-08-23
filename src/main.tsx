import React from "react"
import ReactDOM from "react-dom/client"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import App from "./app"
import "./i18n" // 初始化 i18n
import { I18nextProvider } from "react-i18next"
import i18n from "./i18n"

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
        <I18nextProvider i18n={i18n}>
            <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
                <App />
                <Toaster />
            </ThemeProvider>
        </I18nextProvider>
    </React.StrictMode>
)