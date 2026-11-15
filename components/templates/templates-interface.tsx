"use client"

import { useState } from "react"
import Link from "next/link"
import type { User } from "@supabase/supabase-js"
import { ArrowLeft, Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Database } from "@/lib/types/database"
import { cn } from "@/lib/utils"
import { TemplateCard } from "./template-card"
import { TemplateDetail } from "./template-detail"
import { TemplateDialog } from "./template-dialog"

type Template = Database["public"]["Tables"]["templates"]["Row"]
type Tab = "mine" | "shared"

export function TemplatesInterface({ user, templates: initialTemplates }: { user: User; templates: Template[] }) {
  const [templates, setTemplates] = useState(initialTemplates)
  const [tab, setTab] = useState<Tab>("mine")
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("")
  const [creating, setCreating] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)

  const opened = templates.find((template) => template.id === openId)
  if (opened) {
    return (
      <TemplateDetail
        template={opened}
        user={user}
        onBack={() => setOpenId(null)}
        onUpdate={(updated) => setTemplates((previous) => previous.map((item) => (item.id === updated.id ? updated : item)))}
        onDelete={(id) => {
          setTemplates((previous) => previous.filter((item) => item.id !== id))
          setOpenId(null)
        }}
      />
    )
  }

  const mine = templates.filter((template) => template.user_id === user.id)
  const shared = templates.filter((template) => template.is_public && template.user_id !== user.id)
  const source = tab === "mine" ? mine : shared
  const categories = [...new Set(source.map((template) => template.category).filter(Boolean))] as string[]
  const query = search.trim().toLowerCase()
  const visible = source.filter(
    (template) =>
      (!category || template.category === category) &&
      (!query ||
        template.name.toLowerCase().includes(query) ||
        template.description?.toLowerCase().includes(query) ||
        template.content.toLowerCase().includes(query)),
  )

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
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-medium tracking-[-0.01em] sm:text-4xl">Шаблоны</h1>
            <p className="mt-1.5 text-muted-foreground">Запросы, которые вы повторяете, с полями для подстановки</p>
          </div>
          <Button onClick={() => setCreating(true)}>
            <Plus className="size-4" />
            Новый шаблон
          </Button>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div role="tablist" className="inline-flex rounded-md border bg-card p-1">
            {(
              [
                ["mine", `Мои · ${mine.length}`],
                ["shared", `Общие · ${shared.length}`],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={tab === value}
                onClick={() => {
                  setTab(value)
                  setCategory("")
                }}
                className={cn(
                  "rounded px-3 py-1 text-sm",
                  tab === value ? "bg-secondary font-medium" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Поиск по шаблонам"
              aria-label="Поиск по шаблонам"
              className="pl-8"
            />
          </div>
          {categories.length > 0 && (
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              aria-label="Категория"
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Все категории</option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          )}
        </div>

        {visible.length === 0 ? (
          <div className="mt-10 rounded-lg border border-dashed px-6 py-12 text-center">
            <p className="font-medium">
              {query || category ? "Ничего не нашлось" : tab === "mine" ? "У вас пока нет шаблонов" : "Коллеги ещё ничем не поделились"}
            </p>
            {tab === "mine" && !query && !category && (
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                Например: «Составь 5 задач на тему {"{тема}"} для {"{класс}"} с ответами». Дальше достаточно заполнить два поля.
              </p>
            )}
          </div>
        ) : (
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((template) => (
              <TemplateCard key={template.id} template={template} onOpen={() => setOpenId(template.id)} />
            ))}
          </div>
        )}
      </div>

      <TemplateDialog
        open={creating}
        onOpenChange={setCreating}
        userId={user.id}
        onSave={(created) => {
          setTemplates((previous) => [created, ...previous])
          setTab("mine")
        }}
      />
    </main>
  )
}
