import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ToolForm } from "@/components/tools/tool-form"
import { getTool } from "@/lib/tools"

type Props = { params: Promise<{ tool: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tool: slug } = await params
  return { title: getTool(slug)?.title ?? "Инструмент" }
}

export default async function ToolPage({ params }: Props) {
  const { tool: slug } = await params
  if (!getTool(slug)) notFound()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/auth/login?next=/tools/${slug}`)

  return <ToolForm slug={slug} userId={user.id} />
}
