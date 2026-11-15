import type { AIModeKey } from "@/lib/ai-config"

export type ToolField = {
  name: string
  label: string
  type: "text" | "textarea" | "number" | "select"
  placeholder?: string
  hint?: string
  options?: string[]
  required?: boolean
  maxLength?: number
  min?: number
  max?: number
  defaultValue?: string
  wide?: boolean
  rows?: number
}

export type ToolValues = Record<string, string>

export type Tool = {
  slug: string
  mode: AIModeKey
  title: string
  summary: string
  outcomes: string[]
  submitLabel: string
  fields: ToolField[]
  buildTitle: (values: ToolValues) => string
  buildPrompt: (values: ToolValues) => string
}

const value = (values: ToolValues, name: string, fallback = "") => values[name]?.trim() || fallback

const subject: ToolField = {
  name: "subject",
  label: "Предмет",
  type: "text",
  placeholder: "Математика",
  required: true,
  maxLength: 100,
}

const grade: ToolField = {
  name: "grade",
  label: "Класс",
  type: "text",
  placeholder: "7 класс",
  required: true,
  maxLength: 80,
}

const topic: ToolField = {
  name: "topic",
  label: "Тема",
  type: "text",
  placeholder: "Линейные уравнения",
  required: true,
  maxLength: 200,
  wide: true,
}

export const TOOLS: Tool[] = [
  {
    slug: "lesson-plan",
    mode: "lesson_plan",
    title: "План урока",
    summary: "Этапы с таймингом, дифференциация и оценивание",
    outcomes: [
      "Цели и измеримые результаты",
      "Таблица этапов: время, учитель, ученики",
      "Задания для сильных и слабых",
      "Критерии успеха и домашнее задание",
    ],
    submitLabel: "Составить план",
    fields: [
      subject,
      grade,
      topic,
      { name: "duration", label: "Длительность, мин", type: "number", min: 10, max: 240, defaultValue: "45", required: true },
      {
        name: "lessonType",
        label: "Тип урока",
        type: "select",
        options: ["Изучение нового материала", "Закрепление", "Повторение и обобщение", "Контроль знаний", "Комбинированный"],
        defaultValue: "Изучение нового материала",
      },
      {
        name: "goals",
        label: "Цели",
        type: "textarea",
        placeholder: "Что ученики должны понять или научиться делать",
        maxLength: 1000,
        wide: true,
      },
      {
        name: "requirements",
        label: "Пожелания",
        type: "textarea",
        placeholder: "Формат работы, оборудование, особенности класса",
        maxLength: 1000,
        wide: true,
      },
    ],
    buildTitle: (values) => `План урока: ${value(values, "topic")}`,
    buildPrompt: (values) =>
      [
        "Составь план урока.",
        `Предмет: ${value(values, "subject")}`,
        `Класс: ${value(values, "grade")}`,
        `Тема: ${value(values, "topic")}`,
        `Длительность: ${value(values, "duration", "45")} минут`,
        `Тип урока: ${value(values, "lessonType", "Изучение нового материала")}`,
        `Цели: ${value(values, "goals", "сформулируй сам")}`,
        `Пожелания: ${value(values, "requirements", "нет")}`,
      ].join("\n"),
  },
  {
    slug: "test",
    mode: "tests",
    title: "Тест",
    summary: "Вопросы нужной сложности и ключ ответов",
    outcomes: [
      "Пронумерованные вопросы с вариантами",
      "Правдоподобные неверные ответы",
      "Ключ с коротким пояснением",
      "Второй вариант по желанию",
    ],
    submitLabel: "Составить тест",
    fields: [
      subject,
      grade,
      topic,
      { name: "count", label: "Вопросов", type: "number", min: 3, max: 40, defaultValue: "10", required: true },
      {
        name: "format",
        label: "Формат",
        type: "select",
        options: [
          "Один правильный ответ из четырёх",
          "Несколько правильных ответов",
          "Верно или неверно",
          "Смешанный, с открытыми вопросами",
        ],
        defaultValue: "Один правильный ответ из четырёх",
      },
      {
        name: "difficulty",
        label: "Сложность",
        type: "select",
        options: ["Базовая", "Средняя", "Повышенная", "От простого к сложному"],
        defaultValue: "Средняя",
      },
      {
        name: "variants",
        label: "Вариантов",
        type: "select",
        options: ["1", "2"],
        defaultValue: "1",
      },
      {
        name: "notes",
        label: "Пожелания",
        type: "textarea",
        placeholder: "На что сделать упор, чего избегать",
        maxLength: 1000,
        wide: true,
      },
    ],
    buildTitle: (values) => `Тест: ${value(values, "topic")}`,
    buildPrompt: (values) =>
      [
        "Составь тест.",
        `Предмет: ${value(values, "subject")}`,
        `Класс: ${value(values, "grade")}`,
        `Тема: ${value(values, "topic")}`,
        `Количество вопросов: ${value(values, "count", "10")}`,
        `Формат: ${value(values, "format", "Один правильный ответ из четырёх")}`,
        `Сложность: ${value(values, "difficulty", "Средняя")}`,
        value(values, "variants") === "2"
          ? "Сделай два равноценных варианта и отдельный ключ для каждого."
          : "Один вариант.",
        `Пожелания: ${value(values, "notes", "нет")}`,
      ].join("\n"),
  },
  {
    slug: "feedback",
    mode: "feedback",
    title: "Отзыв на работу",
    summary: "Комментарий ученику: что получилось и что исправить",
    outcomes: [
      "Сильные стороны с примером из работы",
      "2–3 главных момента для улучшения",
      "Разбор по каждому критерию",
      "Тон и объём, как вы попросили",
    ],
    submitLabel: "Написать отзыв",
    fields: [
      subject,
      grade,
      {
        name: "task",
        label: "Что было задано",
        type: "text",
        placeholder: "Эссе «Мой любимый герой», 150–200 слов",
        required: true,
        maxLength: 300,
        wide: true,
      },
      {
        name: "criteria",
        label: "Критерии оценивания",
        type: "textarea",
        placeholder: "Можно оставить пустым",
        maxLength: 1500,
        wide: true,
        rows: 3,
      },
      {
        name: "work",
        label: "Текст работы",
        type: "textarea",
        placeholder: "Вставьте работу без имени ученика",
        required: true,
        maxLength: 8000,
        wide: true,
        rows: 8,
      },
      {
        name: "tone",
        label: "Тон",
        type: "select",
        options: ["Поддерживающий", "Нейтральный", "Строгий"],
        defaultValue: "Поддерживающий",
      },
      {
        name: "length",
        label: "Объём",
        type: "select",
        options: ["Коротко, 3–4 предложения", "Подробно"],
        defaultValue: "Коротко, 3–4 предложения",
      },
    ],
    buildTitle: (values) => `Отзыв: ${value(values, "task")}`,
    buildPrompt: (values) =>
      [
        "Напиши отзыв на работу ученика.",
        `Предмет: ${value(values, "subject")}`,
        `Класс: ${value(values, "grade")}`,
        `Задание: ${value(values, "task")}`,
        `Критерии: ${value(values, "criteria", "общие требования к заданию")}`,
        `Тон: ${value(values, "tone", "Поддерживающий")}`,
        `Объём: ${value(values, "length", "Коротко, 3–4 предложения")}`,
        "",
        "Работа:",
        '"""',
        value(values, "work"),
        '"""',
      ].join("\n"),
  },
  {
    slug: "parent-letter",
    mode: "default",
    title: "Письмо родителям",
    summary: "Объявление, приглашение или новости класса",
    outcomes: [
      "Готовый текст под чат, дневник или листок",
      "Все даты и детали из вашего запроса",
      "Ничего придуманного сверх этого",
      "Дружелюбный или официальный тон",
    ],
    submitLabel: "Написать письмо",
    fields: [
      {
        name: "purpose",
        label: "Повод",
        type: "select",
        options: ["Приглашение на собрание", "Мероприятие или экскурсия", "Итоги четверти", "Просьба или напоминание", "Другое"],
        defaultValue: "Приглашение на собрание",
        wide: true,
      },
      {
        name: "details",
        label: "Что нужно сообщить",
        type: "textarea",
        placeholder: "Дата, время, место, что взять с собой",
        required: true,
        maxLength: 2000,
        wide: true,
        rows: 5,
      },
      {
        name: "tone",
        label: "Тон",
        type: "select",
        options: ["Дружелюбный", "Официальный"],
        defaultValue: "Дружелюбный",
      },
      {
        name: "channel",
        label: "Куда отправить",
        type: "select",
        options: ["Чат класса в мессенджере", "Электронный дневник", "Бумажное объявление"],
        defaultValue: "Чат класса в мессенджере",
      },
    ],
    buildTitle: (values) => `Письмо: ${value(values, "purpose")}`,
    buildPrompt: (values) =>
      [
        "Напиши сообщение родителям учеников от имени классного руководителя.",
        `Повод: ${value(values, "purpose")}`,
        `Тон: ${value(values, "tone", "Дружелюбный")}`,
        `Где будет опубликовано: ${value(values, "channel", "Чат класса в мессенджере")}`,
        `Что сообщить: ${value(values, "details")}`,
        "Не придумывай факты, которых нет в запросе. Вместо имени учителя оставь [Имя].",
      ].join("\n"),
  },
]

export function getTool(slug: string): Tool | undefined {
  return TOOLS.find((tool) => tool.slug === slug)
}

export function getToolDefaults(tool: Tool): ToolValues {
  return Object.fromEntries(tool.fields.map((field) => [field.name, field.defaultValue ?? ""]))
}

// Returns the first problem with the form, or null.
export function validateToolValues(tool: Tool, values: ToolValues): string | null {
  for (const field of tool.fields) {
    const raw = values[field.name]?.trim() ?? ""
    if (field.required && !raw) return `Заполните поле «${field.label}»`
    if (field.maxLength && raw.length > field.maxLength) return `Поле «${field.label}» слишком длинное`
    if (field.type === "number" && raw) {
      const number = Number(raw)
      if (!Number.isInteger(number)) return `В поле «${field.label}» нужно целое число`
      if (field.min !== undefined && number < field.min) return `«${field.label}»: не меньше ${field.min}`
      if (field.max !== undefined && number > field.max) return `«${field.label}»: не больше ${field.max}`
    }
    if (field.type === "select" && raw && field.options && !field.options.includes(raw)) {
      return `Выберите значение в поле «${field.label}»`
    }
  }
  return null
}
