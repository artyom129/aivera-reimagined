import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data, error } = await supabase.rpc("get_admin_analytics")
  if (error) {
    const status = error.message.toLowerCase().includes("forbidden") ? 403 : 500
    return NextResponse.json({ error: status === 403 ? "Forbidden" : "Analytics unavailable" }, { status })
  }

  return NextResponse.json(data)
}
