import { createClient } from "@/lib/supabase/server"
import { z } from "zod"

const templateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().max(1000).nullish(),
  content: z.string().trim().min(1).max(50000),
  category: z.string().max(100).nullish(),
  variables: z.array(z.string().max(100)).max(30).default([]),
  is_public: z.boolean().default(false),
})

export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return new Response("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const category = searchParams.get("category")
    const isPublic = searchParams.get("public") === "true"

    let query = supabase.from("templates").select("*")

    if (isPublic) {
      query = query.eq("is_public", true)
    } else {
      query = query.or(`is_public.eq.true,user_id.eq.${user.id}`)
    }

    if (category) {
      query = query.eq("category", category)
    }

    const { data, error } = await query.order("usage_count", { ascending: false })

    if (error) {
      return new Response(error.message, { status: 500 })
    }

    return Response.json(data)
  } catch (error) {
    console.error("AIvera templates API error:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return new Response("Unauthorized", { status: 401 })
    }

    const parsed = templateSchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) return new Response("Invalid template", { status: 400 })
    const { name, description, content, category, variables, is_public } = parsed.data

    const { data, error } = await supabase
      .from("templates")
      .insert({
        name,
        user_id: user.id,
        description,
        content,
        category,
        variables: variables || [],
        is_public: is_public || false,
      })
      .select()
      .single()

    if (error) {
      return new Response(error.message, { status: 500 })
    }

    return Response.json(data)
  } catch (error) {
    console.error("AIvera templates POST error:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}
