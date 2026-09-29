"use client"

import type React from "react"
import { useCallback, useMemo, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"
import {
  CheckSquare,
  BookOpen,
  FileText,
  FolderIcon,
  FolderPlus,
  LogOut,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Settings,
  Shield,
  Sparkles,
  Trash2,
  UserIcon,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { ThemeToggle } from "@/components/theme-toggle"
import { createClient } from "@/lib/supabase/client"
import type { Database } from "@/lib/types/database"
import { cn } from "@/lib/utils"

type Chat = Database["public"]["Tables"]["chats"]["Row"]
type Folder = Database["public"]["Tables"]["folders"]["Row"]
type UserProfile = Database["public"]["Tables"]["users"]["Row"]

const UNFILED = "__unfiled__"

interface ChatSidebarProps {
  user: User
  userProfile: UserProfile | null
  chats: Chat[]
  folders: Folder[]
  selectedChatId: string | null
  onSelectChat: (chatId: string | null) => void
  onChatsChange: (chats: Chat[]) => void
  onFoldersChange: (folders: Folder[]) => void
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
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedChatIds, setSelectedChatIds] = useState<Set<string>>(new Set())
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut()
    router.replace("/auth/login")
    router.refresh()
  }, [supabase, router])

  const handleNewChat = useCallback(() => {
    setIsSelectionMode(false)
    setSelectedChatIds(new Set())
    onSelectChat(null)
  }, [onSelectChat])

  const handleRenameChat = useCallback(
    async (chat: Chat) => {
      const nextTitle = prompt("Новое название чата", chat.title)?.trim()
      if (!nextTitle || nextTitle === chat.title) return

      const { data, error } = await supabase
        .from("chats")
        .update({ title: nextTitle.slice(0, 200) })
        .eq("id", chat.id)
        .select()
        .single()

      if (error) {
        alert("Не удалось переименовать чат")
        return
      }

      onChatsChange(chats.map((item) => (item.id === data.id ? data : item)))
    },
    [chats, onChatsChange, supabase],
  )

  const handleMoveChat = useCallback(
    async (chatId: string, folderId: string | null) => {
      const { data, error } = await supabase
        .from("chats")
        .update({ folder_id: folderId })
        .eq("id", chatId)
        .select()
        .single()

      if (error) {
        alert("Не удалось переместить чат")
        return
      }

      onChatsChange(chats.map((chat) => (chat.id === data.id ? data : chat)))
    },
    [chats, onChatsChange, supabase],
  )

  const handleDeleteChat = useCallback(
    async (chatId: string) => {
      if (!confirm("Вы уверены, что хотите удалить этот чат?")) return

      const { error } = await supabase.from("chats").delete().eq("id", chatId)
      if (error) {
        alert("Не удалось удалить чат")
        return
      }

      const updatedChats = chats.filter((chat) => chat.id !== chatId)
      onChatsChange(updatedChats)
      if (selectedChatId === chatId) {
        onSelectChat(updatedChats[0]?.id || null)
      }
    },
    [chats, selectedChatId, supabase, onChatsChange, onSelectChat],
  )

  const handleCreateFolder = useCallback(async () => {
    const name = prompt("Название папки")?.trim()
    if (!name) return

    const { data, error } = await supabase
      .from("folders")
      .insert({ user_id: user.id, name: name.slice(0, 80) })
      .select()
      .single()

    if (error) {
      alert(error.code === "23505" ? "Папка с таким названием уже существует" : "Не удалось создать папку")
      return
    }

    onFoldersChange([data, ...folders])
    setSelectedFolder(data.id)
  }, [folders, onFoldersChange, supabase, user.id])

  const handleRenameFolder = useCallback(
    async (folder: Folder) => {
      const name = prompt("Новое название папки", folder.name)?.trim()
      if (!name || name === folder.name) return

      const { data, error } = await supabase
        .from("folders")
        .update({ name: name.slice(0, 80) })
        .eq("id", folder.id)
        .select()
        .single()

      if (error) {
        alert(error.code === "23505" ? "Папка с таким названием уже существует" : "Не удалось переименовать папку")
        return
      }

      onFoldersChange(folders.map((item) => (item.id === data.id ? data : item)))
    },
    [folders, onFoldersChange, supabase],
  )

  const handleDeleteFolder = useCallback(
    async (folder: Folder) => {
      if (!confirm(`Удалить папку «${folder.name}»? Чаты останутся без папки.`)) return

      const { error } = await supabase.from("folders").delete().eq("id", folder.id)
      if (error) {
        alert("Не удалось удалить папку")
        return
      }

      onFoldersChange(folders.filter((item) => item.id !== folder.id))
      onChatsChange(chats.map((chat) => (chat.folder_id === folder.id ? { ...chat, folder_id: null } : chat)))
      if (selectedFolder === folder.id) setSelectedFolder(null)
    },
    [chats, folders, onChatsChange, onFoldersChange, selectedFolder, supabase],
  )

  const handleBulkDelete = useCallback(async () => {
    if (selectedChatIds.size === 0) return
    if (!confirm(`Вы уверены, что хотите удалить выбранные чаты (${selectedChatIds.size})?`)) return

    const idsToDelete = Array.from(selectedChatIds)
    const { error } = await supabase.from("chats").delete().in("id", idsToDelete)
    if (error) {
      alert("Не удалось удалить чаты")
      return
    }

    const updatedChats = chats.filter((chat) => !selectedChatIds.has(chat.id))
    onChatsChange(updatedChats)
    if (selectedChatId && selectedChatIds.has(selectedChatId)) {
      onSelectChat(updatedChats[0]?.id || null)
    }

    setIsSelectionMode(false)
    setSelectedChatIds(new Set())
  }, [selectedChatIds, chats, selectedChatId, supabase, onChatsChange, onSelectChat])

  const toggleChatSelection = useCallback((chatId: string) => {
    setSelectedChatIds((previous) => {
      const next = new Set(previous)
      if (next.has(chatId)) next.delete(chatId)
      else next.add(chatId)
      return next
    })
  }, [])

  const toggleSelectionMode = useCallback(() => {
    setIsSelectionMode((previous) => {
      if (previous) setSelectedChatIds(new Set())
      return !previous
    })
  }, [])

  const filteredChats = useMemo(
    () =>
      chats.filter((chat) => {
        const matchesSearch = chat.title.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesFolder =
          selectedFolder === null ||
          (selectedFolder === UNFILED ? chat.folder_id === null : chat.folder_id === selectedFolder)
        return matchesSearch && matchesFolder
      }),
    [chats, searchQuery, selectedFolder],
  )

  return (
    <div className="flex h-full w-64 shrink-0 flex-col overflow-hidden border-r bg-sidebar md:w-72 lg:w-80">
      <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between border-b bg-sidebar px-4 py-4">
        <div className="flex items-center gap-2.5">
          <Sparkles className="h-5 w-5 text-sidebar-primary" />
          <span className="text-base font-semibold text-sidebar-foreground">AIvera</span>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button
            variant={isSelectionMode ? "secondary" : "ghost"}
            size="icon"
            onClick={toggleSelectionMode}
            title={isSelectionMode ? "Отменить выбор" : "Выбрать чаты"}
            className="h-9 w-9 rounded-full"
          >
            {isSelectionMode ? <X className="h-4 w-4" /> : <CheckSquare className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={handleNewChat} title="Новый чат" className="h-9 w-9 rounded-full">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="shrink-0 space-y-1 border-b p-3">
        <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Инструменты</p>
        <Button
          type="button"
          variant="secondary"
          className="w-full justify-start rounded-xl"
          onClick={() => router.push("/lesson-plan")}
        >
          <BookOpen className="mr-2 h-4 w-4" />
          Создать план урока
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="w-full justify-start rounded-xl"
          onClick={() => router.push("/templates")}
        >
          <FileText className="mr-2 h-4 w-4" />
          Шаблоны материалов
        </Button>
      </div>

      {isSelectionMode && (
        <div className="flex shrink-0 items-center justify-between border-b bg-sidebar-accent/20 px-4 py-2">
          <span className="text-xs text-muted-foreground">Выбрано: {selectedChatIds.size}</span>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDelete}
            disabled={selectedChatIds.size === 0}
            className="h-7 px-2 text-xs"
          >
            Удалить
          </Button>
        </div>
      )}

      <div className="shrink-0 space-y-3 border-b p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Поиск..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="h-9 rounded-full bg-background pl-9 text-sm"
          />
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between px-2">
            <span className="text-xs font-medium text-muted-foreground">Папки</span>
            <Button variant="ghost" size="icon" onClick={handleCreateFolder} className="h-7 w-7" title="Новая папка">
              <FolderPlus className="h-4 w-4" />
            </Button>
          </div>
          <button
            type="button"
            onClick={() => setSelectedFolder(null)}
            className={cn(
              "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm",
              selectedFolder === null ? "bg-sidebar-accent" : "hover:bg-sidebar-accent/50",
            )}
          >
            <MessageSquare className="h-4 w-4" />
            Все чаты
          </button>
          <button
            type="button"
            onClick={() => setSelectedFolder(UNFILED)}
            className={cn(
              "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm",
              selectedFolder === UNFILED ? "bg-sidebar-accent" : "hover:bg-sidebar-accent/50",
            )}
          >
            <FolderIcon className="h-4 w-4" />
            Без папки
          </button>
          {folders.map((folder) => (
            <div key={folder.id} className="group/folder flex items-center">
              <button
                type="button"
                onClick={() => setSelectedFolder(folder.id)}
                className={cn(
                  "flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm",
                  selectedFolder === folder.id ? "bg-sidebar-accent" : "hover:bg-sidebar-accent/50",
                )}
              >
                <FolderIcon className="h-4 w-4 shrink-0" style={{ color: folder.color || undefined }} />
                <span className="truncate">{folder.name}</span>
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-100 sm:opacity-0 sm:group-hover/folder:opacity-100"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleRenameFolder(folder)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Переименовать
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDeleteFolder(folder)} className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Удалить
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2">
        <div className="space-y-1 py-2">
          {filteredChats.map((chat) => (
            <div
              key={chat.id}
              className={cn(
                "group flex w-full items-center gap-2 rounded-2xl transition-colors",
                selectedChatId === chat.id && !isSelectionMode
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50",
              )}
            >
              {isSelectionMode && (
                <div className="flex items-center pl-3">
                  <Checkbox
                    checked={selectedChatIds.has(chat.id)}
                    onCheckedChange={() => toggleChatSelection(chat.id)}
                    className="h-4 w-4 rounded-sm border-sidebar-foreground/50"
                  />
                </div>
              )}

              <button
                type="button"
                onClick={() => (isSelectionMode ? toggleChatSelection(chat.id) : onSelectChat(chat.id))}
                className={cn(
                  "flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 text-left text-sm",
                  isSelectionMode && "px-2",
                )}
              >
                <MessageSquare className="h-4 w-4 shrink-0" />
                <span className="truncate">{chat.title}</span>
              </button>

              {!isSelectionMode && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 rounded-full opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="max-h-80 overflow-y-auto">
                    <DropdownMenuItem onClick={() => handleRenameChat(chat)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Переименовать
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleMoveChat(chat.id, null)}>
                      <FolderIcon className="mr-2 h-4 w-4" />
                      Без папки
                    </DropdownMenuItem>
                    {folders.map((folder) => (
                      <DropdownMenuItem key={folder.id} onClick={() => handleMoveChat(chat.id, folder.id)}>
                        <FolderIcon className="mr-2 h-4 w-4" />
                        {folder.name}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleDeleteChat(chat.id)} className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Удалить
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          ))}

          {filteredChats.length === 0 && (
            <div className="py-12 text-center text-sm text-muted-foreground">
              {searchQuery ? "Чаты не найдены" : "В этой папке нет чатов"}
            </div>
          )}
        </div>
      </div>

      <div className="sticky bottom-0 z-10 shrink-0 border-t bg-sidebar p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-auto w-full justify-start gap-2.5 rounded-2xl px-3 py-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                <UserIcon className="h-4 w-4" />
              </div>
              <div className="flex min-w-0 flex-col items-start text-left">
                <span className="w-full truncate text-sm font-medium">{userProfile?.full_name || user.email}</span>
                <span className="text-xs text-muted-foreground">{userProfile?.role || "teacher"}</span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-2xl">
            {userProfile?.role === "admin" && (
              <>
                <DropdownMenuItem onClick={() => router.push("/admin")}>
                  <Shield className="mr-2 h-4 w-4" />
                  Админ-панель
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              <Settings className="mr-2 h-4 w-4" />
              Настройки
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Выйти
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

