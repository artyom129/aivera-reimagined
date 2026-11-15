"use client"

import type React from "react"
import { useCallback, useRef, useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type ConfirmOptions = {
  title: string
  description?: string
  confirmLabel?: string
  destructive?: boolean
}

type PromptOptions = {
  title: string
  description?: string
  label?: string
  initialValue?: string
  placeholder?: string
  maxLength?: number
  confirmLabel?: string
}

type Pending =
  | { kind: "confirm"; options: ConfirmOptions; resolve: (value: boolean) => void }
  | { kind: "prompt"; options: PromptOptions; resolve: (value: string | null) => void }

// Promise-based replacement for window.confirm / window.prompt.
// Render `dialogs` once in the component that calls the hook.
export function useDialogs() {
  const [pending, setPending] = useState<Pending | null>(null)
  const [text, setText] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const confirm = useCallback(
    (options: ConfirmOptions) => new Promise<boolean>((resolve) => setPending({ kind: "confirm", options, resolve })),
    [],
  )

  const prompt = useCallback((options: PromptOptions) => {
    setText(options.initialValue ?? "")
    return new Promise<string | null>((resolve) => setPending({ kind: "prompt", options, resolve }))
  }, [])

  const close = (result: boolean | string | null) => {
    if (!pending) return
    if (pending.kind === "confirm") pending.resolve(result === true)
    else pending.resolve(typeof result === "string" ? result : null)
    setPending(null)
  }

  const submitPrompt = (event: React.FormEvent) => {
    event.preventDefault()
    const value = text.trim()
    if (value) close(value)
  }

  const dialogs = (
    <>
      <AlertDialog open={pending?.kind === "confirm"} onOpenChange={(open) => !open && close(false)}>
        {pending?.kind === "confirm" && (
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{pending.options.title}</AlertDialogTitle>
              {pending.options.description && (
                <AlertDialogDescription>{pending.options.description}</AlertDialogDescription>
              )}
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Отмена</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => close(true)}
                className={cn(pending.options.destructive && "bg-destructive text-white hover:bg-destructive/90")}
              >
                {pending.options.confirmLabel ?? "Подтвердить"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        )}
      </AlertDialog>

      <Dialog open={pending?.kind === "prompt"} onOpenChange={(open) => !open && close(null)}>
        {pending?.kind === "prompt" && (
          <DialogContent
            className="sm:max-w-md"
            onOpenAutoFocus={(event) => {
              event.preventDefault()
              inputRef.current?.select()
            }}
          >
            <form onSubmit={submitPrompt} className="grid gap-4">
              <DialogHeader>
                <DialogTitle>{pending.options.title}</DialogTitle>
                {pending.options.description && <DialogDescription>{pending.options.description}</DialogDescription>}
              </DialogHeader>
              <Input
                ref={inputRef}
                aria-label={pending.options.label ?? pending.options.title}
                value={text}
                placeholder={pending.options.placeholder}
                maxLength={pending.options.maxLength}
                onChange={(event) => setText(event.target.value)}
              />
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => close(null)}>
                  Отмена
                </Button>
                <Button type="submit" disabled={!text.trim()}>
                  {pending.options.confirmLabel ?? "Сохранить"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        )}
      </Dialog>
    </>
  )

  return { confirm, prompt, dialogs }
}
