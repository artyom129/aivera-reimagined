import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const requestedNext = requestUrl.searchParams.get("next")
  const next = requestedNext?.startsWith("/") && !requestedNext.startsWith("//") ? requestedNext : "/chat"

  if (!code) {
    return NextResponse.redirect(new URL("/auth/error?error=missing_code", requestUrl.origin))
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(new URL("/auth/error?error=confirmation_failed", requestUrl.origin))
  }

  await supabase.rpc("record_login")
  return NextResponse.redirect(new URL(next, requestUrl.origin))
}

