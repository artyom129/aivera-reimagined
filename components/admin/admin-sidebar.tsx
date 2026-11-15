"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { BrandMark } from "@/components/brand"
import { ThemeToggle } from "@/components/theme-toggle"
import { cn } from "@/lib/utils"

const NAVIGATION = [
  { name: "Обзор", href: "/admin" },
  { name: "Пользователи", href: "/admin/users" },
  { name: "Шаблоны", href: "/admin/templates" },
  { name: "Модель", href: "/admin/model" },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="border-b bg-sidebar text-sidebar-foreground lg:flex lg:h-full lg:w-60 lg:flex-col lg:border-b-0 lg:border-r">
      <div className="flex h-14 items-center gap-2 px-4">
        <BrandMark className="size-6 text-[13px]" />
        <span className="font-semibold tracking-tight">Админка</span>
        <ThemeToggle className="ml-auto" />
      </div>
      <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-1 lg:flex-col lg:pb-0" aria-label="Разделы">
        {NAVIGATION.map((item) => {
          const active = item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "shrink-0 rounded-md px-3 py-1.5 text-sm",
                active ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground" : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60",
              )}
            >
              {item.name}
            </Link>
          )
        })}
      </nav>
      <div className="hidden border-t p-3 lg:block">
        <Link href="/chat" className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-sidebar-foreground/75 hover:bg-sidebar-accent/60">
          <ArrowLeft className="size-4" />
          К чатам
        </Link>
      </div>
    </aside>
  )
}
