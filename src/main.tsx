import React from "react"
import ReactDOM from "react-dom/client"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import App from "./app"

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
            <App />
            <Toaster />
        </ThemeProvider>
    </React.StrictMode>
)