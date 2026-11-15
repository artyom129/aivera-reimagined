"use client"

import { useCallback, useMemo, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { ChatSidebar } from "./chat-sidebar"
import { ChatArea } from "./chat-area"
import type { Database } from "@/lib/types/database"
import { cn } from "@/lib/utils"

type Chat = Database["public"]["Tables"]["chats"]["Row"]
type Folder = Database["public"]["Tables"]["folders"]["Row"]
type UserProfile = Database["public"]["Tables"]["users"]["Row"]

interface ChatInterfaceProps {
  user: User
  chats: Chat[]
  folders: Folder[]
  userProfile: UserProfile | null
  initialSelectedChatId: string | null
}

export function ChatInterface({
  user,
  chats: initialChats,
  folders: initialFolders,
  userProfile,
  initialSelectedChatId,
}: ChatInterfaceProps) {
  const [chats, setChats] = useState(initialChats)
  const [folders, setFolders] = useState(initialFolders)
  const [selectedChatId, setSelectedChatId] = useState<string | null>(initialSelectedChatId)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const selectChat = useCallback((chatId: string | null) => {
    setSelectedChatId(chatId)
    setIsSidebarOpen(false)
    // Keep the address shareable and the back button sane.
    const url = chatId ? `/chat?id=${chatId}` : "/chat"
    window.history.replaceState(null, "", url)
  }, [])

  const updateChat = useCallback((updated: Chat) => {
    setChats((previous) => [updated, ...previous.filter((chat) => chat.id !== updated.id)])
  }, [])

  const addChat = useCallback(
    (chat: Chat) => {
      setChats((previous) => [chat, ...previous.filter((item) => item.id !== chat.id)])
      selectChat(chat.id)
    },
    [selectChat],
  )

  const selectedChat = useMemo(() => chats.find((chat) => chat.id === selectedChatId), [chats, selectedChatId])

  return (
    <div className="relative flex h-dvh overflow-hidden bg-background">
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setIsSidebarOpen(false)} aria-hidden />
      )}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 transition-transform duration-200 lg:relative lg:z-auto lg:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <ChatSidebar
          user={user}
          userProfile={userProfile}
          chats={chats}
          folders={folders}
          selectedChatId={selectedChatId}
          onSelectChat={selectChat}
          onChatsChange={setChats}
          onFoldersChange={setFolders}
          onClose={() => setIsSidebarOpen(false)}
        />
      </div>
      <ChatArea
        user={user}
        selectedChat={selectedChat}
        onChatUpdate={updateChat}
        onChatCreated={addChat}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((open) => !open)}
      />
    </div>
  )
}
