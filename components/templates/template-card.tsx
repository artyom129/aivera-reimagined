"use client"

import { extractVariables } from "@/lib/templates"
import type { Database } from "@/lib/types/database"

type Template = Database["public"]["Tables"]["templates"]["Row"]

export function TemplateCard({ template, onOpen }: { template: Template; onOpen: () => void }) {
  const fields = extractVariables(template.content)

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex h-full flex-col rounded-lg border bg-card p-4 text-left transition-colors hover:border-ring/50 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      <span className="font-medium leading-snug">{template.name}</span>
      {template.description && (
        <span className="mt-1 line-clamp-2 text-sm text-muted-foreground">{template.description}</span>
      )}
      <span className="mt-auto flex flex-wrap gap-x-3 gap-y-1 pt-4 text-xs text-muted-foreground">
        {template.category && <span>{template.category}</span>}
        {fields.length > 0 && <span>полей: {fields.length}</span>}
        <span>использований: {template.usage_count}</span>
        {template.is_public && <span className="text-primary">общий</span>}
      </span>
    </button>
  )
}
