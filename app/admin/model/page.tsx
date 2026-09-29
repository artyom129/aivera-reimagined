"use client"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { AI_MODELS, DEFAULT_AI_MODEL_ID, type AiModelId } from "@/lib/constants"
import { cn } from "@/lib/utils"

export default function AdminModelPage() {
  const [selectedModelId, setSelectedModelId] = useState<AiModelId>(DEFAULT_AI_MODEL_ID)
  const [savedModelId, setSavedModelId] = useState<AiModelId>(DEFAULT_AI_MODEL_ID)
  const [status, setStatus] = useState<"loading" | "idle" | "saving">("loading")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/admin/model")
      .then(async (response) => {
        if (!response.ok) throw new Error("Не удалось загрузить настройку модели")
        return response.json()
      })
      .then(({ modelId }) => {
        setSelectedModelId(modelId)
        setSavedModelId(modelId)
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Ошибка загрузки"))
      .finally(() => setStatus("idle"))
  }, [])

  const handleSave = async () => {
    setStatus("saving")
    setError(null)
    try {
      const response = await fetch("/api/admin/model", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelId: selectedModelId }),
      })
      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error || "Не удалось сохранить модель")
      }
      setSavedModelId(selectedModelId)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка сохранения")
    } finally {
      setStatus("idle")
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Модель ИИ</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Это серверная настройка: выбранная модель применяется ко всем новым ответам AIvera.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Модель по умолчанию</CardTitle>
          <CardDescription>Изменение действует сразу и сохраняется в Supabase.</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={selectedModelId}
            onValueChange={(value) => setSelectedModelId(value as AiModelId)}
            className="space-y-3"
            disabled={status === "loading"}
          >
            {AI_MODELS.map((model) => (
              <Label
                key={model.id}
                htmlFor={model.id}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors",
                  selectedModelId === model.id && "border-primary bg-primary/5",
                )}
              >
                <RadioGroupItem id={model.id} value={model.id} className="mt-1" />
                <div>
                  <div className="font-medium">{model.label}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{model.description}</div>
                </div>
              </Label>
            ))}
          </RadioGroup>

          {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

          <div className="mt-5 flex justify-end">
            <Button onClick={handleSave} disabled={status !== "idle" || selectedModelId === savedModelId}>
              {status === "saving" ? "Сохранение..." : "Сохранить"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
