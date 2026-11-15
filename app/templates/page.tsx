import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { TemplatesInterface } from "@/components/templates/templates-interface"

export const metadata: Metadata = { title: "Шаблоны" }

export default async function TemplatesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login?next=/templates")

  const { data: templates, error } = await supabase
    .from("templates")
    .select("*")
    .or(`is_public.eq.true,user_id.eq.${user.id}`)
    .order("usage_count", { ascending: false })

  if (error) throw new Error("Не удалось загрузить шаблоны")

  return <TemplatesInterface user={user} templates={templates ?? []} />
}
