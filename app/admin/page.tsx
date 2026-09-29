"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, MessageSquare, Coins, Activity } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface UsagePoint {
  created_at: string
  tokens_used: number
  cost: number | string | null
}

interface AnalyticsData {
  totalUsers: number
  activeUsers: number
  blockedUsers: number
  totalChats: number
  totalMessages: number
  totalTokens: number
  totalCost: number
  usageHistory: UsagePoint[]
}

export default function AdminDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then(async (response) => {
        if (!response.ok) throw new Error("Не удалось загрузить аналитику")
        return response.json()
      })
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Ошибка загрузки"))
  }, [])

  if (error) return <div className="p-8 text-destructive">{error}</div>
  if (!data) return <div className="p-8">Загрузка аналитики...</div>

  const cards = [
    { title: "Пользователи", value: data.totalUsers, detail: `${data.activeUsers} активных за 7 дней`, icon: Users },
    { title: "Чаты", value: data.totalChats, detail: `${data.totalMessages} сообщений`, icon: MessageSquare },
    { title: "Токены", value: data.totalTokens.toLocaleString(), detail: "за последние 30 дней", icon: Activity },
    { title: "Расходы", value: `$${data.totalCost.toFixed(2)}`, detail: `${data.blockedUsers} заблокировано`, icon: Coins },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Панель администратора</h1>
        <p className="text-muted-foreground">Состояние AIvera и использование моделей</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ title, value, detail, icon: Icon }) => (
          <Card key={title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{title}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{value}</div>
              <p className="text-xs text-muted-foreground">{detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Использование токенов за 30 дней</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.usageHistory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="created_at" tickFormatter={(value) => new Date(value).toLocaleDateString("ru-RU")} />
              <YAxis />
              <Tooltip labelFormatter={(value) => new Date(String(value)).toLocaleString("ru-RU")} />
              <Line type="monotone" dataKey="tokens_used" stroke="hsl(var(--primary))" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
