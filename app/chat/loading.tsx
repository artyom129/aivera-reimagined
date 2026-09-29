import { Sparkles } from "lucide-react"

export default function ChatLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex items-center gap-3 text-muted-foreground">
        <Sparkles className="h-5 w-5 animate-pulse" />
        <span>Загружаем чаты…</span>
      </div>
    </div>
  )
}
