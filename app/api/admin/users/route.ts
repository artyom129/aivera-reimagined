import { z } from "zod"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/types/database"

type UserUpdate = Database["public"]["Tables"]["users"]["Update"]

const patchSchema = z.object({
  userId: z.string().uuid(),
  updates: z
    .object({
      role: z.enum(["teacher", "admin"]).optional(),
      token_limit: z.number().int().min(0).max(10_000_000).optional(),
      is_blocked: z.boolean().optional(),
      blocked_reason: z.string().trim().max(500).nullable().optional(),
      subscription_tier: z.enum(["free", "basic", "premium"]).optional(),
      reset_usage: z.literal(true).optional(),
    })
    .refine((value) => Object.keys(value).length > 0, "No updates supplied"),
})

const USER_COLUMNS =
  "id, email, full_name, role, token_limit, tokens_used, usage_period_start, is_blocked, blocked_reason, last_login, created_at"

async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single()
  if (profile?.role !== "admin") return { response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  return { supabase, user }
}

export async function GET(request: Request) {
  const auth = await requireAdmin()
  if ("response" in auth) return auth.response

  const { searchParams } = new URL(request.url)
  // PostgREST filter syntax uses these characters; strip them from free text.
  const search = (searchParams.get("search") || "").replace(/[%(),.*\\]/g, " ").trim().slice(0, 100)
  const role = searchParams.get("role")
  const blocked = searchParams.get("blocked")

  let query = auth.supabase.from("users").select(USER_COLUMNS).order("created_at", { ascending: false }).limit(200)
  if (search) query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`)
  if (role === "teacher" || role === "admin") query = query.eq("role", role)
  if (blocked === "true" || blocked === "false") query = query.eq("is_blocked", blocked === "true")

  const { data, error } = await query
  if (error) return NextResponse.json({ error: "Не удалось загрузить пользователей" }, { status: 500 })
  return NextResponse.json({ users: data ?? [] })
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin()
  if ("response" in auth) return auth.response

  const parsed = patchSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Некорректные данные" }, { status: 400 })

  const { userId, updates } = parsed.data
  if (userId === auth.user.id && (updates.role === "teacher" || updates.is_blocked === true)) {
    return NextResponse.json({ error: "Нельзя снять с себя роль администратора или заблокировать себя" }, { status: 400 })
  }

  const { reset_usage: resetUsage, ...fields } = updates
  const changes: UserUpdate = { ...fields }
  if (resetUsage) changes.tokens_used = 0
  if (updates.is_blocked === false) changes.blocked_reason = null

  const { data: updatedUser, error } = await auth.supabase
    .from("users")
    .update(changes)
    .eq("id", userId)
    .select(USER_COLUMNS)
    .maybeSingle()
  if (error) return NextResponse.json({ error: "Не удалось обновить пользователя" }, { status: 500 })
  if (!updatedUser) return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 })

  await auth.supabase.rpc("log_admin_action", {
    p_action: "update_user",
    p_target_type: "user",
    p_target_id: userId,
    p_details: updates,
  })
  return NextResponse.json({ user: updatedUser })
}
