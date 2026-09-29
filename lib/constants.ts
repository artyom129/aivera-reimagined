// Application constants
export const APP_NAME = "AIvera"
export const APP_DESCRIPTION = "AI-ассистент для преподавателей"

// AI models configuration
export type AiModelId = "gemini-3.5-flash-lite" | "gemini-3.8-flash"

export interface AiModelConfig {
  id: AiModelId
  label: string
  description: string
  apiModel: string
}

export const AI_MODELS: AiModelConfig[] = [
  {
    id: "gemini-3.5-flash-lite",
    label: "Gemini 3.5 Flash-Lite",
    description: "Быстрая и экономичная модель для большинства запросов",
    apiModel: "gemini-3.5-flash-lite",
  },
  {
    id: "gemini-3.8-flash",
    label: "Gemini 3.8 Flash",
    description: "Более мощная модель для сложных учебных задач",
    apiModel: "gemini-3.8-flash",
  },
]

// ID модели по умолчанию (используется в админке и на фронте)
export const DEFAULT_AI_MODEL_ID: AiModelId = "gemini-3.5-flash-lite"

// Для обратной совместимости, если где-то ещё используется это имя
export const DEFAULT_AI_MODEL = DEFAULT_AI_MODEL_ID

// Получить имя модели Gemini API по ID из админки
export function getApiModelById(id?: string): string {
  const fallback = AI_MODELS.find((m) => m.id === DEFAULT_AI_MODEL_ID)!
  if (!id) return fallback.apiModel
  const found = AI_MODELS.find((m) => m.id === id)
  return (found ?? fallback).apiModel
}

export function isAiModelId(value: unknown): value is AiModelId {
  return typeof value === "string" && AI_MODELS.some((model) => model.id === value)
}

// Pagination
export const CHATS_PER_PAGE = 50
export const MESSAGES_PER_PAGE = 100

// One-time handoff from structured tools and templates to the chat.
export const CHAT_DRAFT_STORAGE_KEY = "aivera_chat_draft"
export const CHAT_AUTOSEND_STORAGE_KEY = "aivera_chat_autosend"

// User roles
export const USER_ROLES = {
  TEACHER: "teacher",
  ADMIN: "admin",
} as const

// Subscription tiers
export const SUBSCRIPTION_TIERS = {
  FREE: "free",
  BASIC: "basic",
  PREMIUM: "premium",
} as const
