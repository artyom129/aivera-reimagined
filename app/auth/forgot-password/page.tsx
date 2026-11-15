"use client"

import type React from "react"
import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthShell, FormMessage } from "@/components/auth/auth-shell"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const result = (await response.json().catch(() => ({}))) as { error?: string }
      if (!response.ok) throw new Error(result.error || "Не удалось отправить письмо.")
      setSent(true)
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Не удалось отправить письмо.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthShell
      title="Восстановление пароля"
      description="Пришлём ссылку, по которой можно задать новый пароль."
      footer={
        <Link href="/auth/login" className="underline underline-offset-4 hover:text-foreground">
          Вернуться ко входу
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="grid gap-5">
        <div className="grid gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        {error && <FormMessage tone="error">{error}</FormMessage>}
        {sent && <FormMessage tone="success">Письмо отправлено. Если его нет, загляните в «Спам».</FormMessage>}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Отправляем..." : sent ? "Отправить ещё раз" : "Отправить ссылку"}
        </Button>
      </form>
    </AuthShell>
  )
}
