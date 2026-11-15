"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import type { User } from "@supabase/supabase-js"
import { AlertCircle, ArrowRight, MessageSquareText, PanelLeft, X } from "lucide-react"
import { ToolIcon } from "@/components/tools/tool-icon"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Composer } from "@/components/chat/composer"
import { MessageItem, TypingIndicator } from "@/components/chat/message-item"
import { createClient } from "@/lib/supabase/client"
import { AI_MODES, type AIModeKey } from "@/lib/ai-config"
import { ChatRequestError, streamChatAnswer } from "@/lib/ai/client"
import { TOOLS } from "@/lib/tools"
import type { Database } from "@/lib/types/database"
import {
  CHAT_AUTOSEND_STORAGE_KEY,
  CHAT_DRAFT_STORAGE_KEY,
  MESSAGES_PER_PAGE,
  PRIVACY_ACK_STORAGE_KEY,
} from "@/lib/constants"

type Chat = Database["public"]["Tables"]["chats"]["Row"]
type Message = Database["public"]["Tables"]["messages"]["Row"]

interface ChatAreaProps {
  user: User
  selectedChat: Chat | undefined
  onChatUpdate: (chat: Chat) => void
  onChatCreated: (chat: Chat) => void
  isSidebarOpen: boolean
  onToggleSidebar: () => void
}

const CONTINUE_PROMPT = "Продолжи с того места, где ты остановился."

function makeTitle(text: string) {
  const line = text.split("\n")[0].trim()
  return line.length > 60 ? `${line.slice(0, 57)}...` : line || "Новый чат"
}

function localMessage(chatId: string, role: Message["role"], content: string, id?: string | null): Message {
  return {
    id: id ?? `local-${crypto.randomUUID()}`,
    chat_id: chatId,
    role,
    content,
    created_at: new Date().toISOString(),
  }
}

function readPrivacyAck() {
  try {
    return sessionStorage.getItem(PRIVACY_ACK_STORAGE_KEY) === "1"
  } catch {
    return false
  }
}

export function ChatArea({ user, selectedChat, onChatUpdate, onChatCreated, isSidebarOpen, onToggleSidebar }: ChatAreaProps) {
  const supabase = useMemo(() => createClient(), [])
  const chatId = selectedChat?.id ?? null

  const [messages, setMessages] = useState<Message[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [input, setInput] = useState("")
  const [mode, setMode] = useState<AIModeKey>("default")
  const [streamingText, setStreamingText] = useState("")
  const [isBusy, setIsBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [truncated, setTruncated] = useState(false)
  const [privacyConfirmed, setPrivacyConfirmedState] = useState(false)
  const [pendingAutoSend, setPendingAutoSend] = useState(false)

  const abortRef = useRef<AbortController | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const stickToBottomRef = useRef(true)
  // Set when this component creates a chat itself, so the "chat switched" effect leaves it alone.
  const ownNewChatIdRef = useRef<string | null>(null)

  useEffect(() => {
    // sessionStorage is only available after mount
    setPrivacyConfirmedState(readPrivacyAck())
  }, [])

  const setPrivacyConfirmed = useCallback((value: boolean) => {
    setPrivacyConfirmedState(value)
    try {
      if (value) sessionStorage.setItem(PRIVACY_ACK_STORAGE_KEY, "1")
      else sessionStorage.removeItem(PRIVACY_ACK_STORAGE_KEY)
    } catch {
      // private mode: the checkbox simply is not remembered
    }
  }, [])

  // Switching chats: stop the running answer (the server keeps what was written so far) and load history.
  useEffect(() => {
    if (chatId && chatId === ownNewChatIdRef.current) {
      ownNewChatIdRef.current = null
      return
    }

    abortRef.current?.abort()
    abortRef.current = null
    setIsBusy(false)
    setStreamingText("")
    setTruncated(false)
    setError(null)

    if (!chatId) {
      setMessages([])
      return
    }

    const draft = sessionStorage.getItem(CHAT_DRAFT_STORAGE_KEY)
    if (draft) {
      sessionStorage.removeItem(CHAT_DRAFT_STORAGE_KEY)
      setInput(draft)
      if (sessionStorage.getItem(CHAT_AUTOSEND_STORAGE_KEY) === "1") {
        sessionStorage.removeItem(CHAT_AUTOSEND_STORAGE_KEY)
        // The privacy note was already confirmed in the tool form.
        sessionStorage.setItem(PRIVACY_ACK_STORAGE_KEY, "1")
        setPrivacyConfirmedState(true)
        setPendingAutoSend(true)
      }
    }

    let cancelled = false
    setLoadingMessages(true)
    supabase
      .from("messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: false })
      .limit(MESSAGES_PER_PAGE)
      .then(({ data, error: loadError }) => {
        if (cancelled) return
        setLoadingMessages(false)
        if (loadError) setError("Не удалось загрузить сообщения")
        else {
          stickToBottomRef.current = true
          setMessages((data ?? []).reverse())
        }
      })

    return () => {
      cancelled = true
    }
  }, [chatId, supabase])

  // Only when another chat is opened, not on every title update.
  useEffect(() => {
    if (selectedChat) setMode(selectedChat.ai_mode)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId])

  useEffect(() => {
    const element = scrollRef.current
    if (element && stickToBottomRef.current) element.scrollTop = element.scrollHeight
  }, [messages, streamingText, isBusy])

  const handleScroll = () => {
    const element = scrollRef.current
    if (!element) return
    stickToBottomRef.current = element.scrollHeight - element.scrollTop - element.clientHeight < 80
  }

  const runAnswer = useCallback(
    async (targetChatId: string, regenerate: boolean) => {
      const controller = new AbortController()
      abortRef.current = controller
      setIsBusy(true)
      setStreamingText("")
      setTruncated(false)
      setError(null)
      stickToBottomRef.current = true

      let partial = ""
      try {
        const result = await streamChatAnswer({
          chatId: targetChatId,
          mode,
          regenerate,
          signal: controller.signal,
          onText: (text) => {
            partial = text
            setStreamingText(text)
          },
        })
        if (result.text.trim()) {
          setMessages((previous) => [...previous, localMessage(targetChatId, "assistant", result.text, result.messageId)])
        }
        setTruncated(result.truncated)
        if (result.error) setError(result.error)
      } catch (requestError) {
        if (controller.signal.aborted) {
          // The server saves the unfinished answer; show the same text here.
          if (partial.trim()) setMessages((previous) => [...previous, localMessage(targetChatId, "assistant", partial)])
        } else {
          setError(requestError instanceof ChatRequestError ? requestError.message : "Нет связи с сервером")
        }
      } finally {
        if (abortRef.current === controller) abortRef.current = null
        setStreamingText("")
        setIsBusy(false)
      }
    },
    [mode],
  )

  const sendMessage = useCallback(
    async (text: string) => {
      const content = text.trim()
      if (!content || isBusy) return
      if (!privacyConfirmed) {
        setError("Отметьте, что в тексте нет личных данных учеников")
        return
      }

      setInput("")
      setError(null)
      let chat = selectedChat

      try {
        if (!chat) {
          const { data, error: createError } = await supabase
            .from("chats")
            .insert({ user_id: user.id, title: makeTitle(content), ai_mode: mode })
            .select()
            .single()
          if (createError || !data) throw createError ?? new Error("chat not created")
          chat = data
        }

        const { data: saved, error: insertError } = await supabase
          .from("messages")
          .insert({ chat_id: chat.id, role: "user", content })
          .select()
          .single()
        if (insertError || !saved) throw insertError ?? new Error("message not saved")

        if (chat !== selectedChat) {
          ownNewChatIdRef.current = chat.id
          onChatCreated(chat)
          setMessages([saved])
        } else {
          setMessages((previous) => [...previous, saved])
          const title = messages.length === 0 ? makeTitle(content) : chat.title
          onChatUpdate({ ...chat, title, updated_at: new Date().toISOString() })
          if (title !== chat.title) await supabase.from("chats").update({ title }).eq("id", chat.id)
        }
      } catch {
        setInput(content)
        setError("Не удалось сохранить сообщение. Проверьте соединение")
        return
      }

      await runAnswer(chat.id, false)
    },
    [isBusy, privacyConfirmed, selectedChat, supabase, user.id, mode, runAnswer, onChatCreated, onChatUpdate, messages.length],
  )

  // A tool form opened this chat with a ready prompt: send it once history is loaded.
  useEffect(() => {
    if (!pendingAutoSend || loadingMessages || !privacyConfirmed || !input.trim() || isBusy) return
    setPendingAutoSend(false)
    void sendMessage(input)
  }, [pendingAutoSend, loadingMessages, privacyConfirmed, input, isBusy, sendMessage])

  const stop = useCallback(() => abortRef.current?.abort(), [])

  const regenerate = useCallback(() => {
    if (!chatId || isBusy) return
    setMessages((previous) => (previous.at(-1)?.role === "assistant" ? previous.slice(0, -1) : previous))
    void runAnswer(chatId, true)
  }, [chatId, isBusy, runAnswer])

  const changeMode = useCallback(
    async (value: string) => {
      const next = value as AIModeKey
      setMode(next)
      if (!selectedChat) return
      const { data } = await supabase.from("chats").update({ ai_mode: next }).eq("id", selectedChat.id).select().single()
      if (data) onChatUpdate(data)
    },
    [selectedChat, supabase, onChatUpdate],
  )

  const lastMessage = messages.at(-1)
  const exportTitle = selectedChat?.title ?? "AIvera"

  const sidebarButton = !isSidebarOpen && (
    <Button variant="ghost" size="icon" onClick={onToggleSidebar} className="size-8 lg:hidden" aria-label="Открыть список чатов">
      <PanelLeft className="size-4" />
    </Button>
  )

  const errorBanner = error && (
    <div role="alert" className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
      <AlertCircle className="mt-0.5 size-4 shrink-0" />
      <p className="flex-1">{error}</p>
      <button type="button" onClick={() => setError(null)} aria-label="Скрыть" className="opacity-70 hover:opacity-100">
        <X className="size-4" />
      </button>
    </div>
  )

  const composer = (
    <div className="shrink-0 border-t bg-background px-3 py-3 sm:px-4">
      <Composer
        value={input}
        onChange={setInput}
        onSend={() => sendMessage(input)}
        onStop={stop}
        isBusy={isBusy}
        privacyConfirmed={privacyConfirmed}
        onPrivacyChange={setPrivacyConfirmed}
      />
    </div>
  )

  const modeSelect = (
    <Select value={mode} onValueChange={changeMode}>
      <SelectTrigger className="h-8 w-[170px] text-sm" aria-label="Режим ассистента">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(AI_MODES).map(([key, config]) => (
          <SelectItem key={key} value={key}>
            {config.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )

  if (!selectedChat) {
    return (
      <div className="flex h-full min-w-0 flex-1 flex-col bg-background">
        <header className="flex h-14 shrink-0 items-center gap-2 px-3 sm:px-4">
          {sidebarButton}
          <div className="ml-auto">{modeSelect}</div>
        </header>
        <div className="flex-1 overflow-y-auto px-4">
          <div className="rise-in mx-auto max-w-3xl py-8 sm:py-14">
            <h1 className="font-serif text-3xl font-medium tracking-[-0.01em] sm:text-4xl">
              Что готовим <span className="chalk">к уроку</span>
            </h1>
            <p className="mt-3 text-muted-foreground">Выберите форму или напишите задачу своими словами внизу</p>

            {errorBanner && <div className="mt-6">{errorBanner}</div>}

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {TOOLS.map((tool) => (
                <Link
                  key={tool.slug}
                  href={`/tools/${tool.slug}`}
                  className="group flex gap-4 rounded-xl border bg-card p-4 transition-colors hover:border-ring/40 hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  <ToolIcon slug={tool.slug} boxed />
                  <span className="min-w-0">
                    <span className="flex items-center gap-1 font-medium">
                      {tool.title}
                      <ArrowRight className="size-3.5 text-primary opacity-0 transition-[opacity,transform] duration-150 group-hover:translate-x-0.5 group-hover:opacity-100" />
                    </span>
                    <span className="mt-1 block text-sm leading-5 text-muted-foreground">{tool.summary}</span>
                  </span>
                </Link>
              ))}
            </div>

            <h2 className="mt-10 text-sm text-muted-foreground">Или начните с вопроса</h2>
            <ul className="mt-3 divide-y rounded-xl border bg-card">
              {[
                "Объясни дроби для 5 класса через пример с пиццей",
                "Придумай разминку на 5 минут для урока английского",
                "Как провести родительское собрание, если класс отстаёт",
              ].map((suggestion) => (
                <li key={suggestion}>
                  <button
                    type="button"
                    onClick={() => setInput(suggestion)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors first:rounded-t-xl last:rounded-b-xl hover:bg-accent/50"
                  >
                    <MessageSquareText className="size-4 shrink-0 text-muted-foreground" />
                    {suggestion}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
        {composer}
      </div>
    )
  }

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col bg-background">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-3 sm:px-4">
        {sidebarButton}
        <h1 className="min-w-0 flex-1 truncate font-medium">{selectedChat.title}</h1>
        {modeSelect}
      </header>

      <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-4">
        <div className="mx-auto max-w-3xl space-y-8 py-8">
          {loadingMessages && messages.length === 0 && <TypingIndicator />}

          {messages.map((message, index) => (
            <MessageItem
              key={message.id}
              role={message.role}
              content={message.content}
              exportTitle={exportTitle}
              userInitial={(user.email ?? "?").slice(0, 1)}
              canRegenerate={index === messages.length - 1 && !isBusy}
              onRegenerate={regenerate}
            />
          ))}

          {isBusy &&
            (streamingText ? (
              <MessageItem role="assistant" content={streamingText} exportTitle={exportTitle} streaming />
            ) : (
              <TypingIndicator />
            ))}

          {truncated && !isBusy && lastMessage?.role === "assistant" && (
            <div className="flex flex-wrap items-center gap-3 rounded-md border bg-muted/50 px-3 py-2 text-sm">
              <span className="text-muted-foreground">Ответ не поместился целиком.</span>
              <Button size="sm" variant="outline" className="h-7" onClick={() => sendMessage(CONTINUE_PROMPT)}>
                Продолжить
              </Button>
            </div>
          )}

          {errorBanner}
        </div>
      </div>

      {composer}
    </div>
  )
}
