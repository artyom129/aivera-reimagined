"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import Link from "next/link"
import type { User } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle, BookOpen, ClipboardCheck, FileText, PanelLeft, Send, Sparkles } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { Database } from "@/lib/types/database"
import { cn } from "@/lib/utils"
import { AI_MODES, type AIModeKey } from "@/lib/ai-config"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MarkdownMessage } from "@/components/chat/markdown-message"
import {
  CHAT_AUTOSEND_STORAGE_KEY,
  CHAT_DRAFT_STORAGE_KEY,
  MESSAGES_PER_PAGE,
} from "@/lib/constants"

interface ChatAreaProps {
  user: User
  selectedChat: Chat | undefined
  onChatUpdate: (chat: Chat) => void
  onChatCreated: (chat: Chat) => void
  isSidebarOpen: boolean
  onToggleSidebar: () => void
  userProfile: UserProfile | null
}

export function ChatArea({ user, selectedChat, onChatUpdate, onChatCreated, isSidebarOpen, onToggleSidebar }: ChatAreaProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [streamingMessage, setStreamingMessage] = useState("")
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const supabase = useMemo(() => createClient(), [])
  const [selectedMode, setSelectedMode] = useState<AIModeKey>("default")
  const [privacyConfirmed, setPrivacyConfirmed] = useState(false)
  const [autoSendPending, setAutoSendPending] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const activeRequestChatIdRef = useRef<string | null>(null)

  useEffect(() => {
    let isCurrent = true
    const nextChatId = selectedChat?.id ?? null

    if (activeRequestChatIdRef.current && activeRequestChatIdRef.current !== nextChatId) {
      abortControllerRef.current?.abort()
      abortControllerRef.current = null
      activeRequestChatIdRef.current = null
      setIsLoading(false)
      setStreamingMessage("")
    }

    if (selectedChat) {
      setSelectedMode(selectedChat.ai_mode)
      const draft = sessionStorage.getItem(CHAT_DRAFT_STORAGE_KEY)
      if (draft) {
        setInput(draft)
        sessionStorage.removeItem(CHAT_DRAFT_STORAGE_KEY)
        if (sessionStorage.getItem(CHAT_AUTOSEND_STORAGE_KEY) === "1") {
          sessionStorage.removeItem(CHAT_AUTOSEND_STORAGE_KEY)
          setPrivacyConfirmed(true)
          setAutoSendPending(true)
        }
      }

      const loadMessages = async () => {
        const { data, error } = await supabase
          .from("messages")
          .select("*")
          .eq("chat_id", selectedChat.id)
          .order("created_at", { ascending: false })
          .limit(MESSAGES_PER_PAGE)

        if (!isCurrent) return
        if (error) {
          setError("Не удалось загрузить сообщения этого чата")
        } else if (data) {
          setMessages([...data].reverse())
        }
      }
      loadMessages()
      setError(null)
    } else {
      setMessages([])
    }

    return () => {
      isCurrent = false
    }
  }, [selectedChat, supabase])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages.length, streamingMessage])

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return
    if (!privacyConfirmed) {
      setError("Подтвердите, что в сообщении нет личных данных")
      return
    }

    const userMessage = input.trim()
    const messageContent = userMessage

    setInput("")
    setIsLoading(true)
    setError(null)
    setStreamingMessage("")

    const abortController = new AbortController()
    abortControllerRef.current = abortController
    let messageSaved = false
    let createdChatId: string | null = null

    try {
      let activeChat = selectedChat
      if (!activeChat) {
        const { data: createdChat, error: createChatError } = await supabase
          .from("chats")
          .insert({
            user_id: user.id,
            title: userMessage.slice(0, 50) + (userMessage.length > 50 ? "..." : ""),
            ai_mode: selectedMode,
          })
          .select()
          .single()

        if (createChatError) throw createChatError
        activeChat = createdChat
        createdChatId = createdChat.id
      }
      activeRequestChatIdRef.current = activeChat.id

      const { data: newMessage, error: insertError } = await supabase
        .from("messages")
        .insert({
          chat_id: activeChat.id,
          role: "user",
          content: messageContent,
        })
        .select()
        .single()

      if (insertError) {
        if (createdChatId) await supabase.from("chats").delete().eq("id", createdChatId)
        throw insertError
      }
      messageSaved = true

      if (newMessage) {
        setMessages((prev) => [...prev, newMessage])
      }

      if (createdChatId) {
        onChatCreated(activeChat)
      } else if (messages.length === 0) {
        const title = userMessage.slice(0, 50) + (userMessage.length > 50 ? "..." : "")
        const { data: updatedChat } = await supabase
          .from("chats")
          .update({ title, updated_at: new Date().toISOString() })
          .eq("id", activeChat.id)
          .select()
          .single()

        if (updatedChat) {
          onChatUpdate(updatedChat)
        }
      } else {
        onChatUpdate({ ...activeChat, updated_at: new Date().toISOString() })
      }

      if (abortController.signal.aborted) throw new Error("AbortError")

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatId: activeChat.id,
          mode: selectedMode,
          privacyConfirmed: true,
        }),
        signal: abortController.signal,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Не удалось получить ответ Gemini")
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let fullResponse = ""
      let streamBuffer = ""
      let streamError: string | null = null

      if (reader) {
        const processLine = (line: string) => {
          if (line.startsWith("e:")) {
            try {
              const content = JSON.parse(line.slice(2))
              if (typeof content === "string") streamError = content
            } catch {
              streamError = "Соединение с Gemini прервалось"
            }
            return
          }
          if (!line.startsWith("0:")) return
          try {
            const content = JSON.parse(line.slice(2))
            if (typeof content === "string") {
              fullResponse += content
              setStreamingMessage(fullResponse)
            }
          } catch {
            // A malformed complete record is ignored; partial records stay buffered.
          }
        }

        while (true) {
          if (abortController.signal.aborted) {
            reader.cancel()
            break
          }

          const { done, value } = await reader.read()
          if (done) break

          streamBuffer += decoder.decode(value, { stream: true })
          const lines = streamBuffer.split("\n")
          streamBuffer = lines.pop() || ""
          lines.forEach(processLine)
        }

        streamBuffer += decoder.decode()
        if (streamBuffer) processLine(streamBuffer)
      }

      if (streamError) throw new Error(streamError)
      if (!fullResponse && !abortController.signal.aborted) {
        throw new Error("Gemini вернул пустой ответ. Попробуйте ещё раз")
      }

      if (!abortController.signal.aborted) {
        const { data: aiMessage, error: aiInsertError } = await supabase
          .from("messages")
          .insert({
            chat_id: activeChat.id,
            role: "assistant",
            content: fullResponse,
          })
          .select()
          .single()

        if (aiInsertError) throw aiInsertError
        if (aiMessage) {
          setMessages((prev) => [...prev, aiMessage])
        }
      }

      setStreamingMessage("")
      setIsLoading(false)
      setPrivacyConfirmed(false)
      abortControllerRef.current = null
      activeRequestChatIdRef.current = null
    } catch (err: unknown) {
      const requestError = err instanceof Error ? err : new Error("Не удалось отправить сообщение")
      if (requestError.name === "AbortError" || requestError.message === "AbortError") {
        setError("Генерация остановлена")
      } else {
        setError(requestError.message)
      }
      if (!messageSaved) setInput(userMessage)
      setIsLoading(false)
      setStreamingMessage("")
      abortControllerRef.current = null
      activeRequestChatIdRef.current = null
    }
  }, [
    input,
    selectedChat,
    isLoading,
    privacyConfirmed,
    supabase,
    user.id,
    selectedMode,
    messages.length,
    onChatCreated,
    onChatUpdate,
  ])

  useEffect(() => {
    if (!autoSendPending || !selectedChat || !input.trim() || !privacyConfirmed || isLoading) return
    setAutoSendPending(false)
    void handleSend()
  }, [autoSendPending, handleSend, input, isLoading, privacyConfirmed, selectedChat])

  const handleStopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
      activeRequestChatIdRef.current = null
    }
    setIsLoading(false)
    setStreamingMessage("")
  }, [])

  const handleCopyMessage = useCallback((content: string) => {
    navigator.clipboard.writeText(content)
  }, [])

  const handleModeChange = useCallback(
    async (value: string) => {
      const mode = value as AIModeKey
      setSelectedMode(mode)
      if (!selectedChat) return

      const { data } = await supabase
        .from("chats")
        .update({ ai_mode: mode })
        .eq("id", selectedChat.id)
        .select()
        .single()

      if (data) onChatUpdate(data)
    },
    [onChatUpdate, selectedChat, supabase],
  )

  const renderedMessages = useMemo(
    () =>
      messages.map((message) => (
        <div
          key={message.id}
          className={cn("flex gap-3 group", message.role === "user" ? "justify-end" : "justify-start")}
        >
          {message.role === "assistant" && (
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary">
              <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
          )}
          <div className="flex flex-col gap-2 max-w-[85%] sm:max-w-[75%]">
            <div
              className={cn(
                "rounded-3xl px-4 py-3",
                message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
              )}
            >
              <MarkdownMessage content={message.content} isUser={message.role === "user"} />
            </div>
            <button
              onClick={() => handleCopyMessage(message.content)}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 self-end"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              Копировать
            </button>
          </div>
          {message.role === "user" && (
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
              <span className="text-xs font-medium">{user.email?.[0].toUpperCase()}</span>
            </div>
          )}
        </div>
      )),
    [messages, user.email, handleCopyMessage],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend],
  )

  const handleQuickStart = useCallback(
    async (mode: AIModeKey, title: string, draft: string) => {
      setError(null)
      const { data: chat, error: createError } = await supabase
        .from("chats")
        .insert({
          user_id: user.id,
          title,
          ai_mode: mode,
        })
        .select()
        .single()

      if (createError || !chat) {
        setError("Не удалось открыть AI-инструмент")
        return
      }

      sessionStorage.setItem(CHAT_DRAFT_STORAGE_KEY, draft)
      onChatCreated(chat)
    },
    [onChatCreated, supabase, user.id],
  )

  if (!selectedChat) {
    return (
      <div className="flex h-full w-full flex-col overflow-hidden bg-background">
        {!isSidebarOpen && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-4 z-10 rounded-full"
            onClick={onToggleSidebar}
          >
            <PanelLeft className="h-5 w-5" />
          </Button>
        )}

        <div className="flex flex-1 overflow-y-auto px-4 py-8">
          <div className="m-auto w-full max-w-3xl">
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                <Sparkles className="h-6 w-6" />
              </div>
              <h2 className="mt-5 text-2xl font-bold tracking-tight sm:text-3xl">Что подготовим сегодня?</h2>
              <p className="mt-2 text-sm text-muted-foreground">Выберите готовый инструмент или задайте свой вопрос</p>
            </div>

            {error && (
              <div className="mt-5 flex items-center gap-2 rounded-2xl bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              <Link
                href="/lesson-plan"
                className="group rounded-2xl border bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <BookOpen className="h-5 w-5 text-primary" />
                </span>
                <p className="mt-4 font-semibold">План урока</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">Структура, тайминг и оценивание</p>
              </Link>

              <button
                type="button"
                onClick={() =>
                  handleQuickStart(
                    "tests",
                    "Новый тест",
                    "Помоги создать тест. Сначала уточни у меня предмет, тему, класс, количество вопросов и желаемую сложность.",
                  )
                }
                className="group rounded-2xl border bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <ClipboardCheck className="h-5 w-5 text-primary" />
                </span>
                <p className="mt-4 font-semibold">Создать тест</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">Вопросы, варианты и ответы</p>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleQuickStart(
                    "feedback",
                    "Проверка работы",
                    "Помоги подготовить обратную связь к работе ученика. Сначала уточни класс, предмет, критерии оценки и желаемый тон комментария. Не запрашивай персональные данные ученика.",
                  )
                }
                className="group rounded-2xl border bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </span>
                <p className="mt-4 font-semibold">Проверить работу</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">Комментарий и рекомендации</p>
              </button>
            </div>
          </div>
        </div>

        <div className="shrink-0 border-t p-3 sm:p-4 bg-background">
          <div className="mx-auto max-w-3xl w-full">
            <div className="relative flex items-end gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Сообщение..."
                className="min-h-[52px] max-h-[200px] w-full resize-none pr-12 bg-background border text-sm rounded-3xl"
                disabled={isLoading}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || !privacyConfirmed || isLoading}
                size="icon"
                className="absolute bottom-2 right-2 h-8 w-8 rounded-full"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-2 text-center text-xs text-muted-foreground">AIvera может допускать ошибки</p>
            <label className="mt-2 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={privacyConfirmed}
                onChange={(event) => setPrivacyConfirmed(event.target.checked)}
              />
              В тексте нет личных данных; отправить очищенный текст в Google Gemini
            </label>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-background">
      <div className="shrink-0 flex items-center gap-3 border-b px-3 sm:px-4 py-3 bg-background">
        {!isSidebarOpen && (
          <Button variant="ghost" size="icon" onClick={onToggleSidebar} className="h-9 w-9 rounded-full">
            <PanelLeft className="h-4 w-4" />
          </Button>
        )}
        <h2 className="text-base font-semibold truncate flex-1">{selectedChat?.title || "Новый чат"}</h2>
        <Select value={selectedMode} onValueChange={handleModeChange}>
          <SelectTrigger className="h-9 w-[140px] rounded-full text-sm sm:w-[180px]">
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
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 sm:px-4 w-full">
        <div className="mx-auto max-w-3xl w-full space-y-4 py-6">
          {error && (
            <div className="flex items-center gap-2 rounded-2xl bg-destructive/10 p-4 text-destructive">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {renderedMessages}

          {streamingMessage && (
            <div className="flex gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary">
                <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
              <div className="max-w-[85%] sm:max-w-[75%] rounded-3xl bg-muted px-4 py-3 break-words">
                <MarkdownMessage content={streamingMessage} isUser={false} />
              </div>
            </div>
          )}

          {isLoading && !streamingMessage && (
            <div className="flex gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary">
                <Sparkles className="h-3.5 w-3.5 animate-pulse text-primary-foreground" />
              </div>
              <div className="max-w-[85%] sm:max-w-[75%] rounded-3xl bg-muted px-4 py-3">
                <p className="text-sm text-muted-foreground">Печатает...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 border-t p-3 sm:p-4 bg-background">
        <div className="mx-auto max-w-3xl w-full">
          <div className="relative flex items-end gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Сообщение..."
              className="min-h-[52px] max-h-[200px] w-full resize-none pr-12 bg-background border text-sm rounded-3xl"
              disabled={isLoading}
            />
            {isLoading ? (
              <Button
                onClick={handleStopGeneration}
                size="icon"
                variant="destructive"
                className="absolute bottom-2 right-2 h-8 w-8 rounded-full"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              </Button>
            ) : (
              <Button
                onClick={handleSend}
                disabled={!input.trim() || !privacyConfirmed}
                size="icon"
                className="absolute bottom-2 right-2 h-8 w-8 rounded-full"
              >
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
          <p className="mt-2 text-center text-xs text-muted-foreground">AIvera может допускать ошибки</p>
          <label className="mt-2 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={privacyConfirmed}
              onChange={(event) => setPrivacyConfirmed(event.target.checked)}
            />
            В тексте нет личных данных; отправить очищенный текст в Google Gemini
          </label>
        </div>
      </div>
    </div>
  )
}

type Chat = Database["public"]["Tables"]["chats"]["Row"]
type Message = Database["public"]["Tables"]["messages"]["Row"]
type UserProfile = Database["public"]["Tables"]["users"]["Row"]
