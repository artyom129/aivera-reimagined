"use client"

import type React from "react"
import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, BookOpen, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { CHAT_AUTOSEND_STORAGE_KEY, CHAT_DRAFT_STORAGE_KEY } from "@/lib/constants"

interface LessonPlanFormProps {
  userId: string
}

export function LessonPlanForm({ userId }: LessonPlanFormProps) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [subject, setSubject] = useState("")
  const [topic, setTopic] = useState("")
  const [grade, setGrade] = useState("")
  const [duration, setDuration] = useState("45")
  const [goals, setGoals] = useState("")
  const [requirements, setRequirements] = useState("")
  const [privacyConfirmed, setPrivacyConfirmed] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (isSubmitting) return
    if (!privacyConfirmed) {
      setError("Подтвердите, что форма не содержит персональных данных учеников")
      return
    }

    setIsSubmitting(true)
    setError(null)

    const prompt = [
      "Составь подробный план урока по следующим данным:",
      `Предмет: ${subject.trim()}`,
      `Тема: ${topic.trim()}`,
      `Класс или возраст: ${grade.trim()}`,
      `Продолжительность: ${duration} минут`,
      `Цели учителя: ${goals.trim() || "Сформулируй подходящие цели самостоятельно"}`,
      `Дополнительные требования: ${requirements.trim() || "Нет"}`,
      "",
      "Подготовь готовый к проведению урок: результаты обучения, материалы, подробную таблицу этапов с таймингом, действиями учителя и учеников, дифференциацию, оценивание, рефлексию и домашнее задание.",
    ].join("\n")

    const { data: chat, error: createError } = await supabase
      .from("chats")
      .insert({
        user_id: userId,
        title: `План урока: ${topic.trim()}`.slice(0, 200),
        ai_mode: "lesson_plan",
      })
      .select()
      .single()

    if (createError || !chat) {
      setError("Не удалось создать чат для плана урока")
      setIsSubmitting(false)
      return
    }

    sessionStorage.setItem(CHAT_DRAFT_STORAGE_KEY, prompt)
    sessionStorage.setItem(CHAT_AUTOSEND_STORAGE_KEY, "1")
    router.push(`/chat?id=${chat.id}`)
  }

  return (
    <main className="min-h-dvh bg-background px-4 py-6 sm:py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center gap-3">
          <Button type="button" variant="ghost" size="icon" onClick={() => router.push("/chat")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">План урока с AI</h1>
            <p className="text-sm text-muted-foreground">Заполните параметры — Gemini подготовит готовую структуру урока</p>
          </div>
        </div>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>Параметры урока</CardTitle>
            <CardDescription>Поля с персональными данными учеников использовать не нужно.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="subject">Предмет</Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(event) => setSubject(event.target.value)}
                    placeholder="Например, математика"
                    maxLength={100}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="grade">Класс или возраст</Label>
                  <Input
                    id="grade"
                    value={grade}
                    onChange={(event) => setGrade(event.target.value)}
                    placeholder="Например, 7 класс"
                    maxLength={80}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="topic">Тема урока</Label>
                <Input
                  id="topic"
                  value={topic}
                  onChange={(event) => setTopic(event.target.value)}
                  placeholder="Например, линейные уравнения"
                  maxLength={200}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Продолжительность, минут</Label>
                <Input
                  id="duration"
                  type="number"
                  min={10}
                  max={240}
                  value={duration}
                  onChange={(event) => setDuration(event.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="goals">Цели урока</Label>
                <Textarea
                  id="goals"
                  value={goals}
                  onChange={(event) => setGoals(event.target.value)}
                  placeholder="Что ученики должны понять или научиться делать?"
                  maxLength={1000}
                  className="min-h-24"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="requirements">Дополнительные требования</Label>
                <Textarea
                  id="requirements"
                  value={requirements}
                  onChange={(event) => setRequirements(event.target.value)}
                  placeholder="Формат работы, оборудование, особенности класса — без имён и личных данных"
                  maxLength={1000}
                  className="min-h-24"
                />
              </div>

              <label className="flex items-start gap-3 rounded-2xl border bg-muted/30 p-4 text-sm">
                <input
                  type="checkbox"
                  checked={privacyConfirmed}
                  onChange={(event) => setPrivacyConfirmed(event.target.checked)}
                  className="mt-1"
                />
                <span>В форме нет имён, контактов и других персональных данных учеников. Данные можно отправить в Google Gemini.</span>
              </label>

              {error && <p className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

              <Button
                type="submit"
                size="lg"
                className="w-full rounded-full"
                disabled={isSubmitting || !privacyConfirmed}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {isSubmitting ? "Создаём план..." : "Создать план урока"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
