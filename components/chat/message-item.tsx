"use client"

import { memo, useRef, useState } from "react"
import { Check, Copy, Download, FileText, MoreHorizontal, Printer, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { BrandMark } from "@/components/brand"
import { MarkdownMessage } from "@/components/chat/markdown-message"
import { downloadMarkdown, downloadWord, printHtml } from "@/lib/export"
import { cn } from "@/lib/utils"

type MessageItemProps = {
  role: "user" | "assistant"
  content: string
  exportTitle: string
  userInitial?: string
  streaming?: boolean
  canRegenerate?: boolean
  onRegenerate?: () => void
}

function ToolbarButton({ onClick, children, label }: { onClick: () => void; children: React.ReactNode; label: string }) {
  return (
    <Button variant="ghost" size="sm" onClick={onClick} className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground">
      {children}
      <span className="hidden sm:inline">{label}</span>
    </Button>
  )
}

function MessageItemBase({
  role,
  content,
  exportTitle,
  userInitial = "?",
  streaming,
  canRegenerate,
  onRegenerate,
}: MessageItemProps) {
  const bodyRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)

  if (role === "user") {
    return (
      <div className="flex justify-end gap-3">
        <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-lg rounded-tr-sm bg-secondary px-4 py-2.5 text-[15px] leading-6 text-secondary-foreground sm:max-w-[75%]">
          {content}
        </div>
        <span className="mt-0.5 hidden size-7 shrink-0 items-center justify-center rounded-full border bg-card text-xs font-medium uppercase sm:flex">
          {userInitial}
        </span>
      </div>
    )
  }

  const renderedHtml = () => bodyRef.current?.querySelector(".markdown-content")?.innerHTML ?? ""

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard can be blocked on plain http
    }
  }

  return (
    <article className="flex gap-3">
      <BrandMark className="mt-0.5 hidden size-7 text-[13px] sm:inline-flex" />
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex items-center gap-2 text-sm">
          <span className="font-medium">AIvera</span>
          {streaming && <span className="text-xs text-muted-foreground">пишет…</span>}
        </div>

        <div ref={bodyRef}>
          <MarkdownMessage content={content} />
          {streaming && <span className="ml-0.5 inline-block h-4 w-1.5 translate-y-0.5 animate-pulse rounded-sm bg-primary" />}
        </div>

        {!streaming && (
          <div className="mt-3 flex flex-wrap items-center gap-0.5 border-t pt-2">
            <ToolbarButton onClick={copy} label={copied ? "Скопировано" : "Копировать"}>
              {copied ? <Check className="size-3.5 text-primary" /> : <Copy className="size-3.5" />}
            </ToolbarButton>
            <ToolbarButton onClick={() => downloadWord(renderedHtml(), exportTitle)} label="Word">
              <FileText className="size-3.5" />
            </ToolbarButton>
            <ToolbarButton onClick={() => printHtml(renderedHtml())} label="Печать / PDF">
              <Printer className="size-3.5" />
            </ToolbarButton>
            {canRegenerate && onRegenerate && (
              <ToolbarButton onClick={onRegenerate} label="Другой вариант">
                <RotateCcw className="size-3.5" />
              </ToolbarButton>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className={cn("ml-auto size-7 text-muted-foreground")} aria-label="Ещё">
                  <MoreHorizontal className="size-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => downloadMarkdown(content, exportTitle)}>
                  <Download className="mr-2 size-4" />
                  Скачать Markdown
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </article>
  )
}

export const MessageItem = memo(MessageItemBase)

export function TypingIndicator({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)} aria-label="AIvera пишет ответ">
      <BrandMark className="hidden size-7 text-[13px] sm:inline-flex" />
      <div className="flex items-center gap-1 py-2">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
    </div>
  )
}
