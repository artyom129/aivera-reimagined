"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search } from "lucide-react"
import type { Database } from "@/lib/types/database"
import { createClient } from "@/lib/supabase/client"

type User = Database["public"]["Tables"]["users"]["Row"]

interface UsersTableProps {
  users: User[]
}

export function UsersTable({ users: initialUsers }: UsersTableProps) {
  const [users, setUsers] = useState(initialUsers)
  const [searchQuery, setSearchQuery] = useState("")
  const supabase = createClient()

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleRoleChange = async (userId: string, newRole: "teacher" | "admin") => {
    const { error } = await supabase.from("users").update({ role: newRole }).eq("id", userId)

    if (!error) {
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)))
    }
  }

  const handleSubscriptionChange = async (userId: string, newTier: "free" | "basic" | "premium") => {
    const { error } = await supabase.from("users").update({ subscription_tier: newTier }).eq("id", userId)

    if (!error) {
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, subscription_tier: newTier } : u)))
    }
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Поиск по email или имени..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Пользователь</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Роль</TableHead>
              <TableHead>Подписка</TableHead>
              <TableHead>Язык</TableHead>
              <TableHead>Дата регистрации</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{user.full_name || "Без имени"}</p>
                    <p className="text-xs text-muted-foreground">{user.id.slice(0, 8)}...</p>
                  </div>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Select value={user.role} onValueChange={(value) => handleRoleChange(user.id, value as User["role"])}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="teacher">Teacher</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Select
                    value={user.subscription_tier}
                    onValueChange={(value) =>
                      handleSubscriptionChange(user.id, value as User["subscription_tier"])
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{user.language.toUpperCase()}</Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(user.created_at).toLocaleDateString("ru-RU")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredUsers.length === 0 && <p className="py-8 text-center text-muted-foreground">Пользователи не найдены</p>}
    </div>
  )
}
