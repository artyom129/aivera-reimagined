"use client"

import type React from "react"
import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Check, ChevronDown, EyeOff } from "lucide-react"
import { LessonTimeline } from "@/components/lesson-timeline"
import { ToolIcon } from "@/components/tools/tool-icon"
import { splitLesson } from "@/lib/lesson-timeline"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { CHAT_AUTOSEND_STORAGE_KEY, CHAT_DRAFT_STORAGE_KEY } from "@/lib/constants"
import { getTool, getToolDefaults, TOOLS, validateToolValues, type ToolField, type ToolValues } from "@/lib/tools"
import { cn } from "@/lib/utils"

const selectClass =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"

function Field({ field, value, onChange }: { field: ToolField; value: string; onChange: (value: string) => void }) {
  const id = `field-${field.name}`
  const common = { id, name: field.name, required: field.required, value }

  return (
    <div className={cn("space-y-1.5", field.wide && "sm:col-span-2")}>
      <Label htmlFor={id}>
        {field.label}
        {!field.required && field.type !== "select" && (
          <span className="ml-1 font-normal text-muted-foreground">необязательно</span>
        )}
      </Label>
      {field.type === "textarea" ? (
        <Textarea
          {...common}
          rows={field.rows ?? 3}
          maxLength={field.maxLength}
          placeholder={field.placeholder}
          onChange={(event) => onChange(event.target.value)}
          className="min-h-0 resize-y"
        />
      ) : field.type === "select" ? (
        <select {...common} onChange={(event) => onChange(event.target.value)} className={selectClass}>
          {field.options?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : (
        <Input
          {...common}
          type={field.type}
          min={field.min}
          max={field.max}
          maxLength={field.maxLength}
          placeholder={field.placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
      {field.hint && <p className="text-xs text-muted-foreground">{field.hint}</p>}
    </div>
  )
}

export function ToolForm({ slug, userId }: { slug: string; userId: string }) {
  const tool = getTool(slug)!
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [values, setValues] = useState<ToolValues>(() => getToolDefaults(tool))
  const [privacyConfirmed, setPrivacyConfirmed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const prompt = tool.buildPrompt(values)
  const durationMinutes = Math.min(240, Math.max(10, Number(values.duration) || 45))

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (submitting) return
    const problem = validateToolValues(tool, values)
    if (problem) return setError(problem)
    if (!privacyConfirmed) return setError("Подтвердите, что в форме нет личных данных учеников")

    setSubmitting(true)
    setError(null)
    const { data: chat, error: createError } = await supabase
      .from("chats")
      .insert({ user_id: userId, title: tool.buildTitle(values).slice(0, 200), ai_mode: tool.mode })
      .select("id")
      .single()

    if (createError || !chat) {
      setSubmitting(false)
      return setError("Не удалось создать чат. Проверьте соединение")
    }

    sessionStorage.setItem(CHAT_DRAFT_STORAGE_KEY, prompt)
    sessionStorage.setItem(CHAT_AUTOSEND_STORAGE_KEY, "1")
    router.push(`/chat?id=${chat.id}`)
  }

  return (
    <main className="min-h-dvh bg-background">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4">
          <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1.5">
            <Link href="/chat">
              <ArrowLeft className="size-4" />
              К чатам
            </Link>
          </Button>
          <nav className="ml-auto hidden gap-1 sm:flex" aria-label="Другие инструменты">
            {TOOLS.map((item) => (
              <Link
                key={item.slug}
                href={`/tools/${item.slug}`}
                aria-current={item.slug === tool.slug ? "page" : undefined}
                className={cn(
                  "rounded-md px-2.5 py-1 text-sm text-muted-foreground hover:bg-accent hover:text-foreground",
                  item.slug === tool.slug && "bg-accent font-medium text-foreground",
                )}
              >
                {item.title}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl gap-10 px-4 py-8 sm:py-12 lg:grid-cols-[1fr_320px]">
        <form onSubmit={submit} noValidate className="rise-in">
          <div className="flex items-start gap-4">
            <ToolIcon slug={tool.slug} boxed className="size-11" />
            <div>
              <h1 className="font-serif text-3xl font-medium tracking-[-0.01em]">{tool.title}</h1>
              <p className="mt-1.5 text-muted-foreground">{tool.summary}</p>
            </div>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {tool.fields.map((field) => (
              <Field
                key={field.name}
                field={field}
                value={values[field.name] ?? ""}
                onChange={(value) => setValues((previous) => ({ ...previous, [field.name]: value }))}
              />
            ))}
          </div>

          <label className="mt-6 flex cursor-pointer items-start gap-2.5 text-sm font-normal text-muted-foreground">
            <input
              type="checkbox"
              checked={privacyConfirmed}
              onChange={(event) => setPrivacyConfirmed(event.target.checked)}
              className="mt-0.5 size-4 accent-[var(--primary)]"
            />
            <span>В форме нет имён, контактов и других личных данных учеников. Текст можно отправить в Google Gemini.</span>
          </label>

          {error && (
            <p role="alert" className="mt-4 text-sm text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" size="lg" className="mt-6 w-full sm:w-auto" disabled={submitting}>
            {submitting ? "Открываем чат..." : tool.submitLabel}
          </Button>
        </form>

        <aside className="space-y-4 lg:sticky lg:top-8 lg:self-start">
          <section className={cn("overflow-hidden rounded-2xl border", tool.slug === "lesson-plan" ? "paper-sheet" : "bg-card")}>
            <div className="p-5">
              <h2 className="text-sm text-muted-foreground">Что получится</h2>
              {tool.slug === "lesson-plan" ? (
                <>
                  <p className="mt-2 font-serif text-lg font-medium leading-snug">
                    {values.topic?.trim() || "Тема урока"}
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {[values.subject?.trim(), values.grade?.trim(), `${durationMinutes} мин`].filter(Boolean).join(" · ")}
                  </p>
                  <LessonTimeline className="mt-5" stages={splitLesson(durationMinutes)} compact />
                  <p className="mt-3 text-xs leading-5 text-muted-foreground">
                    Примерная разбивка. Gemini подстроит её под тему и тип урока
                  </p>
                </>
              ) : (
                <ul className="mt-3 space-y-2.5 text-sm">
                  {tool.outcomes.map((outcome) => (
                    <li key={outcome} className="flex gap-2.5">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                      {outcome}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <details className="group rounded-2xl border bg-card">
            <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-3.5 text-sm font-medium">
              Текст запроса для Gemini
              <ChevronDown className="size-4 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
            </summary>
            <pre className="max-h-[40vh] overflow-auto whitespace-pre-wrap border-t px-5 py-4 font-mono text-xs leading-5 text-muted-foreground">
              {prompt}
            </pre>
          </details>

          <p className="flex gap-2.5 px-1 text-xs leading-5 text-muted-foreground">
            <EyeOff className="mt-0.5 size-3.5 shrink-0" />
            Email, телефоны, номера карт и ИИН скрываются на сервере перед отправкой
          </p>
        </aside>
      </div>
    </main>
  )
}
