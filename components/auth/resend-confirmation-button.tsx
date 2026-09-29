"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

interface ResendConfirmationButtonProps {
  email: string
}

export function ResendConfirmationButton({ email }: ResendConfirmationButtonProps) {
  const [status, setStatus] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleResend = async () => {
    if (!email || isLoading) return

    setIsLoading(true)
    setStatus(null)
    const response = await fetch("/api/auth/resend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
    const result = (await response.json().catch(() => ({}))) as { error?: string }

    setStatus(response.ok ? "Новое письмо отправлено. Проверьте также папку «Спам»." : result.error || "Не удалось отправить письмо.")
    setIsLoading(false)
  }

  return (
    <div className="space-y-2">
      <Button type="button" variant="outline" className="w-full" onClick={handleResend} disabled={!email || isLoading}>
        {isLoading ? "Отправляем..." : "Отправить письмо повторно"}
      </Button>
      {status && <p className="text-center text-xs text-muted-foreground" role="status">{status}</p>}
    </div>
  )
}
