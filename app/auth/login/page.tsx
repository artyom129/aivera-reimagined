"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sparkles } from 'lucide-react'
import Link from "next/link"
import { useState } from "react"
import { ResendConfirmationButton } from "@/components/auth/resend-confirmation-button"
import { getSafeNextPath } from "@/lib/auth"

type AuthResponse = {
  error?: string
  code?: string
}

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [needsConfirmation, setNeedsConfirmation] = useState(false)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
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
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Произошла ошибка авторизации.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-b from-background to-muted/20 p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">AIvera</span>
          </Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Вход</CardTitle>
            <CardDescription>Введите email и пароль для входа в систему</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="teacher@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <Label htmlFor="password">Пароль</Label>
                    <Link href="/auth/forgot-password" className="text-xs underline underline-offset-4">
                      Забыли пароль?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
                {needsConfirmation && email.trim() && (
                  <ResendConfirmationButton email={email.trim().toLowerCase()} />
                )}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Вход..." : "Войти"}
                </Button>
              </div>
              <div className="mt-4 text-center text-sm">
                Нет аккаунта?{" "}
                <Link href="/auth/sign-up" className="underline underline-offset-4">
                  Зарегистрироваться
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
