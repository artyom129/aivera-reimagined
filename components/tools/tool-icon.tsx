import { BookOpenText, ClipboardCheck, Mail, MessageSquareQuote, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

const ICONS: Record<string, LucideIcon> = {
  "lesson-plan": BookOpenText,
  test: ClipboardCheck,
  feedback: MessageSquareQuote,
  "parent-letter": Mail,
}

export function ToolIcon({ slug, className, boxed = false }: { slug: string; className?: string; boxed?: boolean }) {
  const Icon = ICONS[slug] ?? BookOpenText
  if (!boxed) return <Icon className={cn("size-4", className)} aria-hidden />
  return (
    <span
      className={cn("inline-flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary", className)}
      aria-hidden
    >
      <Icon className="size-[18px]" />
    </span>
  )
}
