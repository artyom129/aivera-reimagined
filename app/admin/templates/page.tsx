import { createClient } from "@/lib/supabase/server"
import { AdminTemplatesTable } from "@/components/admin/admin-templates-table"

export default async function AdminTemplatesPage() {
  const supabase = await createClient()
  const { data: templates, error } = await supabase
    .from("templates")
    .select("*, users(email, full_name)")
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-medium tracking-[-0.01em]">Шаблоны</h1>
        <p className="mt-1 text-muted-foreground">Все шаблоны учителей, включая личные</p>
      </div>
      {error ? (
        <p className="text-destructive">Шаблоны не загрузились</p>
      ) : (
        <AdminTemplatesTable templates={templates ?? []} />
      )}
    </div>
  )
}
