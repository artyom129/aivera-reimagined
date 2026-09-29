"use client"

import { useEffect, useState } from "react"
import { useRouter } from 'next/navigation'
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Save, User, Mail, Shield } from 'lucide-react'
import type { User as SupabaseUser } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/database"
import { useToast } from "@/hooks/use-toast"

type UserProfile = Database["public"]["Tables"]["users"]["Row"]

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [fullName, setFullName] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    const loadUserData = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (!authUser) {
        router.push("/auth/login")
        return
      }

      setUser(authUser)

      const { data: profileData } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single()

      if (profileData) {
        setProfile(profileData)
        setFullName(profileData.full_name || "")
      }

      setLoading(false)
    }

    loadUserData()
  }, [router, supabase])

  const handleSave = async () => {
    if (!user) return

    setSaving(true)

    const { error } = await supabase
      .from("users")
      .update({
        full_name: fullName,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    setSaving(false)

    if (error) {
      toast({ title: "Ошибка", description: "Не удалось сохранить изменения", variant: "destructive" })
      return
    }

    setProfile((current) => (current ? { ...current, full_name: fullName } : current))
    toast({ title: "Сохранено", description: "Настройки профиля обновлены" })
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Загрузка...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl py-8">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/chat")} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Настройки</h1>
            <p className="text-muted-foreground">Управление вашим профилем и предпочтениями</p>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Профиль
              </CardTitle>
              <CardDescription>Обновите информацию о вашем профиле</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Полное имя</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Введите ваше имя"
                  maxLength={200}
                  className="rounded-2xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <Input id="email" value={user?.email || ""} disabled className="rounded-2xl" />
                </div>
                <p className="text-xs text-muted-foreground">Email не может быть изменен</p>
              </div>

              <div className="space-y-2">
                <Label>Роль</Label>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <Input value={profile?.role || "user"} disabled className="rounded-2xl" />
                </div>
              </div>

              <Separator />

              <Button onClick={handleSave} disabled={saving} className="w-full rounded-full">
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Сохранение..." : "Сохранить изменения"}
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle>Действия с аккаунтом</CardTitle>
              <CardDescription>Управление вашим аккаунтом</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                className="rounded-full"
                onClick={async () => {
                  await supabase.auth.signOut()
                  router.push("/auth/login")
                }}
              >
                Выйти из аккаунта
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
