"use client"

import { AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function TemplatesError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="max-w-md space-y-4 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
        <h1 className="text-2xl font-semibold">Не удалось загрузить шаблоны</h1>
        <p className="text-sm text-muted-foreground">Проверьте соединение с Supabase и попробуйте ещё раз.</p>
        <Button onClick={reset}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Повторить
        </Button>
      </div>
    </div>
  )
}
