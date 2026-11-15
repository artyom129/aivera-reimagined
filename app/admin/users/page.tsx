"use client"

import { useCallback, useEffect, useState } from "react"
import { MoreHorizontal, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useDialogs } from "@/components/dialogs"
import { useToast } from "@/hooks/use-toast"
import { currentMonthUsage } from "@/lib/usage"
import { cn } from "@/lib/utils"

type AdminUser = {
  id: string
  email: string
  full_name: string | null
  role: "teacher" | "admin"
  token_limit: number
  tokens_used: number
  usage_period_start: string
  is_blocked: boolean
  blocked_reason: string | null
  last_login: string | null
  created_at: string
}

type Updates = {
  role?: "teacher" | "admin"
  token_limit?: number
  is_blocked?: boolean
  blocked_reason?: string | null
  reset_usage?: true
}

const number = new Intl.NumberFormat("ru-RU")

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const { toast } = useToast()
  const { confirm, prompt, dialogs } = useDialogs()

  const load = useCallback(async (query: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/users?${new URLSearchParams(query ? { search: query } : {})}`)
      if (!response.ok) throw new Error()
      const body = await response.json()
      setUsers(body.users)
      setLoadError(false)
    } catch {
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => void load(search.trim()), 300)
    return () => clearTimeout(timer)
  }, [search, load])

  const update = async (user: AdminUser, updates: Updates, successText: string) => {
    const response = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, updates }),
    })
    const body = await response.json().catch(() => ({}))
    if (!response.ok) {
      toast({ title: "Не получилось", description: body.error, variant: "destructive" })
      return
    }
    setUsers((previous) => previous.map((item) => (item.id === user.id ? body.user : item)))
    toast({ title: successText })
  }

  const changeLimit = async (user: AdminUser) => {
    const value = await prompt({
      title: "Месячный лимит токенов",
      description: `${user.full_name || user.email}. 0 означает «без ограничений».`,
      initialValue: String(user.token_limit),
    })
    if (value === null) return
    const limit = Number(value.replace(/\s/g, ""))
    if (!Number.isInteger(limit) || limit < 0 || limit > 10_000_000) {
      toast({ title: "Нужно целое число от 0 до 10 000 000", variant: "destructive" })
      return
    }
    await update(user, { token_limit: limit }, "Лимит изменён")
  }

  const toggleBlock = async (user: AdminUser) => {
    if (user.is_blocked) return update(user, { is_blocked: false }, "Пользователь разблокирован")
    const reason = await prompt({
      title: "Заблокировать пользователя?",
      description: "Причину увидит пользователь при попытке отправить сообщение.",
      label: "Причина",
      initialValue: "Доступ временно ограничен администратором",
      maxLength: 500,
      confirmLabel: "Заблокировать",
    })
    if (reason) await update(user, { is_blocked: true, blocked_reason: reason }, "Пользователь заблокирован")
  }

  const toggleAdmin = async (user: AdminUser) => {
    const makeAdmin = user.role !== "admin"
    const ok = await confirm({
      title: makeAdmin ? "Сделать администратором?" : "Снять права администратора?",
      description: makeAdmin
        ? "Администратор видит всех пользователей и все шаблоны и может менять настройки."
        : undefined,
      confirmLabel: makeAdmin ? "Сделать администратором" : "Снять права",
      destructive: !makeAdmin,
    })
    if (ok) await update(user, { role: makeAdmin ? "admin" : "teacher" }, "Роль изменена")
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-medium tracking-[-0.01em]">Пользователи</h1>
          <p className="mt-1 text-muted-foreground">Лимиты считаются за текущий месяц</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Имя или email"
            aria-label="Поиск пользователей"
            className="pl-8"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Пользователь</TableHead>
              <TableHead>Токены за месяц</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Последний вход</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && users.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  Загружаем...
                </TableCell>
              </TableRow>
            )}
            {!loading && loadError && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-destructive">
                  Список не загрузился
                </TableCell>
              </TableRow>
            )}
            {!loading && !loadError && users.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  Никого не нашлось
                </TableCell>
              </TableRow>
            )}
            {users.map((user) => {
              const usage = currentMonthUsage(user)
              return (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{user.full_name || "Без имени"}</span>
                      {user.role === "admin" && <Badge variant="secondary">админ</Badge>}
                    </div>
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                  </TableCell>
                  <TableCell className="min-w-44">
                    <span className="text-sm tabular-nums">
                      {number.format(usage.used)}
                      {usage.limit > 0 ? ` / ${number.format(usage.limit)}` : " · без лимита"}
                    </span>
                    {usage.limit > 0 && (
                      <div className="mt-1 h-1 w-32 overflow-hidden rounded-full bg-secondary">
                        <div
                          className={cn("h-full", usage.ratio >= 0.9 ? "bg-destructive" : "bg-primary")}
                          style={{ width: `${Math.min(usage.ratio, 1) * 100}%` }}
                        />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.is_blocked ? (
                      <span className="text-sm text-destructive" title={user.blocked_reason ?? undefined}>
                        Заблокирован
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Активен</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {user.last_login ? new Date(user.last_login).toLocaleDateString("ru-RU") : "не входил"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8" aria-label="Действия">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem onClick={() => changeLimit(user)}>Изменить лимит</DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={usage.used === 0}
                          onClick={() => update(user, { reset_usage: true }, "Счётчик обнулён")}
                        >
                          Обнулить счётчик месяца
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => toggleAdmin(user)}>
                          {user.role === "admin" ? "Снять права администратора" : "Сделать администратором"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => toggleBlock(user)}
                          className={cn(!user.is_blocked && "text-destructive focus:text-destructive")}
                        >
                          {user.is_blocked ? "Разблокировать" : "Заблокировать"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {dialogs}
    </div>
  )
}
