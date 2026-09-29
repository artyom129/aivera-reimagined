"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Eye, Trash2, Search } from "lucide-react"
import type { Database } from "@/lib/types/database"
import { createClient } from "@/lib/supabase/client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type Template = Database["public"]["Tables"]["templates"]["Row"] & {
  users?: { email: string; full_name: string | null } | null
}

interface AdminTemplatesTableProps {
  templates: Template[]
}

export function AdminTemplatesTable({ templates: initialTemplates }: AdminTemplatesTableProps) {
  const [templates, setTemplates] = useState(initialTemplates)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const supabase = createClient()

  const filteredTemplates = templates.filter(
    (template) =>
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.category?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleDelete = async (templateId: string) => {
    if (!confirm("Удалить этот шаблон?")) return

    const { error } = await supabase.from("templates").delete().eq("id", templateId)

    if (!error) {
      setTemplates((prev) => prev.filter((t) => t.id !== templateId))
    }
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Поиск шаблонов..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Название</TableHead>
              <TableHead>Категория</TableHead>
              <TableHead>Автор</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Использований</TableHead>
              <TableHead>Дата создания</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTemplates.map((template) => (
              <TableRow key={template.id}>
                <TableCell>
                  <div>
                    <p className="font-medium text-balance">{template.name}</p>
                    {template.description && (
                      <p className="text-xs text-muted-foreground text-pretty line-clamp-1">{template.description}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {template.category ? <Badge variant="secondary">{template.category}</Badge> : "-"}
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <p>{template.users?.full_name || "Неизвестно"}</p>
                    <p className="text-xs text-muted-foreground">{template.users?.email}</p>
                  </div>
                </TableCell>
                <TableCell>
                  {template.is_public ? (
                    <Badge variant="default">Публичный</Badge>
                  ) : (
                    <Badge variant="outline">Приватный</Badge>
                  )}
                </TableCell>
                <TableCell>{template.usage_count}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(template.created_at).toLocaleDateString("ru-RU")}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => setSelectedTemplate(template)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(template.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredTemplates.length === 0 && <p className="py-8 text-center text-muted-foreground">Шаблоны не найдены</p>}

      {/* Template Preview Dialog */}
      <Dialog open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedTemplate?.name}</DialogTitle>
          </DialogHeader>
          {selectedTemplate && (
            <div className="space-y-4">
              {selectedTemplate.description && (
                <div>
                  <h3 className="mb-2 font-semibold">Описание</h3>
                  <p className="text-sm text-muted-foreground">{selectedTemplate.description}</p>
                </div>
              )}
              <div>
                <h3 className="mb-2 font-semibold">Содержимое</h3>
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <pre className="whitespace-pre-wrap font-sans text-sm">{selectedTemplate.content}</pre>
                </div>
              </div>
              {selectedTemplate.variables && (selectedTemplate.variables as string[]).length > 0 && (
                <div>
                  <h3 className="mb-2 font-semibold">Переменные</h3>
                  <div className="flex flex-wrap gap-2">
                    {(selectedTemplate.variables as string[]).map((variable) => (
                      <Badge key={variable} variant="outline">
                        {variable}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
