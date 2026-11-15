"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import type { AppLanguage } from "@/lib/ai-config"
import type { Database } from "@/lib/types/database"
import { currentMonthUsage } from "@/lib/usage"
import { cn } from "@/lib/utils"

type Profile = Database["public"]["Tables"]["users"]["Row"]

const LANGUAGES: { value: AppLanguage; label: string }[] = [
  { value: "ru", label: "Русский" },
  { value: "kk", label: "Қазақша" },
  { value: "en", label: "English" },
]

const THEMES = [
  { value: "system", label: "Как в системе" },
  { value: "light", label: "Светлая" },
  { value: "dark", label: "Тёмная" },
]

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-4 border-t py-8 sm:grid-cols-[220px_1fr] sm:gap-10">
      <div>
        <h2 className="font-medium">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  )
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
  label: string
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex flex-wrap gap-1 rounded-md border bg-card p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded px-3 py-1.5 text-sm transition-colors",
            option.value === value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export function SettingsForm({ profile }: { profile: Profile }) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const { toast } = useToast()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const [fullName, setFullName] = useState(profile.full_name ?? "")
  const [language, setLanguage] = useState<AppLanguage>(profile.language)
  const [saving, setSaving] = useState(false)

  const usage = currentMonthUsage(profile)
  const dirty = fullName.trim() !== (profile.full_name ?? "") || language !== profile.language

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    const { error } = await supabase
      .from("users")
      .update({ full_name: fullName.trim() || null, language })
      .eq("id", profile.id)
    setSaving(false)

    if (error) {
      toast({ title: "Не сохранилось", description: "Попробуйте ещё раз", variant: "destructive" })
      return
    }
    toast({ title: "Сохранено" })
    router.refresh()
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    router.replace("/auth/login")
    router.refresh()
  }

  return (
    <main className="min-h-dvh bg-background">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-4xl items-center px-4">
          <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1.5">
            <Link href="/chat">
              <ArrowLeft className="size-4" />
              К чатам
            </Link>
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="font-serif text-3xl font-medium tracking-[-0.01em] sm:text-4xl">Настройки</h1>
        <p className="mt-1.5 text-muted-foreground">{profile.email}</p>

        <form onSubmit={save} className="mt-8">
          <Section title="Профиль" description="Имя видно только вам и администратору.">
            <div className="grid max-w-sm gap-1.5">
              <Label htmlFor="fullName">Имя</Label>
              <Input id="fullName" value={fullName} maxLength={200} onChange={(event) => setFullName(event.target.value)} />
            </div>
          </Section>

          <Section title="Язык ответов" description="На этом языке AIvera пишет планы, тесты и письма, если вы не попросите другой.">
            <Segmented value={language} options={LANGUAGES} onChange={setLanguage} label="Язык ответов" />
          </Section>

          <div className="flex justify-end border-t py-4">
            <Button type="submit" disabled={!dirty || saving}>
              {saving ? "Сохраняем..." : "Сохранить"}
            </Button>
          </div>
        </form>

        <Section title="Оформление">
          <Segmented value={mounted ? (theme ?? "system") : "system"} options={THEMES} onChange={setTheme} label="Тема" />
        </Section>

        <Section title="Использование" description="Счётчик обнуляется первого числа каждого месяца.">
          {usage.limit > 0 ? (
            <div className="max-w-sm">
              <div className="flex items-baseline justify-between text-sm">
                <span>
                  {usage.used.toLocaleString("ru-RU")} из {usage.limit.toLocaleString("ru-RU")} токенов
                </span>
                <span className="text-muted-foreground">{Math.round(usage.ratio * 100)}%</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
                <div
                  className={cn("h-full rounded-full", usage.ratio >= 0.9 ? "bg-destructive" : "bg-primary")}
                  style={{ width: `${Math.min(usage.ratio, 1) * 100}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Один план урока обычно занимает 3–6 тысяч токенов.</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Без ограничений.</p>
          )}
        </Section>

        <Section title="Аккаунт">
          <Button variant="outline" onClick={signOut}>
            Выйти
          </Button>
        </Section>
      </div>
    </main>
  )
}
