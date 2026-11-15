"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { AuthShell } from "@/components/auth/auth-shell"
import { ResendConfirmationButton } from "@/components/auth/resend-confirmation-button"
import { PENDING_CONFIRMATION_EMAIL_KEY } from "@/lib/auth"

export default function SignUpSuccessPage() {
  const [email, setEmail] = useState("")

  useEffect(() => {
    setEmail(sessionStorage.getItem(PENDING_CONFIRMATION_EMAIL_KEY) || "")
  }, [])

  return (
    <AuthShell
      title="Проверьте почту"
      description={email ? <>Мы отправили ссылку на {email}.</> : "Мы отправили ссылку на адрес из регистрации."}
    >
      <p className="text-sm leading-6 text-muted-foreground">
        Откройте письмо и нажмите на ссылку, после этого можно входить. Письма нет через пару минут? Проверьте «Спам» или
        отправьте его ещё раз.
      </p>
      <div className="mt-6 grid gap-3">
        {email && <ResendConfirmationButton email={email} />}
        <Button asChild variant="outline">
          <Link href="/auth/login">Перейти ко входу</Link>
        </Button>
      </div>
    </AuthShell>
  )
}
