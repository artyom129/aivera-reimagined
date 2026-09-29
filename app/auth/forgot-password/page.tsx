"use client"

import type React from "react"
import Link from "next/link"
import { useState } from "react"
import { Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsLoading(true)
    setError(null)
    setMessage(null)

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const result = (await response.json().catch(() => ({}))) as { error?: string }
      if (!response.ok) throw new Error(result.error || "Не удалось отправить письмо.")
      setMessage("Письмо для смены пароля отправлено. Проверьте также папку «Спам».")
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Не удалось отправить письмо.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-b from-background to-muted/20 p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold">AIvera</span>
        </Link>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Восстановление пароля</CardTitle>
            <CardDescription>Получите безопасную ссылку для установки нового пароля.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
              </div>
              {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
              {message && <div className="rounded-md bg-green-500/10 p-3 text-sm text-green-700">{message}</div>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Отправляем..." : "Отправить ссылку"}
              </Button>
              <Link href="/auth/login" className="block text-center text-sm underline underline-offset-4">
                Вернуться ко входу
              </Link>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
