import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { SettingsForm } from "@/components/settings/settings-form"

export const metadata: Metadata = { title: "Настройки" }

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login?next=/settings")

  const { data: profile } = await supabase.from("users").select("*").eq("id", user.id).single()
  if (!profile) throw new Error("Профиль не найден. Примените миграции Supabase.")

  return <SettingsForm profile={profile} />
}
