"use client"

import type React from "react"
import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthShell, FormMessage } from "@/components/auth/auth-shell"
import { ResendConfirmationButton } from "@/components/auth/resend-confirmation-button"
import { getSafeNextPath } from "@/lib/auth"

type AuthResponse = { error?: string; code?: string }

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [needsConfirmation, setNeedsConfirmation] = useState(false)

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsLoading(true)
    setError(null)
    setNeedsConfirmation(false)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const result = (await response.json().catch(() => ({}))) as AuthResponse

      if (!response.ok) {
        setNeedsConfirmation(result.code?.toLowerCase() === "email_not_confirmed")
        throw new Error(result.error || "Не удалось войти. Попробуйте ещё раз.")
      }

      const next = getSafeNextPath(new URLSearchParams(window.location.search).get("next"))
      window.location.assign(new URL(next, window.location.origin).toString())
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Не удалось войти.")
      setIsLoading(false)
    }
  }

  return (
    <AuthShell
      title="Вход"
      description="С возвращением. Чаты и шаблоны ждут на месте."
      footer={
        <>
          Нет аккаунта?{" "}
          <Link href="/auth/sign-up" className="font-medium text-foreground underline underline-offset-4">
            Зарегистрироваться
          </Link>
        </>
      }
    >
      <form onSubmit={handleLogin} className="grid gap-5">
        <div className="grid gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="teacher@school.kz"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Пароль</Label>
            <Link href="/auth/forgot-password" className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground">
              Забыли пароль?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        {error && <FormMessage tone="error">{error}</FormMessage>}
        {needsConfirmation && email.trim() && <ResendConfirmationButton email={email.trim().toLowerCase()} />}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Входим..." : "Войти"}
        </Button>
      </form>
    </AuthShell>
  )
}
