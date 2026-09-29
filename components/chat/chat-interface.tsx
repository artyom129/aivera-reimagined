"use client"

import { useState, useCallback, useMemo } from "react"
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
  const handleSelectChat = useCallback((newChatId: string | null) => {
    setSelectedChatId(newChatId)
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false)
    }
  }, [])

  const handleChatUpdate = useCallback((updatedChat: Chat) => {
    setChats((previous) => [
      updatedChat,
      ...previous.filter((chat) => chat.id !== updatedChat.id),
    ])
  }, [])

  const handleChatCreated = useCallback((newChat: Chat) => {
    setChats((previous) => [newChat, ...previous.filter((chat) => chat.id !== newChat.id)])
    setSelectedChatId(newChat.id)
  }, [])

  const selectedChat = useMemo(() => chats.find((chat) => chat.id === selectedChatId), [chats, selectedChatId])

  return (
    <div className="relative flex h-dvh overflow-hidden bg-background">
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      <div className={cn(
        "fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto transition-transform duration-300",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <ChatSidebar
          user={user}
          userProfile={userProfile}
          chats={chats}
          folders={folders}
          selectedChatId={selectedChatId}
          onSelectChat={handleSelectChat}
          onChatsChange={setChats}
          onFoldersChange={setFolders}
        />
      </div>
      <ChatArea
        user={user}
        selectedChat={selectedChat}
        onChatUpdate={handleChatUpdate}
        onChatCreated={handleChatCreated}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        userProfile={userProfile}
      />
    </div>
  )
}
