"use client"

import { useEffect, useState } from "react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

type Analytics = {
  totalUsers: number
  activeUsers: number
  blockedUsers: number
  usersNearLimit: number
  totalChats: number
  totalMessages: number
  tokens30d: number
  requests30d: number
  usageByDay: { day: string; tokens: number; requests: number }[]
  usageByModel: { model: string; tokens: number }[]
}

const number = new Intl.NumberFormat("ru-RU")
const compact = new Intl.NumberFormat("ru-RU", { notation: "compact" })
const shortDate = (value: string) => new Date(value).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      {note && <p className="mt-0.5 text-xs text-muted-foreground">{note}</p>}
    </div>
  )
}

export default function AdminDashboard() {
  const [data, setData] = useState<Analytics | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then(async (response) => {
        if (!response.ok) throw new Error("Аналитика не загрузилась. Применены ли все миграции?")
        return response.json()
      })
      .then(setData)
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Ошибка загрузки"))
  }, [])

  if (error) return <p className="text-destructive">{error}</p>
  if (!data) return <p className="text-muted-foreground">Загружаем...</p>

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-medium tracking-[-0.01em]">Обзор</h1>
        <p className="mt-1 text-muted-foreground">Последние 30 дней</p>
      </div>

      <div className="grid gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Пользователи" value={number.format(data.totalUsers)} note={`${data.activeUsers} заходили за неделю`} />
        <Stat label="Запросы к ИИ" value={number.format(data.requests30d)} note={`${compact.format(data.tokens30d)} токенов`} />
        <Stat label="Чаты" value={number.format(data.totalChats)} note={`${number.format(data.totalMessages)} сообщений`} />
        <Stat
          label="Близко к лимиту"
          value={number.format(data.usersNearLimit)}
          note={data.blockedUsers ? `заблокировано: ${data.blockedUsers}` : "использовали 80% и больше"}
        />
      </div>

      <section className="rounded-lg border bg-card p-4 sm:p-5">
        <h2 className="font-medium">Токены по дням</h2>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.usageByDay} margin={{ left: -12, right: 4 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="day"
                tickFormatter={shortDate}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                minTickGap={24}
              />
              <YAxis
                tickFormatter={(value: number) => compact.format(value)}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                cursor={{ fill: "var(--accent)" }}
                contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 6 }}
                labelFormatter={(value) => shortDate(String(value))}
                formatter={(value: number, name) => [number.format(value), name === "tokens" ? "токенов" : "запросов"]}
              />
              <Bar dataKey="tokens" fill="var(--chart-1)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {data.usageByModel.length > 0 && (
        <section>
          <h2 className="font-medium">По моделям</h2>
          <ul className="mt-3 divide-y rounded-lg border bg-card">
            {data.usageByModel.map((row) => (
              <li key={row.model} className="flex justify-between px-4 py-2.5 text-sm">
                <span className="font-mono">{row.model}</span>
                <span className="tabular-nums text-muted-foreground">{number.format(row.tokens)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
