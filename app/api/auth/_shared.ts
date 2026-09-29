import { NextResponse } from "next/server"
import { getFriendlyAuthError } from "@/lib/auth"

type AuthErrorLike = {
  code?: string
  message?: string
}

export function getAuthRedirectUrl(request: Request) {
  return `${new URL(request.url).origin}/auth/callback?next=/chat`
}

export function authErrorResponse(error: AuthErrorLike, fallbackStatus = 400) {
  const code = error.code?.toLowerCase()
  const message = error.message?.toLowerCase() || ""
  let status = fallbackStatus

  if (code === "invalid_credentials" || code === "email_not_confirmed") status = 401
  if (code === "user_already_exists" || message.includes("already registered")) status = 409
  if (code === "over_email_send_rate_limit" || message.includes("rate limit")) status = 429

  return NextResponse.json(
    { error: getFriendlyAuthError(error), code: error.code },
    { status, headers: { "Cache-Control": "no-store" } },
  )
}

export function invalidRequestResponse(error: string) {
  return NextResponse.json(
    { error },
    { status: 400, headers: { "Cache-Control": "no-store" } },
  )
}
