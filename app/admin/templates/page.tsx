import { createClient } from "@/lib/supabase/server"
import { AdminTemplatesTable } from "@/components/admin/admin-templates-table"

export default async function AdminTemplatesPage() {
  const supabase = await createClient()

  const { data: templates } = await supabase
    .from("templates")
    .select("*, users(email, full_name)")
    .order("created_at", { ascending: false })

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Управление шаблонами</h1>
        <p className="mt-2 text-muted-foreground">Модерация и управление всеми шаблонами системы</p>
      </div>

      <AdminTemplatesTable templates={templates || []} />
    </div>
  )
}
