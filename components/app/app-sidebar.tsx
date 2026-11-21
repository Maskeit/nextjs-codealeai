"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import logo from "/public/codeale_logo.webp"
import {
  ChartColumnIcon,
  MessageSquarePlusIcon,
  MessagesSquareIcon,
  SettingsIcon,
  SparklesIcon,
  Trash2Icon,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useLang } from "@/components/LangProvider"
import { getChatTitle, useChatStore } from "@/lib/chat-store"

const navigation = [
  { href: "/", labelKey: "nav.chat", icon: MessagesSquareIcon },
  { href: "/results", labelKey: "nav.results", icon: ChartColumnIcon },
  { href: "/config", labelKey: "nav.config", icon: SettingsIcon },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { t } = useLang()
  const { state, hydrated, createChat, selectChat, deleteChat } = useChatStore()

  function openNewChat() {
    createChat()
    if (pathname !== "/") router.push("/")
  }

  function removeChat(chatId: string, title: string) {
    if (window.confirm(t("nav.delete_chat_confirm", { title }))) {
      deleteChat(chatId)
    }
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-0 py-1.5">
          <div className="flex size-8 items-center justify-center rounded-lg text-sidebar-primary-foreground">
            <Image
              src={logo}
              alt={t("nav.brand")}
              width={30}
              height={30}
              className="h-6 w-6"
            />
          </div>
          <span className="text-sm font-semibold group-data-[collapsible=icon]:hidden">
            {t("nav.brand")}
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t("nav.navigation")}</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip={t("nav.n_chat")} onClick={openNewChat}>
                <MessageSquarePlusIcon />
                <span>{t("nav.n_chat")}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            {navigation.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={t(item.labelKey)}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{t(item.labelKey)}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
        {hydrated && state.chats.length > 0 && (
          <SidebarGroup className="group-data-[collapsible=icon]:hidden">
            <SidebarGroupLabel>{t("nav.chats")}</SidebarGroupLabel>
            <SidebarMenu>
              {state.chats.map((chat) => {
                const title = getChatTitle(chat, t("nav.new_chat_title"))
                return (
                  <SidebarMenuItem key={chat.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === "/" && chat.id === state.activeChatId}
                    >
                      <Link href="/" onClick={() => selectChat(chat.id)}>
                        <span>{title}</span>
                      </Link>
                    </SidebarMenuButton>
                    <SidebarMenuAction
                      showOnHover
                      aria-label={t("nav.delete_chat", { title })}
                      onClick={() => removeChat(chat.id, title)}
                    >
                      <Trash2Icon />
                    </SidebarMenuAction>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  )
}
