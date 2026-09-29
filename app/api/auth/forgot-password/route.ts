import { NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { authErrorResponse, invalidRequestResponse } from "../_shared"

export const dynamic = "force-dynamic"

const schema = z.object({
  email: z.string().trim().toLowerCase().email().max(320),
})

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)

  if (!parsed.success) return invalidRequestResponse("Введите корректный email.")

  const supabase = await createClient()
  const redirectTo = `${new URL(request.url).origin}/auth/callback?next=/auth/update-password`
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, { redirectTo })

  if (error) return authErrorResponse(error)

  return NextResponse.json(
    { success: true },
    { headers: { "Cache-Control": "no-store" } },
  )
}
