"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { createClient } from "@/lib/supabase/client"
import type { Database } from "@/lib/types/database"

type Template = Database["public"]["Tables"]["templates"]["Row"]

interface TemplateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (template: Template) => void
  userId: string
  template?: Template
}

export function TemplateDialog({ open, onOpenChange, onSave, userId, template }: TemplateDialogProps) {
  const [name, setName] = useState(template?.name || "")
  const [description, setDescription] = useState(template?.description || "")
  const [content, setContent] = useState(template?.content || "")
  const [category, setCategory] = useState(template?.category || "")
  const [variables, setVariables] = useState((template?.variables as string[])?.join(", ") || "")
  const [isPublic, setIsPublic] = useState(template?.is_public || false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const handleSave = async () => {
    if (!name.trim() || !content.trim()) return

    setIsLoading(true)
    setError(null)

    const variablesArray = variables
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean)

    const templateData = {
      name: name.trim(),
      description: description.trim() || null,
      content: content.trim(),
      category: category.trim() || null,
      variables: variablesArray,
      is_public: isPublic,
    }

    let savedTemplate: Template | null = null
    let saveError: { message: string } | null = null

    if (template) {
      // Update existing template
      const { data, error } = await supabase
        .from("templates")
        .update(templateData)
        .eq("id", template.id)
        .select()
        .single()

      savedTemplate = data
      saveError = error
    } else {
      // Create new template
      const { data, error } = await supabase
        .from("templates")
        .insert({ ...templateData, user_id: userId })
        .select()
        .single()

      savedTemplate = data
      saveError = error
    }

    setIsLoading(false)
    if (saveError || !savedTemplate) {
      setError(saveError?.message || "Не удалось сохранить шаблон")
      return
    }

    onSave(savedTemplate)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{template ? "Редактировать шаблон" : "Создать шаблон"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Название *</Label>
            <Input
              id="name"
              placeholder="Например: План урока по математике"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              placeholder="Краткое описание шаблона"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Категория</Label>
            <Input
              id="category"
              placeholder="Например: Планирование уроков"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Содержимое шаблона *</Label>
            <Textarea
              id="content"
              placeholder="Используйте {переменная} для динамических значений"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Используйте фигурные скобки для переменных: {"{предмет}"}, {"{класс}"}, {"{тема}"}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="variables">Переменные</Label>
            <Input
              id="variables"
              placeholder="предмет, класс, тема (через запятую)"
              value={variables}
              onChange={(e) => setVariables(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="public">Публичный шаблон</Label>
              <p className="text-sm text-muted-foreground">Разрешить другим учителям использовать этот шаблон</p>
            </div>
            <Switch id="public" checked={isPublic} onCheckedChange={setIsPublic} />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          {error && <p className="mr-auto self-center text-sm text-destructive">{error}</p>}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || !content.trim() || isLoading}>
            {isLoading ? "Сохранение..." : "Сохранить"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
