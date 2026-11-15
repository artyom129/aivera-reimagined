"use client"

import { useMemo, useState } from "react"
import { Eye, MoreHorizontal, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useDialogs } from "@/components/dialogs"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import type { Database } from "@/lib/types/database"

type Template = Database["public"]["Tables"]["templates"]["Row"] & {
  users?: { email: string; full_name: string | null } | null
}

export function AdminTemplatesTable({ templates: initialTemplates }: { templates: Template[] }) {
  const supabase = useMemo(() => createClient(), [])
  const { toast } = useToast()
  const { confirm, dialogs } = useDialogs()
  const [templates, setTemplates] = useState(initialTemplates)
  const [search, setSearch] = useState("")
  const [preview, setPreview] = useState<Template | null>(null)

  const query = search.trim().toLowerCase()
  const visible = templates.filter(
    (template) =>
      !query ||
      template.name.toLowerCase().includes(query) ||
      template.category?.toLowerCase().includes(query) ||
      template.users?.email.toLowerCase().includes(query),
  )

  const remove = async (template: Template) => {
    const ok = await confirm({
      title: `Удалить «${template.name}»?`,
      description: "Шаблон исчезнет и у автора. Отменить нельзя.",
      confirmLabel: "Удалить",
      destructive: true,
    })
    if (!ok) return
    const { error } = await supabase.from("templates").delete().eq("id", template.id)
    if (error) return toast({ title: "Шаблон не удалён", variant: "destructive" })
    setTemplates((previous) => previous.filter((item) => item.id !== template.id))
  }

  const togglePublic = async (template: Template) => {
    const { data, error } = await supabase
      .from("templates")
      .update({ is_public: !template.is_public })
      .eq("id", template.id)
      .select("*, users(email, full_name)")
      .single()
    if (error || !data) return toast({ title: "Не получилось", variant: "destructive" })
    setTemplates((previous) => previous.map((item) => (item.id === data.id ? data : item)))
    toast({ title: data.is_public ? "Шаблон опубликован" : "Шаблон снят с публикации" })
  }

  return (
    <div className="space-y-4">
      <div className="relative w-full sm:w-72">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Название, категория, автор"
          aria-label="Поиск шаблонов"
          className="pl-8"
        />
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Шаблон</TableHead>
              <TableHead>Автор</TableHead>
              <TableHead>Доступ</TableHead>
              <TableHead className="text-right">Использований</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  Шаблонов нет
                </TableCell>
              </TableRow>
            )}
            {visible.map((template) => (
              <TableRow key={template.id}>
                <TableCell className="max-w-xs">
                  <p className="truncate font-medium">{template.name}</p>
                  {template.category && <p className="text-xs text-muted-foreground">{template.category}</p>}
                </TableCell>
                <TableCell className="text-sm">
                  {template.users?.full_name || "—"}
                  <span className="block text-xs text-muted-foreground">{template.users?.email}</span>
                </TableCell>
                <TableCell>
                  {template.is_public ? <Badge>Публичный</Badge> : <Badge variant="outline">Личный</Badge>}
                </TableCell>
                <TableCell className="text-right tabular-nums">{template.usage_count}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8" aria-label="Действия">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setPreview(template)}>
                        <Eye className="mr-2 size-4" />
                        Посмотреть
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => togglePublic(template)}>
                        {template.is_public ? "Снять с публикации" : "Опубликовать"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => remove(template)} className="text-destructive focus:text-destructive">
                        Удалить
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={preview !== null} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{preview?.name}</DialogTitle>
          </DialogHeader>
          {preview?.description && <p className="text-sm text-muted-foreground">{preview.description}</p>}
          <pre className="whitespace-pre-wrap rounded-md border bg-muted/40 p-4 font-sans text-sm leading-6">{preview?.content}</pre>
        </DialogContent>
      </Dialog>

      {dialogs}
    </div>
  )
}
