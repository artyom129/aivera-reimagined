import Link from "next/link"
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  MessageSquare,
  ShieldCheck,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

const features = [
  {
    icon: BookOpen,
    title: "План урока",
    text: "Этапы, тайминг, цели, дифференциация и оценивание в одном документе.",
  },
  {
    icon: ClipboardCheck,
    title: "Тесты и задания",
    text: "Вопросы нужной сложности с вариантами ответов и ключом для проверки.",
  },
  {
    icon: FileText,
    title: "Обратная связь",
    text: "Понятные комментарии к работам учеников с конкретными рекомендациями.",
  },
]

export default function HomePage() {
  return (
    <div className="min-h-dvh overflow-hidden bg-background">
      <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[680px] bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.16),transparent_36%),radial-gradient(circle_at_80%_10%,hsl(var(--primary)/0.10),transparent_30%)]" />

      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="text-lg font-bold tracking-tight">AIvera</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/auth/login">
              <Button variant="ghost" className="rounded-full">Войти</Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button className="rounded-full px-5 shadow-lg shadow-primary/20">Начать</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-7xl items-center gap-14 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:py-28">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1.5 text-sm shadow-sm backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              AI-инструменты для преподавателя
            </div>
            <h1 className="max-w-3xl text-balance text-4xl font-bold leading-[1.05] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
              От темы урока до готовых материалов
              <span className="text-primary"> за несколько минут</span>
            </h1>
            <p className="mt-6 max-w-2xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
              AIvera превращает короткое описание в структурированный план урока, задания, тесты и обратную связь — без ручного составления промптов.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/auth/sign-up">
                <Button size="lg" className="w-full rounded-full px-7 sm:w-auto">
                  Создать первый материал
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button size="lg" variant="outline" className="w-full rounded-full bg-background/60 px-7 sm:w-auto">
                  Открыть рабочее пространство
                </Button>
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-primary" /> История материалов</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-primary" /> Готовые режимы</span>
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-primary" /> Защищённые данные</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute -inset-8 -z-10 rounded-[3rem] bg-primary/10 blur-3xl" />
            <Card className="overflow-hidden rounded-[2rem] border bg-background/90 shadow-2xl shadow-primary/10 backdrop-blur">
              <div className="flex items-center justify-between border-b px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </span>
                  <div>
                    <p className="font-semibold">План урока</p>
                    <p className="text-xs text-muted-foreground">Математика · 7 класс · 45 минут</p>
                  </div>
                </div>
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">Готово</span>
              </div>
              <CardContent className="space-y-4 p-5">
                <div className="rounded-2xl bg-muted/60 p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Тема</p>
                  <p className="mt-1 font-semibold">Линейные уравнения</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">Научиться решать уравнения и проверять полученный результат.</p>
                </div>
                {[
                  ["Актуализация знаний", "7 мин"],
                  ["Объяснение нового материала", "12 мин"],
                  ["Практическая работа", "18 мин"],
                  ["Проверка и рефлексия", "8 мин"],
                ].map(([title, time], index) => (
                  <div key={title} className="flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-background text-xs font-semibold">{index + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{title}</p>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${55 + index * 12}%` }} />
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">{time}</span>
                  </div>
                ))}
                <div className="flex items-center gap-2 rounded-2xl border border-primary/20 bg-primary/5 p-3 text-sm text-primary">
                  <Sparkles className="h-4 w-4 shrink-0" />
                  Добавлены критерии успеха и задания трёх уровней
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="border-y bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Рабочий процесс</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Не просто чат с нейросетью</h2>
              <p className="mt-4 text-muted-foreground">Выберите инструмент, заполните понятную форму и получите материал, который можно доработать в диалоге.</p>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {features.map(({ icon: Icon, title, text }, index) => (
                <Card key={title} className="rounded-3xl border bg-background/80 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </span>
                      <span className="text-4xl font-bold text-muted/80">0{index + 1}</span>
                    </div>
                    <h3 className="mt-6 text-xl font-semibold">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="relative overflow-hidden rounded-[2rem] bg-primary px-6 py-12 text-center text-primary-foreground shadow-2xl shadow-primary/20 sm:px-12">
            <MessageSquare className="mx-auto h-8 w-8 opacity-80" />
            <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">Меньше рутины. Больше времени на преподавание.</h2>
            <p className="mx-auto mt-4 max-w-xl text-primary-foreground/75">Создайте рабочее пространство и подготовьте первый урок вместе с AIvera.</p>
            <Link href="/auth/sign-up">
              <Button size="lg" variant="secondary" className="mt-7 rounded-full px-7">
                Попробовать AIvera
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <span className="flex items-center gap-2 font-medium text-foreground"><Sparkles className="h-4 w-4 text-primary" /> AIvera</span>
          <span>AI-помощник для подготовки учебных материалов</span>
        </div>
      </footer>
    </div>
  )
}
