"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthShell, FormMessage } from "@/components/auth/auth-shell"

const MIN_PASSWORD = 8

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [repeatPassword, setRepeatPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    if (password.length < MIN_PASSWORD) return setError(`Пароль должен быть не короче ${MIN_PASSWORD} символов`)
    if (password !== repeatPassword) return setError("Пароли не совпадают")

    setIsLoading(true)
    try {
      const response = await fetch("/api/auth/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })
      const result = (await response.json().catch(() => ({}))) as { error?: string }
      if (!response.ok) throw new Error(result.error || "Не удалось изменить пароль.")
      router.replace("/chat")
      router.refresh()
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Не удалось изменить пароль.")
      setIsLoading(false)
    }
  }

  return (
    <AuthShell title="Новый пароль" description="Придумайте пароль, который не используете на других сайтах.">
      <form onSubmit={handleSubmit} className="grid gap-5">
        <div className="grid gap-1.5">
          <Label htmlFor="password">Новый пароль</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            minLength={MIN_PASSWORD}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="repeat-password">Пароль ещё раз</Label>
          <Input
            id="repeat-password"
            type="password"
            autoComplete="new-password"
            required
            value={repeatPassword}
            onChange={(event) => setRepeatPassword(event.target.value)}
          />
        </div>
        {error && <FormMessage tone="error">{error}</FormMessage>}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Сохраняем..." : "Сохранить пароль"}
        </Button>
      </form>
    </AuthShell>
  )
}
