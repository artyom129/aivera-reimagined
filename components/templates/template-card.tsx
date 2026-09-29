"use client"

import type React from "react"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreVertical, Trash2, Eye } from "lucide-react"
import type { Database } from "@/lib/types/database"
import { createClient } from "@/lib/supabase/client"

type Template = Database["public"]["Tables"]["templates"]["Row"]

interface TemplateCardProps {
  template: Template
  onClick: () => void
  onDelete?: (id: string) => void
  isPublic?: boolean
}

export function TemplateCard({ template, onClick, onDelete, isPublic }: TemplateCardProps) {
  const supabase = createClient()

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm("Удалить этот шаблон?")) return

    const { error } = await supabase.from("templates").delete().eq("id", template.id)

    if (!error && onDelete) {
      onDelete(template.id)
    }
  }

  const variables = (template.variables as string[]) || []

  return (
    <Card className="group cursor-pointer transition-all hover:border-primary hover:shadow-md" onClick={onClick}>
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-balance leading-tight">{template.name}</h3>
            {template.description && (
              <p className="mt-1 text-sm text-muted-foreground text-pretty line-clamp-2">{template.description}</p>
            )}
          </div>
          {!isPublic && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onClick}>
                  <Eye className="mr-2 h-4 w-4" />
                  Просмотр
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Удалить
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {template.category && (
            <Badge variant="secondary" className="text-xs">
              {template.category}
            </Badge>
          )}
          {variables.length > 0 && (
            <Badge variant="outline" className="text-xs">
              {variables.length} переменных
            </Badge>
          )}
          {template.is_public && (
            <Badge variant="outline" className="text-xs">
              Публичный
            </Badge>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>{template.usage_count} использований</span>
          <span>{new Date(template.created_at).toLocaleDateString("ru-RU")}</span>
        </div>
      </div>
    </Card>
  )
}
