"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import { ArrowLeft, Check, Copy, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useDialogs } from "@/components/dialogs"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { CHAT_DRAFT_STORAGE_KEY } from "@/lib/constants"
import { extractVariables, fillTemplate, missingVariables } from "@/lib/templates"
import type { Database } from "@/lib/types/database"
import { TemplateDialog } from "./template-dialog"

type Template = Database["public"]["Tables"]["templates"]["Row"]

type TemplateDetailProps = {
  template: Template
  user: User
  onBack: () => void
  onUpdate: (template: Template) => void
  onDelete: (id: string) => void
}

export function TemplateDetail({ template, user, onBack, onUpdate, onDelete }: TemplateDetailProps) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const { toast } = useToast()
  const { confirm, dialogs } = useDialogs()
  const [values, setValues] = useState<Record<string, string>>({})
  const [editing, setEditing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [opening, setOpening] = useState(false)

  const fields = extractVariables(template.content)
  const filled = fillTemplate(template.content, values)
  const missing = missingVariables(template.content, values)
  const isOwner = template.user_id === user.id

  const copy = async () => {
    await navigator.clipboard.writeText(filled).catch(() => undefined)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const useInChat = async () => {
    setOpening(true)
    const { data: chat, error } = await supabase
      .from("chats")
      .insert({ user_id: user.id, title: template.name.slice(0, 200), ai_mode: "default" })
      .select("id")
      .single()
    if (error || !chat) {
      setOpening(false)
      toast({ title: "Чат не создан", description: "Проверьте соединение", variant: "destructive" })
      return
    }
    // Counting usage is nice to have; it must not block the teacher.
    void supabase.rpc("increment_template_usage", { p_template_id: template.id })
    sessionStorage.setItem(CHAT_DRAFT_STORAGE_KEY, filled)
    router.push(`/chat?id=${chat.id}`)
  }

  const remove = async () => {
    const ok = await confirm({
      title: `Удалить «${template.name}»?`,
      description: template.is_public ? "Шаблон пропадёт и у коллег." : undefined,
      confirmLabel: "Удалить",
      destructive: true,
    })
    if (!ok) return
    const { error } = await supabase.from("templates").delete().eq("id", template.id)
    if (error) return toast({ title: "Шаблон не удалён", variant: "destructive" })
    onDelete(template.id)
  }

  return (
    <main className="min-h-dvh bg-background">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-2 px-4">
          <Button variant="ghost" size="sm" className="-ml-2 gap-1.5" onClick={onBack}>
            <ArrowLeft className="size-4" />
            Все шаблоны
          </Button>
          {isOwner && (
            <div className="ml-auto flex gap-1">
              <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setEditing(true)}>
                <Pencil className="size-4" />
                Изменить
              </Button>
              <Button variant="ghost" size="sm" className="gap-1.5 text-destructive hover:text-destructive" onClick={remove}>
                <Trash2 className="size-4" />
                Удалить
              </Button>
            </div>
          )}
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl gap-10 px-4 py-8 sm:py-10 lg:grid-cols-[1fr_1.2fr]">
        <section>
          <h1 className="font-serif text-3xl font-medium tracking-[-0.01em]">{template.name}</h1>
          {template.description && <p className="mt-1.5 text-muted-foreground">{template.description}</p>}
          <p className="mt-3 text-xs text-muted-foreground">
            {[template.category, template.is_public ? "общий" : "личный", `использований: ${template.usage_count}`]
              .filter(Boolean)
              .join(" · ")}
          </p>

          {fields.length > 0 && (
            <div className="mt-8 grid gap-4">
              {fields.map((field) => (
                <div key={field} className="grid gap-1.5">
                  <Label htmlFor={`var-${field}`}>{field}</Label>
                  <Input
                    id={`var-${field}`}
                    value={values[field] ?? ""}
                    onChange={(event) => setValues((previous) => ({ ...previous, [field]: event.target.value }))}
                  />
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-2">
            <Button onClick={useInChat} disabled={opening}>
              {opening ? "Открываем..." : "Открыть в чате"}
            </Button>
            <Button variant="outline" onClick={copy} className="gap-1.5">
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied ? "Скопировано" : "Копировать"}
            </Button>
          </div>
          {missing.length > 0 && (
            <p className="mt-3 text-xs text-muted-foreground">Не заполнено: {missing.join(", ")}. Можно дописать в чате.</p>
          )}
        </section>

        <section>
          <h2 className="text-sm font-medium text-muted-foreground">Что получится</h2>
          <pre className="mt-2 whitespace-pre-wrap rounded-lg border bg-card p-4 font-sans text-sm leading-6">{filled}</pre>
        </section>
      </div>

      {isOwner && (
        <TemplateDialog open={editing} onOpenChange={setEditing} onSave={onUpdate} userId={user.id} template={template} />
      )}
      {dialogs}
    </main>
  )
}
