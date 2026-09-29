import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { LessonPlanForm } from "@/components/lesson-plan/lesson-plan-form"

export default async function LessonPlanPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login?next=/lesson-plan")

  return <LessonPlanForm userId={user.id} />
}
