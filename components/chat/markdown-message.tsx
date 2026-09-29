"use client"

import { cn } from "@/lib/utils"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface MarkdownMessageProps {
  content: string
  isUser?: boolean
}

export function MarkdownMessage({ content, isUser = false }: MarkdownMessageProps) {
  return (
    <div
      className={cn(
        "markdown-content prose prose-sm max-w-none dark:prose-invert prose-pre:bg-muted prose-pre:text-foreground",
        isUser && "user-message",
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          img: ({ alt }) => (
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              📎 {alt || "Изображение скрыто"}
            </span>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
