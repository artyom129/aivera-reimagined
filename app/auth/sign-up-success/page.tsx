"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Sparkles } from "lucide-react"
import Link from "next/link"
import { ResendConfirmationButton } from "@/components/auth/resend-confirmation-button"
import { PENDING_CONFIRMATION_EMAIL_KEY } from "@/lib/auth"

export default function SignUpSuccessPage() {
  const [email, setEmail] = useState("")

  useEffect(() => {
    setEmail(sessionStorage.getItem(PENDING_CONFIRMATION_EMAIL_KEY) || "")
  }, [])

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
            <div className="mb-4 flex justify-center">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-center text-2xl">Подтвердите почту</CardTitle>
            <CardDescription className="text-center">
              {email ? `Письмо отправлено на ${email}` : "Проверьте адрес, указанный при регистрации"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-sm text-muted-foreground">
              Откройте ссылку в письме. Если письма нет, проверьте «Спам» и используйте повторную отправку.
            </p>
            {email && <ResendConfirmationButton email={email} />}
            <Link href="/auth/login" className="block">
              <Button className="w-full">Перейти к входу</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
