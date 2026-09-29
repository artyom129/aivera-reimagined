import { NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { authErrorResponse, invalidRequestResponse } from "../_shared"

export const dynamic = "force-dynamic"

const schema = z.object({
  password: z.string().min(6).max(1024),
})

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    return invalidRequestResponse("Пароль должен содержать минимум 6 символов.")
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: "Ссылка недействительна или устарела. Запросите восстановление пароля ещё раз." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    )
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password })
  if (error) return authErrorResponse(error)

  return NextResponse.json(
    { success: true },
    { headers: { "Cache-Control": "no-store" } },
  )
}
