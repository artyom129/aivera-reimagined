import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { AI_MODE_KEYS, buildSystemPrompt, getModeConfig, type AppLanguage } from "@/lib/ai-config"
import { isMessageSafe } from "@/lib/ai/safety"
import { sanitizeForGemini } from "@/lib/ai/sanitize"
import { fitHistoryToBudget } from "@/lib/ai/history"
import {
  BLOCKED_FINISH_REASONS,
  createLineSplitter,
  encodeEvent,
  parseGeminiSseLine,
  type ChatStreamEvent,
} from "@/lib/ai/stream"
import { DEFAULT_AI_MODEL_ID, getApiModelById, isAiModelId } from "@/lib/constants"

export const dynamic = "force-dynamic"

const requestSchema = z.object({
  chatId: z.string().uuid(),
  mode: z.enum(AI_MODE_KEYS as [string, ...string[]]).default("default"),
  privacyConfirmed: z.literal(true),
  regenerate: z.boolean().default(false),
})

const HISTORY_LIMIT = 16
const CONTEXT_BUDGET_CHARS = 60_000
const REQUESTS_PER_MINUTE = 12
const GEMINI_TIMEOUT_MS = 90_000

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } })
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return jsonError("Сервер не настроен: нет GEMINI_API_KEY", 503)

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return jsonError("Войдите в аккаунт", 401)

  const parsed = requestSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return jsonError("Подтвердите отправку текста в Gemini", 400)
  const { chatId, regenerate } = parsed.data
  const mode = parsed.data.mode as (typeof AI_MODE_KEYS)[number]

  const [profileResult, chatResult] = await Promise.all([
    supabase.from("users").select("is_blocked, blocked_reason, language").eq("id", user.id).single(),
    supabase.from("chats").select("id").eq("id", chatId).eq("user_id", user.id).maybeSingle(),
  ])
  const profile = profileResult.data
  if (profileResult.error || !profile) return jsonError("Профиль не найден. Примените миграции Supabase", 403)
  if (profile.is_blocked) return jsonError(profile.blocked_reason || "Аккаунт заблокирован", 403)
  if (chatResult.error) return jsonError("Не удалось проверить чат", 503)
  if (!chatResult.data) return jsonError("Чат не найден", 404)

  const { data: claim, error: claimError } = await supabase.rpc("claim_ai_request", { p_limit: REQUESTS_PER_MINUTE })
  if (claimError) return jsonError("Не удалось проверить лимиты", 503)
  if (claim === "quota_exceeded") return jsonError("Месячный лимит токенов исчерпан. Обратитесь к администратору", 429)
  if (claim === "rate_limited") return jsonError("Слишком много запросов. Подождите минуту", 429)
  if (claim !== "ok") return jsonError("Запрос отклонён", 403)

  if (regenerate) {
    const { data: last } = await supabase
      .from("messages")
      .select("id, role")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
    if (last?.role === "assistant") {
      await supabase.from("messages").delete().eq("id", last.id)
    }
  }

  const [historyResult, settingResult] = await Promise.all([
    supabase
      .from("messages")
      .select("role, content")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: false })
      .limit(HISTORY_LIMIT),
    supabase.from("app_settings").select("value").eq("key", "default_ai_model").maybeSingle(),
  ])
  if (historyResult.error) return jsonError("Не удалось загрузить историю чата", 500)

  const history = fitHistoryToBudget(
    (historyResult.data ?? [])
      .reverse()
      .map((message) => ({ role: message.role, text: sanitizeForGemini(message.content ?? "") }))
      .filter((message) => message.text.length > 0),
    CONTEXT_BUDGET_CHARS,
  )
  const lastMessage = history.at(-1)
  if (!lastMessage || lastMessage.role !== "user") return jsonError("Сначала напишите сообщение", 400)
  if (!isMessageSafe(lastMessage.text)) {
    return jsonError("С этим запросом я помочь не могу. Попробуйте сформулировать учебную задачу", 400)
  }

  const settingValue = settingResult.data?.value
  const modelId = isAiModelId(settingValue) ? settingValue : DEFAULT_AI_MODEL_ID
  const modeConfig = getModeConfig(mode)
  const geminiBody = JSON.stringify({
    system_instruction: { parts: [{ text: buildSystemPrompt(mode, profile.language as AppLanguage) }] },
    contents: history.map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.text }],
    })),
    generationConfig: { temperature: modeConfig.temperature, maxOutputTokens: modeConfig.maxTokens },
  })

  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(GEMINI_TIMEOUT_MS)])
  const callGemini = (model: string) =>
    fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: geminiBody,
        signal,
      },
    )

  let model = getApiModelById(modelId)
  const fallbackModel = getApiModelById(DEFAULT_AI_MODEL_ID)
  let upstream: Response
  try {
    upstream = await callGemini(model)
    // The bigger model is often overloaded; the default one usually is not.
    if (model !== fallbackModel && (upstream.status === 429 || upstream.status === 503)) {
      await upstream.body?.cancel()
      model = fallbackModel
      upstream = await callGemini(model)
    }
  } catch (error) {
    if (!request.signal.aborted) console.error("Gemini connection failed", error)
    return jsonError("Gemini не ответил вовремя. Попробуйте ещё раз", 504)
  }

  if (!upstream.ok || !upstream.body) {
    const details = await upstream.text().catch(() => "")
    console.error("Gemini request failed", upstream.status, details.slice(0, 300))
    if (upstream.status === 429) return jsonError("Gemini перегружен. Попробуйте через минуту", 503)
    return jsonError("Сервис Gemini временно недоступен", 502)
  }

  const reader = upstream.body.getReader()
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      let clientGone = false
      const send = (event: ChatStreamEvent) => {
        if (clientGone) return
        try {
          controller.enqueue(encoder.encode(encodeEvent(event)))
        } catch {
          clientGone = true
        }
      }

      let answer = ""
      let totalTokens = 0
      let finishReason: string | null = null
      let failed = false

      const splitter = createLineSplitter((line) => {
        const chunk = parseGeminiSseLine(line)
        if (!chunk) return
        if (chunk.totalTokens) totalTokens = chunk.totalTokens
        if (chunk.finishReason) finishReason = chunk.finishReason
        if (chunk.text) {
          answer += chunk.text
          send({ type: "text", text: chunk.text })
        }
      })

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          splitter.push(value)
        }
        splitter.flush()
      } catch (error) {
        if (!request.signal.aborted) {
          failed = true
          console.error("Gemini stream failed", error)
        }
      }

      const stopped = request.signal.aborted
      let messageId: string | null = null

      if (answer.trim()) {
        // Saved here, not in the browser: the answer survives a closed tab or a switched chat.
        const { data: saved, error } = await supabase
          .from("messages")
          .insert({ chat_id: chatId, role: "assistant", content: answer })
          .select("id")
          .single()
        if (error) console.error("Saving the answer failed", error.message)
        messageId = saved?.id ?? null
      }

      if (totalTokens > 0) {
        const { error } = await supabase.rpc("record_ai_usage", { p_model: model, p_tokens: totalTokens })
        if (error) console.error("Usage accounting failed", error.message)
      }

      if (!answer.trim() && finishReason && BLOCKED_FINISH_REASONS.has(finishReason)) {
        send({ type: "error", message: "Gemini отказался отвечать на этот запрос. Переформулируйте его" })
      } else if (failed && !answer) {
        send({ type: "error", message: "Соединение с Gemini прервалось" })
      } else if (!answer.trim() && !stopped) {
        send({ type: "error", message: "Gemini вернул пустой ответ. Попробуйте ещё раз" })
      }

      send({ type: "done", messageId, truncated: finishReason === "MAX_TOKENS" || failed, stopped })
      try {
        controller.close()
      } catch {
        // already cancelled by the client
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
