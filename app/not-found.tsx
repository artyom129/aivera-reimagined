import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AuthShell } from "@/components/auth/auth-shell"

export default function NotFound() {
  return (
    <AuthShell title="Такой страницы нет" description="Возможно, ссылка устарела или в адресе опечатка.">
      <Button asChild>
        <Link href="/chat">К чатам</Link>
      </Button>
    </AuthShell>
  )
}
