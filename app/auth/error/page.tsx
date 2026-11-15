import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AuthShell, FormMessage } from "@/components/auth/auth-shell"

const MESSAGES: Record<string, string> = {
  missing_code: "Ссылка неполная или устарела. Запросите новое письмо.",
  confirmation_failed: "Почту подтвердить не удалось. Возможно, ссылкой уже воспользовались или она истекла.",
}

export default async function AuthErrorPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams
  const message = (error && MESSAGES[error]) || "Не удалось завершить вход."

  return (
    <AuthShell title="Что-то пошло не так">
      <FormMessage tone="error">{message}</FormMessage>
      <div className="mt-6 grid gap-3">
        <Button asChild>
          <Link href="/auth/login">Ко входу</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/auth/forgot-password">Восстановить пароль</Link>
        </Button>
      </div>
    </AuthShell>
  )
}
