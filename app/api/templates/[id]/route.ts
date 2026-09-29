import { createClient } from "@/lib/supabase/server"
import { z } from "zod"

const updateSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    description: z.string().max(1000).nullable().optional(),
    content: z.string().trim().min(1).max(50000).optional(),
    category: z.string().max(100).nullable().optional(),
    variables: z.array(z.string().max(100)).max(30).optional(),
    is_public: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0)

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return new Response("Unauthorized", { status: 401 })
    }

    const parsed = updateSchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) return new Response("Invalid template", { status: 400 })

    const { data, error } = await supabase
      .from("templates")
      .update(parsed.data)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single()

    if (error) {
      return new Response(error.message, { status: 500 })
    }

    return Response.json(data)
  } catch (error) {
    console.error("AIvera template PATCH error:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return new Response("Unauthorized", { status: 401 })
    }

    const { error } = await supabase.from("templates").delete().eq("id", id).eq("user_id", user.id)

    if (error) {
      return new Response(error.message, { status: 500 })
    }

    return new Response(null, { status: 204 })
  } catch (error) {
    console.error("AIvera template DELETE error:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}
