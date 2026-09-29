"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Users, LogOut, MessageSquare, Cpu } from "lucide-react"
import { Button } from "@/components/ui/button"

const navigation = [
  { name: "Дашборд", href: "/admin", icon: LayoutDashboard },
  { name: "Пользователи", href: "/admin/users", icon: Users },
  { name: "Модель ИИ", href: "/admin/model", icon: Cpu },
  { name: "Чаты", href: "/chat", icon: MessageSquare },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col border-r bg-sidebar">
      <div className="flex h-16 items-center border-b px-6">
        <span className="text-lg font-bold">AIvera Admin</span>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-2">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                pathname === item.href ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground",
              )}
            >
              <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
              {item.name}
            </Link>
          ))}
        </nav>
      </div>
      <div className="border-t p-4">
        <Link href="/chat">
          <Button variant="outline" className="w-full justify-start bg-transparent">
            <LogOut className="mr-2 h-4 w-4" />
            Вернуться в чат
          </Button>
        </Link>
      </div>
    </div>
  )
}
