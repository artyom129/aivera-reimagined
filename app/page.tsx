import Link from "next/link"
import { ArrowRight, Check, EyeOff, FileDown, ImageOff, KeyRound, Languages, ShieldCheck } from "lucide-react"
import { Brand, BrandMark } from "@/components/brand"
import { LessonTimeline } from "@/components/lesson-timeline"
import { ThemeToggle } from "@/components/theme-toggle"
import { ToolIcon } from "@/components/tools/tool-icon"
import { Button } from "@/components/ui/button"
import { splitLesson } from "@/lib/lesson-timeline"
import { TOOLS } from "@/lib/tools"

const HERO_DETAILS = [
  "Тема и цель на доске",
  "Устный счёт: 3x = 12, x + 5 = 9",
  "Разбор 2x + 3 = 11 у доски",
  "Карточки трёх уровней в парах",
  "Шкала «понял / не уверен / нужна помощь»",
]

const STEPS = [
  {
    title: "Выберите форму",
    text: "План урока, тест, отзыв или письмо родителям. Или просто напишите задачу в чат",
  },
  {
    title: "Заполните пару полей",
    text: "Предмет, класс, тема. Справа видно, какой именно текст уйдёт в Gemini",
  },
  {
    title: "Доработайте и заберите",
    text: "«Сделай проще», «добавь задачу на смекалку». Готовое скачивается для Word или в PDF",
  },
]

const PRIVACY = [
  { icon: KeyRound, title: "Ключ только на сервере", text: "Браузер никогда не видит ключ Gemini" },
  { icon: EyeOff, title: "Личные данные скрываются", text: "Email, телефоны, номера карт и ИИН убираются до отправки" },
  { icon: ImageOff, title: "Без файлов и картинок", text: "Загрузка файлов выключена, внешние изображения в ответах не грузятся" },
  { icon: ShieldCheck, title: "Каждый видит только своё", text: "Доступ к чатам и шаблонам ограничен правилами базы данных" },
]

const FAQ = [
  {
    question: "На каком языке отвечает AIvera?",
    answer: "На русском, казахском или английском. Язык выбирается в настройках, а в чате можно попросить любой другой.",
  },
  {
    question: "Сколько это стоит?",
    answer:
      "У каждого аккаунта есть месячный лимит токенов, его задаёт администратор школы. Один план урока обычно занимает 3–6 тысяч токенов. Счётчик обнуляется первого числа.",
  },
  {
    question: "Можно ли вставить работу ученика?",
    answer: "Да, в форме «Отзыв на работу». Только уберите имя: AIvera подскажет, что исправить, без личных данных.",
  },
  {
    question: "А если ответ получился не тот?",
    answer: "Нажмите «Другой вариант» под ответом или напишите, что поменять. Весь разговор сохраняется в истории.",
  },
]

export default function HomePage() {
  const toolsBySlug = Object.fromEntries(TOOLS.map((tool) => [tool.slug, tool]))
  const lessonPlan = toolsBySlug["lesson-plan"]
  const otherTools = TOOLS.filter((tool) => tool.slug !== "lesson-plan")

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
          <Brand />
          <nav className="hidden gap-6 text-sm text-muted-foreground md:flex" aria-label="Разделы">
            <a href="#tools" className="transition-colors hover:text-foreground">
              Инструменты
            </a>
            <a href="#how" className="transition-colors hover:text-foreground">
              Как это работает
            </a>
            <a href="#faq" className="transition-colors hover:text-foreground">
              Вопросы
            </a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <Link href="/auth/login" className="px-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
              Войти
            </Link>
            <Button asChild size="sm">
              <Link href="/auth/sign-up">Начать</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-12 sm:px-6 lg:min-h-[calc(100dvh-4rem)] lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:py-16">
          <div className="rise-in">
            <h1 className="text-balance font-serif text-[2.5rem] font-medium leading-[1.08] tracking-[-0.02em] sm:text-[3.25rem] xl:text-[3.5rem]">
              План урока готов, пока заваривается <span className="chalk">чай</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
              AIvera пишет планы уроков, тесты с ключом ответов, отзывы на работы учеников и письма родителям. Вы
              заполняете короткую форму, Gemini делает остальное.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 px-6 text-base">
                <Link href="/auth/sign-up">
                  Составить первый план
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 px-6 text-base">
                <a href="#tools">Посмотреть инструменты</a>
              </Button>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Languages className="size-4" />
                Русский, қазақша, English
              </li>
              <li className="flex items-center gap-2">
                <FileDown className="size-4" />
                Word и PDF
              </li>
              <li className="flex items-center gap-2">
                <EyeOff className="size-4" />
                Данные учеников скрываются
              </li>
            </ul>
          </div>

          <figure className="rise-in overflow-hidden rounded-2xl border bg-card shadow-[0_24px_64px_-24px_rgb(0_0_0/0.25)]" style={{ animationDelay: "80ms" }}>
            <div className="flex h-11 items-center gap-2 border-b px-4">
              <BrandMark className="size-5 rounded text-[11px]" />
              <span className="truncate text-sm font-medium">План урока: Линейные уравнения</span>
              <span className="ml-auto hidden rounded-md border px-2 py-0.5 font-mono text-[11px] text-muted-foreground sm:inline">
                план урока
              </span>
            </div>
            <div className="grid sm:grid-cols-[180px_1fr]">
              <div className="hidden border-r bg-sidebar p-3 sm:block">
                <p className="px-2 pb-2 text-xs text-muted-foreground">Сегодня</p>
                {["Линейные уравнения", "Тест: причастия", "Письмо: собрание"].map((title, index) => (
                  <p
                    key={title}
                    className={
                      index === 0
                        ? "truncate rounded-md bg-sidebar-accent px-2 py-1.5 text-[13px] font-medium"
                        : "truncate px-2 py-1.5 text-[13px] text-muted-foreground"
                    }
                  >
                    {title}
                  </p>
                ))}
                <p className="px-2 pb-2 pt-4 text-xs text-muted-foreground">Инструменты</p>
                {TOOLS.map((tool) => (
                  <p key={tool.slug} className="flex items-center gap-2 px-2 py-1.5 text-[13px] text-muted-foreground">
                    <ToolIcon slug={tool.slug} className="size-3.5" />
                    {tool.title}
                  </p>
                ))}
              </div>
              <div className="paper-sheet p-5 sm:p-6">
                <p className="font-serif text-lg font-medium">Линейные уравнения</p>
                <p className="mt-1 text-sm text-muted-foreground">Алгебра · 7 класс · 45 минут</p>
                <p className="mt-4 text-sm leading-6">
                  <span className="font-medium">Результат:</span> ученики решают уравнения вида ax + b = c и проверяют
                  ответ подстановкой.
                </p>
                <LessonTimeline className="mt-5" stages={splitLesson(45)} details={HERO_DETAILS} compact />
              </div>
            </div>
          </figure>
        </section>

        <section id="tools" className="scroll-mt-16 border-t bg-muted/40">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
            <h2 className="font-serif text-3xl font-medium tracking-[-0.01em] sm:text-4xl">Четыре формы вместо пустого чата</h2>
            <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
              Не нужно придумывать запросы. Каждая форма знает, что спросить и как оформить ответ
            </p>

            <div className="mt-10 grid gap-4 lg:grid-cols-[1.15fr_1fr]">
              <article className="flex flex-col rounded-2xl border bg-card p-6 sm:p-8">
                <ToolIcon slug={lessonPlan.slug} boxed />
                <h3 className="mt-5 text-xl font-medium">{lessonPlan.title}</h3>
                <p className="mt-1.5 text-muted-foreground">{lessonPlan.summary}</p>
                <ul className="mt-5 grid gap-2 text-sm sm:grid-cols-2">
                  {lessonPlan.outcomes.map((outcome) => (
                    <li key={outcome} className="flex gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                      {outcome}
                    </li>
                  ))}
                </ul>
                <div className="paper-sheet mt-6 rounded-xl border p-5">
                  <LessonTimeline stages={splitLesson(40)} compact />
                </div>
              </article>

              <div className="grid gap-4">
                {otherTools.map((tool) => (
                  <article key={tool.slug} className="flex gap-4 rounded-2xl border bg-card p-5 sm:p-6">
                    <ToolIcon slug={tool.slug} boxed />
                    <div className="min-w-0">
                      <h3 className="font-medium">{tool.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{tool.summary}</p>
                      <ul className="mt-3 space-y-1 text-sm text-foreground/80">
                        {tool.outcomes.slice(0, 2).map((outcome) => (
                          <li key={outcome} className="flex gap-2">
                            <Check className="mt-0.5 size-3.5 shrink-0 text-primary" />
                            {outcome}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="how" className="mx-auto max-w-6xl scroll-mt-16 px-4 py-20 sm:px-6 sm:py-24">
          <h2 className="font-serif text-3xl font-medium tracking-[-0.01em] sm:text-4xl">Как это работает</h2>
          <ol className="mt-10 grid gap-10 sm:grid-cols-3 sm:gap-8">
            {STEPS.map((step, index) => (
              <li key={step.title} className="border-t pt-5">
                <span className="font-mono text-sm text-primary">0{index + 1}</span>
                <h3 className="mt-3 text-lg font-medium">{step.title}</h3>
                <p className="mt-2 leading-7 text-muted-foreground">{step.text}</p>
              </li>
            ))}
          </ol>

          <div className="mt-20 grid gap-10 rounded-2xl border bg-card p-6 sm:p-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <h2 className="font-serif text-2xl font-medium sm:text-3xl">Про данные учеников</h2>
              <p className="mt-3 leading-7 text-muted-foreground">
                Проверка ловит не всё, поэтому имена всё равно лучше не писать. Перед каждой отправкой AIvera просит это
                подтвердить
              </p>
            </div>
            <ul className="grid gap-6 sm:grid-cols-2">
              {PRIVACY.map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex gap-3">
                  <Icon className="mt-0.5 size-[18px] shrink-0 text-muted-foreground" />
                  <span>
                    <span className="block font-medium">{title}</span>
                    <span className="mt-1 block text-sm leading-6 text-muted-foreground">{text}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="faq" className="scroll-mt-16 border-t">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 sm:py-24 lg:grid-cols-[0.8fr_1.2fr]">
            <h2 className="font-serif text-3xl font-medium tracking-[-0.01em] sm:text-4xl">Частые вопросы</h2>
            <div className="divide-y border-y">
              {FAQ.map((item) => (
                <details key={item.question} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                    {item.question}
                    <span className="text-xl leading-none text-muted-foreground transition-transform duration-200 group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
          <div className="flex flex-col items-start justify-between gap-6 rounded-2xl bg-foreground px-6 py-10 text-background sm:flex-row sm:items-center sm:px-10">
            <div>
              <h2 className="font-serif text-2xl font-medium sm:text-3xl">Завтрашний урок можно подготовить сегодня</h2>
              <p className="mt-2 opacity-70">Регистрация занимает минуту, подтверждение приходит на почту</p>
            </div>
            <Button asChild size="lg" variant="secondary" className="h-12 shrink-0 px-6 text-base">
              <Link href="/auth/sign-up">
                Создать аккаунт
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span className="flex items-center gap-2">
            <BrandMark className="size-5 rounded text-[11px]" />
            Командный проект AIverse, переработанный Koncha Artyom
          </span>
          <a href="https://github.com/artyom129/aivera-reimagined" className="transition-colors hover:text-foreground">
            Исходный код на GitHub
          </a>
        </div>
      </footer>
    </div>
  )
}
