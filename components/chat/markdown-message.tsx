"use client"

import { memo } from "react"
import ReactMarkdown, { type Components } from "react-markdown"
import remarkGfm from "remark-gfm"
import { cn } from "@/lib/utils"

const components: Components = {
  // External images are never loaded: they could leak who is reading the chat.
  img: ({ alt }) => <span className="text-muted-foreground">[изображение: {alt || "без описания"}]</span>,
  table: ({ children }) => (
    <div className="table-scroll">
      <table>{children}</table>
    </div>
  ),
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer nofollow">
      {children}
    </a>
  ),
}

function MarkdownMessageBase({ content, isUser = false }: { content: string; isUser?: boolean }) {
  return (
    <div className={cn("markdown-content", isUser && "user-message")}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  )
}

export const MarkdownMessage = memo(MarkdownMessageBase)
