"use client"

import { useState } from "react"
import type { User } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ArrowLeft, Copy, Edit, MessageSquare } from "lucide-react"
import type { Database } from "@/lib/types/database"
import { createClient } from "@/lib/supabase/client"
import { CHAT_DRAFT_STORAGE_KEY } from "@/lib/constants"
import { useRouter } from "next/navigation"
import { TemplateDialog } from "./template-dialog"

type Template = Database["public"]["Tables"]["templates"]["Row"]

interface TemplateDetailProps {
  template: Template
  user: User
  onBack: () => void
  onUpdate: (template: Template) => void
}

export function TemplateDetail({ template, user, onBack, onUpdate }: TemplateDetailProps) {
  const [variableValues, setVariableValues] = useState<Record<string, string>>({})
  const [generatedContent, setGeneratedContent] = useState("")
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const variables = (template.variables as string[]) || []
  const isOwner = template.user_id === user.id

  const handleGenerate = () => {
    let content = template.content
    variables.forEach((variable) => {
      const value = variableValues[variable] || `{${variable}}`
      const escapedVariable = variable.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      content = content.replace(new RegExp(`\\{${escapedVariable}\\}`, "g"), value)
    })
    setGeneratedContent(content)
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedContent || template.content)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  const handleUseInChat = async () => {
    // Increment usage count
    await supabase.rpc("increment_template_usage", { p_template_id: template.id })

    // Create a chat and let the user review the template before sending it to Gemini.
    const content = generatedContent || template.content
    const { data: newChat } = await supabase
      .from("chats")
      .insert({
        user_id: user.id,
        title: template.name,
        ai_mode: "default",
      })
      .select()
      .single()

    if (newChat) {
      sessionStorage.setItem(CHAT_DRAFT_STORAGE_KEY, content)
      router.push(`/chat?id=${newChat.id}`)
    }
  }

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-balance">{template.name}</h1>
              {template.description && <p className="mt-1 text-sm text-muted-foreground">{template.description}</p>}
            </div>
          </div>
          <div className="flex gap-2">
            {isOwner && (
              <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Редактировать
              </Button>
            )}
            <Button onClick={handleCopy}>
              <Copy className="mr-2 h-4 w-4" />
              {isCopied ? "Скопировано!" : "Копировать"}
            </Button>
            <Button onClick={handleUseInChat}>
              <MessageSquare className="mr-2 h-4 w-4" />
              Использовать в чате
            </Button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {template.category && <Badge variant="secondary">{template.category}</Badge>}
          {template.is_public && <Badge variant="outline">Публичный</Badge>}
          <Badge variant="outline">{template.usage_count} использований</Badge>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 px-6 py-6">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Variables Input */}
          {variables.length > 0 && (
            <div className="rounded-lg border border-border bg-muted/50 p-6">
              <h2 className="mb-4 text-lg font-semibold">Заполните переменные</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {variables.map((variable) => (
                  <div key={variable} className="space-y-2">
                    <Label htmlFor={variable}>{variable}</Label>
                    <Input
                      id={variable}
                      placeholder={`Введите ${variable}`}
                      value={variableValues[variable] || ""}
                      onChange={(e) =>
                        setVariableValues((prev) => ({
                          ...prev,
                          [variable]: e.target.value,
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
              <Button className="mt-4" onClick={handleGenerate}>
                Сгенерировать
              </Button>
            </div>
          )}

          {/* Template Content */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Содержимое шаблона</h2>
            <div className="rounded-lg border border-border bg-muted/30 p-6">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                {generatedContent || template.content}
              </pre>
            </div>
          </div>

          {/* Metadata */}
          <div className="rounded-lg border border-border p-6">
            <h2 className="mb-3 text-lg font-semibold">Информация</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Создан:</dt>
                <dd>{new Date(template.created_at).toLocaleDateString("ru-RU")}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Обновлен:</dt>
                <dd>{new Date(template.updated_at).toLocaleDateString("ru-RU")}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Использований:</dt>
                <dd>{template.usage_count}</dd>
              </div>
            </dl>
          </div>
        </div>
      </ScrollArea>

      {isOwner && (
        <TemplateDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSave={onUpdate}
          userId={user.id}
          template={template}
        />
      )}
    </div>
  )
}
