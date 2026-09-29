import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { getModeConfig, isMessageSafe, type AIModeKey } from "@/lib/ai-config"
import { DEFAULT_AI_MODEL_ID, getApiModelById, isAiModelId } from "@/lib/constants"

const requestSchema = z.object({
  chatId: z.string().uuid(),
  mode: z.enum(["default", "lesson_plan", "tests", "feedback"]).default("default"),
  privacyConfirmed: z.literal(true),
})

const MAX_CONTEXT_CHARS = 120_000
const MAX_MESSAGE_CHARS = 12_000
const IMAGE_PATTERN = /!\[[^\]]*\]\(data:image\/[^)]+\)/gi
const FILE_BLOCK_PATTERN = /\s*\[File:\s*[^\]]+\]\s*```[\s\S]*?```/gi

function sanitizeForGemini(text: string) {
  return text
    .replace(IMAGE_PATTERN, "")
    .replace(FILE_BLOCK_PATTERN, "")
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[email скрыт]")
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi, "[идентификатор скрыт]")
    .replace(/\b(?:\d[ -]*?){13,19}\b/g, "[номер скрыт]")
    .replace(/(?:\+?\d[\s().-]*){10,12}/g, "[телефон скрыт]")
    .trim()
    .slice(0, MAX_MESSAGE_CHARS)
}

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status })
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return jsonError("Сервер не настроен: отсутствует GEMINI_API_KEY", 503)

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return jsonError("Unauthorized", 401)

  const parsed = requestSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return jsonError("Подтвердите отправку очищенного текста в Gemini", 400)

  const [profileResult, chatResult] = await Promise.all([
    supabase
      .from("users")
      .select("is_blocked, blocked_reason, token_limit, tokens_used")
      .eq("id", user.id)
      .single(),
    supabase
      .from("chats")
      .select("id")
      .eq("id", parsed.data.chatId)
      .eq("user_id", user.id)
      .maybeSingle(),
  ])
  const { data: profile, error: profileError } = profileResult
  if (profileError || !profile) return jsonError("Профиль пользователя не найден", 403)
  if (profile.is_blocked) return jsonError(profile.blocked_reason || "Аккаунт заблокирован", 403)
  if (profile.token_limit > 0 && profile.tokens_used >= profile.token_limit) {
    return jsonError("Лимит токенов исчерпан", 429)
  }

  const { data: chat, error: chatError } = chatResult
  if (chatError) return jsonError("Не удалось проверить чат", 503)
  if (!chat) return jsonError("Чат не найден", 404)

  const { data: allowed, error: rateLimitError } = await supabase.rpc("claim_ai_request", { p_limit: 12 })
  if (rateLimitError) return jsonError("Не удалось проверить лимит запросов", 503)
  if (!allowed) return jsonError("Слишком много запросов. Попробуйте через минуту", 429)

  const [messagesResult, settingResult] = await Promise.all([
    supabase
      .from("messages")
      .select("role, content")
      .eq("chat_id", chat.id)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("app_settings")
      .select("value")
      .eq("key", "default_ai_model")
      .maybeSingle(),
  ])
  const { data: rows, error: messagesError } = messagesResult
  if (messagesError) return jsonError("Не удалось загрузить историю чата", 500)

  const messages = (rows || [])
    .reverse()
    .filter((message) => message.role === "user" || message.role === "assistant")
    .map((message) => ({ role: message.role, text: sanitizeForGemini(message.content || "") }))
    .filter((message) => message.text.length > 0)
  if (messages.length === 0) return jsonError("Введите текстовое сообщение", 400)

  const contextSize = messages.reduce((sum, message) => sum + message.text.length, 0)
  if (contextSize > MAX_CONTEXT_CHARS) return jsonError("История чата слишком большая", 413)

  const lastUserMessage = [...messages].reverse().find((message) => message.role === "user")
  if (lastUserMessage && !isMessageSafe(lastUserMessage.text)) {
    return jsonError("Я не могу помочь с этим запросом. Попробуйте сформулировать безопасную учебную задачу", 400)
  }

  const { data: setting } = settingResult
  const modelId = isAiModelId(setting?.value) ? setting.value : DEFAULT_AI_MODEL_ID
  const apiModel = getApiModelById(modelId)
  const modeConfig = getModeConfig(parsed.data.mode as AIModeKey)
  const contents = messages.map((message) => ({
    role: message.role === "assistant" ? "model" : "user",
    parts: [{ text: message.text }],
  }))

  const fallbackModel = getApiModelById(DEFAULT_AI_MODEL_ID)
  let activeApiModel = apiModel
  const geminiSignal = AbortSignal.any([request.signal, AbortSignal.timeout(60_000)])
  const requestGemini = (model: string) =>
    fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: modeConfig.systemPrompt }] },
          contents,
          generationConfig: { temperature: modeConfig.temperature, maxOutputTokens: modeConfig.maxTokens },
        }),
        signal: geminiSignal,
      },
    )

  let upstream: Response
  try {
    upstream = await requestGemini(activeApiModel)
    if (
      activeApiModel !== fallbackModel &&
      (upstream.status === 429 || upstream.status === 503)
    ) {
      await upstream.body?.cancel()
      activeApiModel = fallbackModel
      upstream = await requestGemini(activeApiModel)
    }
  } catch (error) {
    if (!request.signal.aborted) console.error("Gemini connection failed", error)
    return jsonError("Gemini не ответил вовремя. Попробуйте ещё раз", 504)
  }

  if (!upstream.ok || !upstream.body) {
    const details = await upstream.text().catch(() => "")
    console.error("Gemini request failed", upstream.status, details.slice(0, 300))
    return jsonError("Сервис Gemini временно недоступен", 502)
  }

  const reader = upstream.body.getReader()
  const decoder = new TextDecoder()
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      let buffer = ""
      let totalTokens = 0

      const processLine = (line: string) => {
        if (!line.startsWith("data: ")) return
        const payload = line.slice(6).trim()
        if (!payload) return
        try {
          const event = JSON.parse(payload)
          totalTokens = event.usageMetadata?.totalTokenCount ?? totalTokens
          const text = event.candidates?.[0]?.content?.parts
            ?.map((part: { text?: string }) => part.text || "")
            .join("")
          if (text) controller.enqueue(encoder.encode(`0:${JSON.stringify(text)}\n`))
        } catch {
          // Partial SSE records remain buffered; malformed complete records are ignored.
        }
      }

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split("\n")
          buffer = lines.pop() || ""
          lines.forEach(processLine)
        }
        buffer += decoder.decode()
        if (buffer) processLine(buffer)
      } catch (error) {
        if (!request.signal.aborted) {
          console.error("Gemini stream failed", error)
          controller.enqueue(encoder.encode(`e:${JSON.stringify("Соединение с Gemini прервалось")}\n`))
        }
      } finally {
        if (totalTokens > 0) {
          const { error } = await supabase.rpc("record_ai_usage", {
            p_model: activeApiModel,
            p_tokens: totalTokens,
          })
          if (error) console.error("Usage accounting failed", error.message)
        }
        controller.close()
      }
    },
    cancel() {
      return reader.cancel()
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Content-Type-Options": "nosniff",
    },
  })
}
