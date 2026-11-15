"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { extractVariables } from "@/lib/templates"
import type { Database } from "@/lib/types/database"

type Template = Database["public"]["Tables"]["templates"]["Row"]

interface TemplateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (template: Template) => void
  userId: string
  template?: Template
}

export function TemplateDialog(props: TemplateDialogProps) {
  // Remount the form each time it opens so it never shows stale values.
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      {props.open && <TemplateForm {...props} />}
    </Dialog>
  )
}

function TemplateForm({ onOpenChange, onSave, userId, template }: TemplateDialogProps) {
  const supabase = useMemo(() => createClient(), [])
  const [name, setName] = useState(template?.name ?? "")
  const [description, setDescription] = useState(template?.description ?? "")
  const [category, setCategory] = useState(template?.category ?? "")
  const [content, setContent] = useState(template?.content ?? "")
  const [isPublic, setIsPublic] = useState(template?.is_public ?? false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const variables = extractVariables(content)

  const save = async () => {
    if (!name.trim() || !content.trim()) return
    setSaving(true)
    setError(null)

    const fields = {
      name: name.trim(),
      description: description.trim() || null,
      category: category.trim() || null,
      content: content.trim(),
      variables,
      is_public: isPublic,
    }

    const request = template
      ? supabase.from("templates").update(fields).eq("id", template.id).select().single()
      : supabase.from("templates").insert({ ...fields, user_id: userId }).select().single()
    const { data, error: saveError } = await request

    setSaving(false)
    if (saveError || !data) return setError("Не удалось сохранить шаблон")
    onSave(data)
    onOpenChange(false)
  }

  return (
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>{template ? "Редактировать шаблон" : "Новый шаблон"}</DialogTitle>
        <DialogDescription>
          Слова в фигурных скобках, например {"{тема}"} или {"{класс}"}, станут полями, которые заполняются перед отправкой.
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 py-2">
        <div className="grid gap-1.5">
          <Label htmlFor="template-name">Название</Label>
          <Input
            id="template-name"
            value={name}
            maxLength={120}
            placeholder="Разбор ошибок контрольной"
            onChange={(event) => setName(event.target.value)}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="template-category">Категория</Label>
            <Input
              id="template-category"
              value={category}
              maxLength={100}
              placeholder="Контроль знаний"
              onChange={(event) => setCategory(event.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="template-description">Коротко о шаблоне</Label>
            <Input
              id="template-description"
              value={description}
              maxLength={1000}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="template-content">Текст запроса</Label>
          <Textarea
            id="template-content"
            rows={8}
            value={content}
            maxLength={50_000}
            placeholder="Составь 5 задач на тему {тема} для {класс}. Задачи должны быть из жизни, с ответами."
            onChange={(event) => setContent(event.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            {variables.length > 0 ? `Поля: ${variables.join(", ")}` : "Полей пока нет"}
          </p>
        </div>
        <label className="flex items-center justify-between gap-4 rounded-md border p-3">
          <span>
            <span className="block text-sm font-medium">Поделиться с коллегами</span>
            <span className="block text-xs text-muted-foreground">Шаблон увидят все учителя в разделе «Общие»</span>
          </span>
          <Switch checked={isPublic} onCheckedChange={setIsPublic} />
        </label>
      </div>

      <DialogFooter className="items-center">
        {error && <p className="mr-auto text-sm text-destructive">{error}</p>}
        <Button variant="ghost" onClick={() => onOpenChange(false)}>
          Отмена
        </Button>
        <Button onClick={save} disabled={!name.trim() || !content.trim() || saving}>
          {saving ? "Сохраняем..." : "Сохранить"}
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}
