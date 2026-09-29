import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const patchSchema = z.object({
  userId: z.string().uuid(),
  updates: z
    .object({
      role: z.enum(["teacher", "admin"]).optional(),
      token_limit: z.number().int().min(0).max(10_000_000).optional(),
      is_blocked: z.boolean().optional(),
      blocked_reason: z.string().max(500).nullable().optional(),
      subscription_tier: z.enum(["free", "basic", "premium"]).optional(),
    })
    .refine((value) => Object.keys(value).length > 0, "No updates supplied"),
})

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
  const search = (searchParams.get("search") || "").replace(/[%(),.]/g, " ").trim().slice(0, 100)
  const role = searchParams.get("role")
  const blocked = searchParams.get("blocked")
  let query = auth.supabase.from("users").select("*").order("created_at", { ascending: false }).limit(200)

  if (search) query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`)
  if (role === "teacher" || role === "admin") query = query.eq("role", role)
  if (blocked === "true" || blocked === "false") query = query.eq("is_blocked", blocked === "true")

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ users: data || [] })
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin()
  if ("response" in auth) return auth.response

  const parsed = patchSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Invalid update" }, { status: 400 })

  if (
    parsed.data.userId === auth.user.id &&
    (parsed.data.updates.role === "teacher" || parsed.data.updates.is_blocked === true)
  ) {
    return NextResponse.json({ error: "Нельзя снять свою роль администратора или заблокировать себя" }, { status: 400 })
  }

  const { data: updatedUser, error } = await auth.supabase
    .from("users")
    .update(parsed.data.updates)
    .eq("id", parsed.data.userId)
    .select("id")
    .maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!updatedUser) return NextResponse.json({ error: "User not found" }, { status: 404 })

  await auth.supabase.rpc("log_admin_action", {
    p_action: "update_user",
    p_target_type: "user",
    p_target_id: parsed.data.userId,
    p_details: parsed.data.updates,
  })
  return NextResponse.json({ success: true })
}
