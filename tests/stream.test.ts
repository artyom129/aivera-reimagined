import { describe, expect, it } from "vitest"
import { createLineSplitter, encodeEvent, parseEventLine, parseGeminiSseLine } from "@/lib/ai/stream"

describe("chat line protocol", () => {
  it("round-trips every event type", () => {
    const events = [
      { type: "text", text: "Привет,\nмир" },
      { type: "error", message: "Gemini недоступен" },
      { type: "done", messageId: "abc", truncated: true, stopped: false },
    ] as const

    for (const event of events) {
      expect(parseEventLine(encodeEvent(event).trimEnd())).toEqual(event)
    }
  })

  it("ignores garbage", () => {
    expect(parseEventLine("")).toBeNull()
    expect(parseEventLine("0:{not json")).toBeNull()
    expect(parseEventLine("x:\"?\"")).toBeNull()
  })
})

describe("createLineSplitter", () => {
  it("joins lines split across chunks, including multi-byte characters", () => {
    const lines: string[] = []
    const splitter = createLineSplitter((line) => lines.push(line))
    const bytes = new TextEncoder().encode("первая\r\nвто")
    splitter.push(bytes.slice(0, 3)) // cuts "п" in half
    splitter.push(bytes.slice(3))
    splitter.push(new TextEncoder().encode("рая\nхвост"))
    splitter.flush()
    expect(lines).toEqual(["первая", "вторая", "хвост"])
  })
})

describe("parseGeminiSseLine", () => {
  it("reads text, tokens and finish reason", () => {
    const line =
      'data: {"candidates":[{"content":{"parts":[{"text":"План"},{"text":" урока"}]},"finishReason":"MAX_TOKENS"}],"usageMetadata":{"totalTokenCount":42}}'
    expect(parseGeminiSseLine(line)).toEqual({ text: "План урока", totalTokens: 42, finishReason: "MAX_TOKENS" })
  })

  it("skips thought parts", () => {
    const line = 'data: {"candidates":[{"content":{"parts":[{"text":"думаю...","thought":true},{"text":"Ответ"}]}}]}'
    expect(parseGeminiSseLine(line)?.text).toBe("Ответ")
  })

  it("ignores non-data lines and broken json", () => {
    expect(parseGeminiSseLine(": keep-alive")).toBeNull()
    expect(parseGeminiSseLine("data: {")).toBeNull()
  })
})
