import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import type { Database } from "@/lib/types/database"

function copyResponseCookies(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach((cookie) => target.cookies.set(cookie))
  return target
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    return supabaseResponse
  }

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const isProtected =
    pathname.startsWith("/chat") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/templates") ||
    pathname.startsWith("/admin") ||
    pathname === "/auth/update-password"
  const isAuthEntry = pathname === "/auth/login" || pathname === "/auth/sign-up"

  if (!user && isProtected) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/auth/login"
    redirectUrl.search = ""
    redirectUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`)
    return copyResponseCookies(supabaseResponse, NextResponse.redirect(redirectUrl))
  }

  if (user && isAuthEntry) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/chat"
    redirectUrl.search = ""
    return copyResponseCookies(supabaseResponse, NextResponse.redirect(redirectUrl))
  }

  return supabaseResponse
}

