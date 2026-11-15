"use client"

import type React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthShell, FormMessage } from "@/components/auth/auth-shell"
import { PENDING_CONFIRMATION_EMAIL_KEY } from "@/lib/auth"

type SignUpResponse = { error?: string; code?: string; hasSession?: boolean }

const MIN_PASSWORD = 8

export default function SignUpPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [repeatPassword, setRepeatPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [alreadyExists, setAlreadyExists] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSignUp = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setAlreadyExists(false)

    if (password.length < MIN_PASSWORD) return setError(`Пароль должен быть не короче ${MIN_PASSWORD} символов`)
    if (password !== repeatPassword) return setError("Пароли не совпадают")

    setIsLoading(true)
    try {
      const response = await fetch("/api/auth/sign-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, fullName }),
      })
      const result = (await response.json().catch(() => ({}))) as SignUpResponse

      if (!response.ok) {
        setAlreadyExists(result.code === "user_already_exists")
        throw new Error(result.error || "Не удалось создать аккаунт.")
      }

      if (result.hasSession) {
        window.location.assign(new URL("/chat", window.location.origin).toString())
        return
      }
      sessionStorage.setItem(PENDING_CONFIRMATION_EMAIL_KEY, email.trim().toLowerCase())
      router.push("/auth/sign-up-success")
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Не удалось создать аккаунт.")
      setIsLoading(false)
    }
  }

  return (
    <AuthShell
      title="Регистрация"
      description="Аккаунт нужен, чтобы сохранять чаты и шаблоны."
      footer={
        <>
          Уже есть аккаунт?{" "}
          <Link href="/auth/login" className="font-medium text-foreground underline underline-offset-4">
            Войти
          </Link>
        </>
      }
    >
      <form onSubmit={handleSignUp} className="grid gap-5">
        <div className="grid gap-1.5">
          <Label htmlFor="fullName">Как к вам обращаться</Label>
          <Input
            id="fullName"
            autoComplete="name"
            placeholder="Айгуль Серикова"
            required
            maxLength={200}
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
          />
        </div>
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
          <Label htmlFor="password">Пароль</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            minLength={MIN_PASSWORD}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <p className="text-xs text-muted-foreground">Не короче {MIN_PASSWORD} символов</p>
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
        {error && (
          <FormMessage tone="error">
            {error}
            {alreadyExists && (
              <>
                {" "}
                <Link href="/auth/forgot-password" className="underline underline-offset-4">
                  Восстановить пароль
                </Link>
              </>
            )}
          </FormMessage>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Создаём аккаунт..." : "Создать аккаунт"}
        </Button>
      </form>
    </AuthShell>
  )
}
