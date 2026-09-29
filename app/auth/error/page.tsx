import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, Sparkles } from "lucide-react"
import Link from "next/link"

export default async function ErrorPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams
  const messages: Record<string, string> = {
    missing_code: "Ссылка подтверждения неполная или устарела. Запросите новое письмо.",
    confirmation_failed: "Не удалось подтвердить почту. Возможно, ссылка уже использована или истекла.",
  }
  const message = params?.error ? messages[params.error] || "Не удалось завершить авторизацию." : "Произошла неизвестная ошибка."

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
              <AlertCircle className="h-16 w-16 text-destructive" />
            </div>
            <CardTitle className="text-center text-2xl">Произошла ошибка</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{message}</div>
            <Link href="/auth/login" className="block">
              <Button className="w-full">Вернуться к входу</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
