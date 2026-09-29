import { NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { authErrorResponse, invalidRequestResponse } from "../_shared"

export const dynamic = "force-dynamic"

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(320),
  password: z.string().min(1).max(1024),
})

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = loginSchema.safeParse(body)

  if (!parsed.success) {
    return invalidRequestResponse("Введите корректный email и пароль.")
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error) return authErrorResponse(error, 401)
  if (!data.session) {
    return authErrorResponse({ message: "Supabase не создал сессию. Попробуйте войти ещё раз." }, 401)
  }

  // Usage accounting must never block an otherwise successful sign-in.
  await supabase.rpc("record_login")

  return NextResponse.json(
    { success: true },
    { headers: { "Cache-Control": "no-store" } },
  )
}
