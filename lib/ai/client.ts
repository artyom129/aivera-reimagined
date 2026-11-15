import type { AIModeKey } from "@/lib/ai-config"
import { createLineSplitter, parseEventLine } from "@/lib/ai/stream"

export type StreamResult = {
  text: string
  messageId: string | null
  truncated: boolean
  error: string | null
}

type StreamOptions = {
  chatId: string
  mode: AIModeKey
  regenerate?: boolean
  signal: AbortSignal
  onText: (fullText: string) => void
}

export class ChatRequestError extends Error {}

export async function streamChatAnswer({ chatId, mode, regenerate = false, signal, onText }: StreamOptions) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chatId, mode, regenerate, privacyConfirmed: true }),
    signal,
  })

  if (!response.ok || !response.body) {
    const body = await response.json().catch(() => ({}))
    throw new ChatRequestError(body.error || "Не удалось получить ответ")
  }

  const result: StreamResult = { text: "", messageId: null, truncated: false, error: null }
  const splitter = createLineSplitter((line) => {
    const event = parseEventLine(line)
    if (!event) return
    if (event.type === "text") {
      result.text += event.text
      onText(result.text)
    } else if (event.type === "error") {
      result.error = event.message
    } else {
      result.messageId = event.messageId
      result.truncated = event.truncated
    }
  })

  const reader = response.body.getReader()
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    splitter.push(value)
  }
  splitter.flush()

  return result
}
