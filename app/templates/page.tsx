import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { TemplatesInterface } from "@/components/templates/templates-interface"

export default async function TemplatesPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Fetch public templates and user's own templates
  const { data: templates, error: templatesError } = await supabase
    .from("templates")
    .select("*")
    .or(`is_public.eq.true,user_id.eq.${user.id}`)
    .order("usage_count", { ascending: false })

  if (templatesError) {
    throw new Error("Не удалось загрузить шаблоны")
  }

  return (
    <div className="h-dvh bg-background">
      <TemplatesInterface user={user} templates={templates || []} />
    </div>
  )
}
