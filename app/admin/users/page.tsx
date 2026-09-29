"use client"

import { useCallback, useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Search, Shield, Ban, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface User {
  id: string
  email: string
  full_name: string
  role: string
  token_limit: number
  tokens_used: number
  is_blocked: boolean
  created_at: string
  last_login: string | null
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.append("search", search)

      const res = await fetch(`/api/admin/users?${params}`)
      const data = await res.json()

      if (data.users) {
        setUsers(data.users)
      }
    } catch {
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    const timer = setTimeout(fetchUsers, 500)
    return () => clearTimeout(timer)
  }, [fetchUsers])

  const handleUpdateUser = async (userId: string, updates: Partial<User>) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, updates }),
      })

      if (res.ok) {
        setUsers(users.map((u) => (u.id === userId ? { ...u, ...updates } : u)))
        toast({
          title: "Успешно",
          description: "Пользователь обновлен",
        })
      } else {
        throw new Error("Failed to update")
      }
    } catch {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить пользователя",
        variant: "destructive",
      })
    }
  }

  const safeUsers = users.map((user) => ({
    ...user,
    tokens_used: user.tokens_used ?? 0,
    token_limit: user.token_limit ?? 0,
  }))

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Пользователи</h1>
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск пользователей..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Пользователь</TableHead>
              <TableHead>Роль</TableHead>
              <TableHead>Токены</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Последний вход</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  Загрузка пользователей...
                </TableCell>
              </TableRow>
            ) : safeUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{user.full_name || "Без имени"}</span>
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={user.role === "admin" ? "default" : "secondary"}>{user.role}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col text-sm">
                    <span>
                      {user.tokens_used.toLocaleString()} / {user.token_limit.toLocaleString()}
                    </span>
                    <div className="h-1.5 w-24 rounded-full bg-secondary mt-1">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{
                          width: `${user.token_limit > 0 ? Math.min((user.tokens_used / user.token_limit) * 100, 100) : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {user.is_blocked ? (
                    <Badge variant="destructive">Заблокирован</Badge>
                  ) : (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Активен
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {user.last_login ? new Date(user.last_login).toLocaleDateString() : "Никогда"}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleUpdateUser(user.id, { role: user.role === "admin" ? "teacher" : "admin" })}
                      >
                        <Shield className="mr-2 h-4 w-4" />
                        {user.role === "admin" ? "Снять админа" : "Сделать админом"}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleUpdateUser(user.id, { is_blocked: !user.is_blocked })}>
                        {user.is_blocked ? (
                          <>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Разблокировать
                          </>
                        ) : (
                          <>
                            <Ban className="mr-2 h-4 w-4" />
                            Заблокировать
                          </>
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
