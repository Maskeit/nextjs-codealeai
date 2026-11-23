import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app/app-sidebar";
import { ChatStoreProvider } from "@/lib/chat-store";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LangProvider } from "@/components/LangProvider";
import { ThemeProvider, themeInitScript } from "@/components/ThemeProvider";
import { Preferences } from "@/components/app/preferences";
const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "",
  description: "Pagina para probar apis LLM",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={cn(
        "h-full antialiased font-sans",
        geistSans.variable,
        geistMono.variable,
        inter.variable,
      )}
    >
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png"/>
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png"/>
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png"/>
        <link rel="manifest" href="/site.webmanifest"/>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex h-svh min-h-0 overflow-hidden">
        <LangProvider>
          <ThemeProvider>
            <ChatStoreProvider>
              <TooltipProvider>
                <SidebarProvider className="h-full min-h-0 overflow-hidden">
                  <AppSidebar />
                  <SidebarInset className="min-h-0 overflow-hidden">
                    <header className="flex h-12 shrink-0 items-center justify-between gap-2 border-b px-3">
                      <SidebarTrigger />
                      <span className="text-sm font-medium"></span>                      
                      <Preferences />
                    </header>
                    <div className="min-h-0 flex-1">{children}</div>
                  </SidebarInset>
                </SidebarProvider>
              </TooltipProvider>
            </ChatStoreProvider>
          </ThemeProvider>
        </LangProvider>
      </body>
    </html>
  );
}
