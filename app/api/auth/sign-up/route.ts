import { NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { authErrorResponse, getAuthRedirectUrl, invalidRequestResponse } from "../_shared"

export const dynamic = "force-dynamic"

const signUpSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(320),
  password: z.string().min(6).max(1024),
  fullName: z.string().trim().min(1).max(200),
})

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = signUpSchema.safeParse(body)

  if (!parsed.success) {
    return invalidRequestResponse("Проверьте имя, email и пароль. Пароль должен содержать минимум 6 символов.")
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: getAuthRedirectUrl(request),
      data: {
        full_name: parsed.data.fullName,
        language: "ru",
      },
    },
  })

  if (error) return authErrorResponse(error)

  if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    return authErrorResponse({
      code: "user_already_exists",
      message: "User already registered",
    })
  }

  if (data.session) {
    await supabase.rpc("record_login")
  }

  return NextResponse.json(
    {
      success: true,
      hasSession: Boolean(data.session),
      needsConfirmation: !data.session,
    },
    { headers: { "Cache-Control": "no-store" } },
  )
}
