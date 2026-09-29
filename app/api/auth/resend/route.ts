import { NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { authErrorResponse, getAuthRedirectUrl, invalidRequestResponse } from "../_shared"

export const dynamic = "force-dynamic"

const resendSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(320),
})

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = resendSchema.safeParse(body)

  if (!parsed.success) return invalidRequestResponse("Введите корректный email.")

  const supabase = await createClient()
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: parsed.data.email,
    options: { emailRedirectTo: getAuthRedirectUrl(request) },
  })

  if (error) return authErrorResponse(error)

  return NextResponse.json(
    { success: true },
    { headers: { "Cache-Control": "no-store" } },
  )
}
