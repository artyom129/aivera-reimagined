"use client"

import type React from "react"
import { useEffect, useRef } from "react"
import { ArrowUp, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type ComposerProps = {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  onStop: () => void
  isBusy: boolean
  privacyConfirmed: boolean
  onPrivacyChange: (value: boolean) => void
  placeholder?: string
}

const MAX_HEIGHT = 240

export function Composer({
  value,
  onChange,
  onSend,
  onStop,
  isBusy,
  privacyConfirmed,
  onPrivacyChange,
  placeholder = "Опишите задачу",
}: ComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = "auto"
    textarea.style.height = `${Math.min(textarea.scrollHeight, MAX_HEIGHT)}px`
    textarea.style.overflowY = textarea.scrollHeight > MAX_HEIGHT ? "auto" : "hidden"
  }, [value])

  const canSend = value.trim().length > 0 && privacyConfirmed && !isBusy

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      if (canSend) onSend()
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div
        className={cn(
          "flex items-end gap-2 rounded-lg border bg-card p-2 shadow-xs transition-colors",
          "focus-within:border-ring/60",
        )}
      >
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label="Сообщение"
          maxLength={12_000}
          className="max-h-60 min-h-9 flex-1 resize-none bg-transparent px-2 py-1.5 text-[15px] leading-6 outline-none placeholder:text-muted-foreground"
        />
        {isBusy ? (
          <Button size="icon" variant="secondary" onClick={onStop} aria-label="Остановить" className="size-9 shrink-0">
            <Square className="size-3.5 fill-current" />
          </Button>
        ) : (
          <Button size="icon" onClick={onSend} disabled={!canSend} aria-label="Отправить" className="size-9 shrink-0">
            <ArrowUp className="size-4" />
          </Button>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-1 text-xs text-muted-foreground">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={privacyConfirmed}
            onChange={(event) => onPrivacyChange(event.target.checked)}
            className="size-3.5 accent-[var(--primary)]"
          />
          В тексте нет личных данных учеников
        </label>
        <span className="hidden items-center gap-1.5 sm:flex">
          <kbd className="keycap">Enter</kbd> отправить
          <kbd className="keycap ml-2">Shift</kbd>+<kbd className="keycap">Enter</kbd> новая строка
        </span>
      </div>
    </div>
  )
}
