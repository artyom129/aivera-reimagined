import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ChatInterface } from "@/components/chat/chat-interface"
import { CHATS_PER_PAGE } from "@/lib/constants"

interface ChatPageProps {
  searchParams: Promise<{ id?: string }>
}

export default async function ChatPage({ searchParams }: ChatPageProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const [{ data: profile, error: profileError }, { data: folders, error: foldersError }, chatsResult] =
    await Promise.all([
      supabase.from("users").select("*").eq("id", user.id).single(),
      supabase.from("folders").select("*").order("updated_at", { ascending: false }),
      supabase.from("chats").select("*").order("updated_at", { ascending: false }).limit(CHATS_PER_PAGE),
    ])

  if (profileError || !profile) {
    throw new Error("Профиль пользователя не создан. Выполните Supabase migration из папки supabase/migrations.")
  }
  if (foldersError) {
    throw new Error("Не удалось загрузить папки")
  }
  if (chatsResult.error) {
    throw new Error("Не удалось загрузить чаты")
  }

  const chats = chatsResult.data || []

  const { id } = await searchParams
  const initialSelectedChatId = id && chats.some((chat) => chat.id === id) ? id : chats[0]?.id || null

  return (
    <div className="h-screen overflow-hidden">
      <ChatInterface
        user={user}
        chats={chats}
        folders={folders || []}
        userProfile={profile}
        initialSelectedChatId={initialSelectedChatId}
      />
    </div>
  )
}

