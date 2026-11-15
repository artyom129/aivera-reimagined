"use client"

import { useCallback, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import {
  Check,
  FileText,
  Folder as FolderIcon,
  FolderPlus,
  ListChecks,
  LogOut,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Settings,
  Shield,
  Trash2,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { BrandMark } from "@/components/brand"
import { ThemeToggle } from "@/components/theme-toggle"
import { useDialogs } from "@/components/dialogs"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { groupChatsByDate } from "@/lib/chat-groups"
import { currentMonthUsage } from "@/lib/usage"
import { TOOLS } from "@/lib/tools"
import { ToolIcon } from "@/components/tools/tool-icon"
import type { Database } from "@/lib/types/database"
import { cn } from "@/lib/utils"

type Chat = Database["public"]["Tables"]["chats"]["Row"]
type Folder = Database["public"]["Tables"]["folders"]["Row"]
type UserProfile = Database["public"]["Tables"]["users"]["Row"]

const ALL = "all"
const UNFILED = "unfiled"

interface ChatSidebarProps {
  user: User
  userProfile: UserProfile | null
  chats: Chat[]
  folders: Folder[]
  selectedChatId: string | null
  onSelectChat: (chatId: string | null) => void
  onChatsChange: (chats: Chat[]) => void
  onFoldersChange: (folders: Folder[]) => void
  onClose: () => void
}

export function ChatSidebar({
  user,
  userProfile,
  chats,
  folders,
  selectedChatId,
  onSelectChat,
  onChatsChange,
  onFoldersChange,
  onClose,
}: ChatSidebarProps) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const { toast } = useToast()
  const { confirm, prompt, dialogs } = useDialogs()

  const [search, setSearch] = useState("")
  const [folderFilter, setFolderFilter] = useState<string>(ALL)
  const [selecting, setSelecting] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const fail = useCallback(
    (description: string) => toast({ title: "Не получилось", description, variant: "destructive" }),
    [toast],
  )

  const signOut = async () => {
    await supabase.auth.signOut()
    router.replace("/auth/login")
    router.refresh()
  }

  const renameChat = async (chat: Chat) => {
    const title = await prompt({ title: "Название чата", initialValue: chat.title, maxLength: 200 })
    if (!title || title === chat.title) return
    const { data, error } = await supabase.from("chats").update({ title }).eq("id", chat.id).select().single()
    if (error || !data) return fail("Чат не переименован")
    onChatsChange(chats.map((item) => (item.id === data.id ? data : item)))
  }

  const moveChat = async (chat: Chat, folderId: string | null) => {
    const { data, error } = await supabase.from("chats").update({ folder_id: folderId }).eq("id", chat.id).select().single()
    if (error || !data) return fail("Чат не перемещён")
    onChatsChange(chats.map((item) => (item.id === data.id ? data : item)))
  }

  const deleteChats = async (ids: string[]) => {
    const ok = await confirm({
      title: ids.length === 1 ? "Удалить чат?" : `Удалить чаты: ${ids.length}?`,
      description: "Сообщения удалятся вместе с чатом. Отменить это нельзя.",
      confirmLabel: "Удалить",
      destructive: true,
    })
    if (!ok) return
    const { error } = await supabase.from("chats").delete().in("id", ids)
    if (error) return fail("Чаты не удалены")

    const rest = chats.filter((chat) => !ids.includes(chat.id))
    onChatsChange(rest)
    if (selectedChatId && ids.includes(selectedChatId)) onSelectChat(null)
    setSelecting(false)
    setSelectedIds(new Set())
  }

  const createFolder = async () => {
    const name = await prompt({ title: "Новая папка", placeholder: "Например, 7 «Б»", maxLength: 80, confirmLabel: "Создать" })
    if (!name) return
    const { data, error } = await supabase.from("folders").insert({ user_id: user.id, name }).select().single()
    if (error || !data) return fail(error?.code === "23505" ? "Такая папка уже есть" : "Папка не создана")
    onFoldersChange([data, ...folders])
    setFolderFilter(data.id)
  }

  const renameFolder = async (folder: Folder) => {
    const name = await prompt({ title: "Название папки", initialValue: folder.name, maxLength: 80 })
    if (!name || name === folder.name) return
    const { data, error } = await supabase.from("folders").update({ name }).eq("id", folder.id).select().single()
    if (error || !data) return fail(error?.code === "23505" ? "Такая папка уже есть" : "Папка не переименована")
    onFoldersChange(folders.map((item) => (item.id === data.id ? data : item)))
  }

  const deleteFolder = async (folder: Folder) => {
    const ok = await confirm({
      title: `Удалить папку «${folder.name}»?`,
      description: "Чаты останутся, просто без папки.",
      confirmLabel: "Удалить папку",
      destructive: true,
    })
    if (!ok) return
    const { error } = await supabase.from("folders").delete().eq("id", folder.id)
    if (error) return fail("Папка не удалена")
    onFoldersChange(folders.filter((item) => item.id !== folder.id))
    onChatsChange(chats.map((chat) => (chat.folder_id === folder.id ? { ...chat, folder_id: null } : chat)))
    if (folderFilter === folder.id) setFolderFilter(ALL)
  }

  const toggleSelected = (id: string) =>
    setSelectedIds((previous) => {
      const next = new Set(previous)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const visibleChats = useMemo(() => {
    const query = search.trim().toLowerCase()
    return chats.filter((chat) => {
      if (query && !chat.title.toLowerCase().includes(query)) return false
      if (folderFilter === UNFILED) return chat.folder_id === null
      if (folderFilter !== ALL) return chat.folder_id === folderFilter
      return true
    })
  }, [chats, search, folderFilter])

  const groups = useMemo(() => groupChatsByDate(visibleChats), [visibleChats])
  const usage = userProfile ? currentMonthUsage(userProfile) : null

  return (
    <aside className="flex h-full w-72 flex-col border-r bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 shrink-0 items-center gap-2 px-3">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <BrandMark className="size-6 text-[13px]" />
          AIvera
        </Link>
        <div className="ml-auto flex items-center">
          <ThemeToggle />
          <Button variant="ghost" size="icon" className="size-8 lg:hidden" onClick={onClose} aria-label="Закрыть">
            <X className="size-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-1 px-3 pb-3">
        <Button className="w-full justify-start gap-2" onClick={() => onSelectChat(null)}>
          <Plus className="size-4" />
          Новый чат
        </Button>
        <nav aria-label="Инструменты" className="space-y-0.5 pt-4">
          <p className="px-2 pb-1 text-xs text-muted-foreground">Инструменты</p>
          {TOOLS.map((tool) => (
            <Link
              key={tool.slug}
              href={`/tools/${tool.slug}`}
              className="flex h-8 items-center gap-2.5 rounded-md px-2 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <ToolIcon slug={tool.slug} className="text-muted-foreground" />
              {tool.title}
            </Link>
          ))}
          <Link
            href="/templates"
            className="flex h-8 items-center gap-2.5 rounded-md px-2 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <FileText className="size-4 text-muted-foreground" />
            Шаблоны
          </Link>
        </nav>
      </div>

      <div className="space-y-2 border-t px-3 py-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Поиск по чатам"
            aria-label="Поиск по чатам"
            className="h-8 bg-background pl-8 text-sm"
          />
        </div>
        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 min-w-0 flex-1 justify-start gap-1.5 px-2 text-xs">
                <FolderIcon className="size-3.5 shrink-0" />
                <span className="truncate">
                  {folderFilter === ALL
                    ? "Все чаты"
                    : folderFilter === UNFILED
                      ? "Без папки"
                      : (folders.find((folder) => folder.id === folderFilter)?.name ?? "Все чаты")}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-60">
              <DropdownMenuItem onClick={() => setFolderFilter(ALL)}>Все чаты</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFolderFilter(UNFILED)}>Без папки</DropdownMenuItem>
              {folders.length > 0 && <DropdownMenuSeparator />}
              {folders.map((folder) => (
                <DropdownMenuItem key={folder.id} onClick={() => setFolderFilter(folder.id)} className="justify-between">
                  <span className="truncate">{folder.name}</span>
                  <span className="flex gap-1">
                    <button
                      type="button"
                      aria-label={`Переименовать ${folder.name}`}
                      onClick={(event) => {
                        event.stopPropagation()
                        void renameFolder(folder)
                      }}
                      className="rounded p-0.5 opacity-60 hover:opacity-100"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Удалить ${folder.name}`}
                      onClick={(event) => {
                        event.stopPropagation()
                        void deleteFolder(folder)
                      }}
                      className="rounded p-0.5 opacity-60 hover:text-destructive hover:opacity-100"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={createFolder}>
                <FolderPlus className="mr-2 size-4" />
                Новая папка
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant={selecting ? "secondary" : "ghost"}
            size="icon"
            className="size-7"
            onClick={() => {
              setSelecting((value) => !value)
              setSelectedIds(new Set())
            }}
            aria-label={selecting ? "Отменить выбор" : "Выбрать несколько"}
            title={selecting ? "Отменить выбор" : "Выбрать несколько"}
          >
            <ListChecks className="size-3.5" />
          </Button>
        </div>
        {selecting && (
          <div className="flex items-center justify-between rounded-md bg-sidebar-accent px-2 py-1 text-xs">
            <span>Выбрано: {selectedIds.size}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-destructive hover:text-destructive"
              disabled={selectedIds.size === 0}
              onClick={() => deleteChats([...selectedIds])}
            >
              Удалить
            </Button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {groups.length === 0 && (
          <p className="px-3 py-10 text-center text-sm text-muted-foreground">
            {search ? "Ничего не нашлось" : "Здесь появятся ваши чаты"}
          </p>
        )}
        {groups.map((group) => (
          <section key={group.label} className="pt-3">
            <h2 className="px-2 pb-1 text-xs font-medium text-muted-foreground">{group.label}</h2>
            <ul>
              {group.chats.map((chat) => {
                const active = chat.id === selectedChatId && !selecting
                const checked = selectedIds.has(chat.id)
                return (
                  <li key={chat.id} className="group/chat relative">
                    <button
                      type="button"
                      onClick={() => (selecting ? toggleSelected(chat.id) : onSelectChat(chat.id))}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-md py-1.5 pl-2 pr-8 text-left text-sm",
                        active ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/60",
                      )}
                    >
                      {selecting && (
                        <span
                          className={cn(
                            "flex size-4 shrink-0 items-center justify-center rounded border",
                            checked && "border-primary bg-primary text-primary-foreground",
                          )}
                        >
                          {checked && <Check className="size-3" />}
                        </span>
                      )}
                      <span className="truncate">{chat.title}</span>
                    </button>
                    {!selecting && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Действия с чатом"
                            className="absolute right-1 top-1/2 size-6 -translate-y-1/2 opacity-100 sm:opacity-0 sm:group-hover/chat:opacity-100 sm:focus-visible:opacity-100 data-[state=open]:opacity-100"
                          >
                            <MoreHorizontal className="size-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuItem onClick={() => renameChat(chat)}>
                            <Pencil className="mr-2 size-4" />
                            Переименовать
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">В папку</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => moveChat(chat, null)} disabled={chat.folder_id === null}>
                            Без папки
                          </DropdownMenuItem>
                          {folders.map((folder) => (
                            <DropdownMenuItem
                              key={folder.id}
                              onClick={() => moveChat(chat, folder.id)}
                              disabled={chat.folder_id === folder.id}
                            >
                              <span className="truncate">{folder.name}</span>
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => deleteChats([chat.id])} className="text-destructive focus:text-destructive">
                            <Trash2 className="mr-2 size-4" />
                            Удалить
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>

      <div className="border-t p-2">
        {usage && usage.limit > 0 && (
          <div className="px-2 pb-2 pt-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Лимит за месяц</span>
              <span>{Math.round(usage.ratio * 100)}%</span>
            </div>
            <div className="mt-1 h-1 overflow-hidden rounded-full bg-sidebar-accent">
              <div
                className={cn("h-full rounded-full", usage.ratio >= 0.9 ? "bg-destructive" : "bg-primary")}
                style={{ width: `${Math.min(usage.ratio, 1) * 100}%` }}
              />
            </div>
          </div>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-auto w-full justify-start gap-2 px-2 py-1.5">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-xs font-medium uppercase">
                {(userProfile?.full_name || user.email || "?").slice(0, 1)}
              </span>
              <span className="min-w-0 text-left">
                <span className="block truncate text-sm">{userProfile?.full_name || user.email}</span>
                {userProfile?.role === "admin" && <span className="block text-xs text-muted-foreground">Администратор</span>}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="top" className="w-60">
            {userProfile?.role === "admin" && (
              <DropdownMenuItem onClick={() => router.push("/admin")}>
                <Shield className="mr-2 size-4" />
                Админ-панель
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              <Settings className="mr-2 size-4" />
              Настройки
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut}>
              <LogOut className="mr-2 size-4" />
              Выйти
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {dialogs}
    </aside>
  )
}
