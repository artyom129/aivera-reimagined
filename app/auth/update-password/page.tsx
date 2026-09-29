"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("")
  const [repeatPassword, setRepeatPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    if (password !== repeatPassword) {
      setError("Пароли не совпадают.")
      return
    }

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
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-b from-background to-muted/20 p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center justify-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold">AIvera</span>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Новый пароль</CardTitle>
            <CardDescription>Установите новый пароль для аккаунта.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-2">
                <Label htmlFor="password">Новый пароль</Label>
                <Input id="password" type="password" minLength={6} required value={password} onChange={(event) => setPassword(event.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="repeat-password">Повторите пароль</Label>
                <Input id="repeat-password" type="password" minLength={6} required value={repeatPassword} onChange={(event) => setRepeatPassword(event.target.value)} />
              </div>
              {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Сохраняем..." : "Сохранить пароль"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
