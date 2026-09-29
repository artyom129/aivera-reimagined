import { NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { DEFAULT_AI_MODEL_ID, isAiModelId } from "@/lib/constants"

const bodySchema = z.object({
  modelId: z.string().refine(isAiModelId, "Unsupported model"),
})

async function getAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single()
  if (profile?.role !== "admin") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }

  return { supabase, user }
}

export async function GET() {
  const auth = await getAdmin()
  if ("error" in auth) return auth.error

  const { data } = await auth.supabase
    .from("app_settings")
    .select("value")
    .eq("key", "default_ai_model")
    .maybeSingle()

  const modelId = isAiModelId(data?.value) ? data.value : DEFAULT_AI_MODEL_ID
  return NextResponse.json({ modelId })
}

export async function PATCH(request: Request) {
  const auth = await getAdmin()
  if ("error" in auth) return auth.error

  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid model" }, { status: 400 })
  }

  const { error } = await auth.supabase.from("app_settings").upsert({
    key: "default_ai_model",
    value: parsed.data.modelId,
    updated_by: auth.user.id,
    updated_at: new Date().toISOString(),
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ modelId: parsed.data.modelId })
}
