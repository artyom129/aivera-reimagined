// Line protocol between /api/chat and the browser:
//   0:"chunk of text"
//   e:"error message"
//   d:{"messageId":"…","truncated":false,"stopped":false}

export type ChatStreamEvent =
  | { type: "text"; text: string }
  | { type: "error"; message: string }
  | { type: "done"; messageId: string | null; truncated: boolean; stopped: boolean }

export function encodeEvent(event: ChatStreamEvent): string {
  switch (event.type) {
    case "text":
      return `0:${JSON.stringify(event.text)}\n`
    case "error":
      return `e:${JSON.stringify(event.message)}\n`
    case "done":
      return `d:${JSON.stringify({
        messageId: event.messageId,
        truncated: event.truncated,
        stopped: event.stopped,
      })}\n`
  }
}

export function parseEventLine(line: string): ChatStreamEvent | null {
  const prefix = line.slice(0, 2)
  const body = line.slice(2)
  if (!body) return null

  try {
    const value = JSON.parse(body)
    if (prefix === "0:" && typeof value === "string") return { type: "text", text: value }
    if (prefix === "e:" && typeof value === "string") return { type: "error", message: value }
    if (prefix === "d:" && value && typeof value === "object") {
      return {
        type: "done",
        messageId: typeof value.messageId === "string" ? value.messageId : null,
        truncated: value.truncated === true,
        stopped: value.stopped === true,
      }
    }
  } catch {
    // broken line, skip it
  }
  return null
}

// Splits a byte stream into complete lines; the tail waits for the next chunk.
export function createLineSplitter(onLine: (line: string) => void) {
  const decoder = new TextDecoder()
  let buffer = ""

  return {
    push(chunk: Uint8Array) {
      buffer += decoder.decode(chunk, { stream: true })
      const lines = buffer.split("\n")
      buffer = lines.pop() ?? ""
      for (const line of lines) onLine(line.replace(/\r$/, ""))
    },
    flush() {
      buffer += decoder.decode()
      if (buffer) onLine(buffer.replace(/\r$/, ""))
      buffer = ""
    },
  }
}

export type GeminiChunk = {
  text: string
  totalTokens: number | null
  finishReason: string | null
}

// One `data: {...}` record from Gemini's streamGenerateContent?alt=sse.
export function parseGeminiSseLine(line: string): GeminiChunk | null {
  if (!line.startsWith("data:")) return null
  const payload = line.slice(5).trim()
  if (!payload) return null

  try {
    const event = JSON.parse(payload)
    const candidate = event.candidates?.[0]
    const parts: Array<{ text?: string; thought?: boolean }> = candidate?.content?.parts ?? []
    return {
      text: parts
        .filter((part) => !part.thought)
        .map((part) => part.text ?? "")
        .join(""),
      totalTokens: typeof event.usageMetadata?.totalTokenCount === "number" ? event.usageMetadata.totalTokenCount : null,
      finishReason: typeof candidate?.finishReason === "string" ? candidate.finishReason : null,
    }
  } catch {
    return null
  }
}

export const BLOCKED_FINISH_REASONS = new Set(["SAFETY", "PROHIBITED_CONTENT", "BLOCKLIST", "SPII", "RECITATION"])
