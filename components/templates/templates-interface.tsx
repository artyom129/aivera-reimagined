"use client"

import { useState } from "react"
import type { User } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Search, Sparkles, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import type { Database } from "@/lib/types/database"
import { TemplateCard } from "./template-card"
import { TemplateDialog } from "./template-dialog"
import { TemplateDetail } from "./template-detail"

type Template = Database["public"]["Tables"]["templates"]["Row"]
interface TemplatesInterfaceProps {
  user: User
  templates: Template[]
}

export function TemplatesInterface({ user, templates: initialTemplates }: TemplatesInterfaceProps) {
  const [templates, setTemplates] = useState(initialTemplates)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const router = useRouter()

  const categories = Array.from(new Set(templates.map((t) => t.category).filter(Boolean))) as string[]

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !selectedCategory || template.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const myTemplates = filteredTemplates.filter((t) => t.user_id === user.id)
  const publicTemplates = filteredTemplates.filter((t) => t.is_public && t.user_id !== user.id)

  if (selectedTemplate) {
    return (
      <TemplateDetail
        template={selectedTemplate}
        user={user}
        onBack={() => setSelectedTemplate(null)}
        onUpdate={(updated) => {
          setTemplates((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
          setSelectedTemplate(updated)
        }}
      />
    )
  }

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border px-3 py-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push("/chat")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold sm:text-2xl">Шаблоны</h1>
            </div>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Создать шаблон
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Поиск шаблонов..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={selectedCategory || ""}
            onChange={(e) => setSelectedCategory(e.target.value || null)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Все категории</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 px-3 py-4 sm:px-6">
        <Tabs defaultValue="my" className="w-full">
          <TabsList>
            <TabsTrigger value="my">Мои шаблоны ({myTemplates.length})</TabsTrigger>
            <TabsTrigger value="public">Публичные ({publicTemplates.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="my" className="mt-6">
            {myTemplates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Sparkles className="h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">Нет шаблонов</h3>
                <p className="mt-2 text-sm text-muted-foreground">Создайте свой первый шаблон</p>
                <Button className="mt-4" onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Создать шаблон
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {myTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onClick={() => setSelectedTemplate(template)}
                    onDelete={(id) => setTemplates((prev) => prev.filter((t) => t.id !== id))}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="public" className="mt-6">
            {publicTemplates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Sparkles className="h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">Нет публичных шаблонов</h3>
                <p className="mt-2 text-sm text-muted-foreground">Пока нет доступных шаблонов</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {publicTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onClick={() => setSelectedTemplate(template)}
                    isPublic
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </ScrollArea>

      <TemplateDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        userId={user.id}
        onSave={(newTemplate) => {
          setTemplates((prev) => [newTemplate, ...prev])
          setIsCreateDialogOpen(false)
        }}
      />
    </div>
  )
}
