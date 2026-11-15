import { describe, expect, it } from "vitest"
import { buildSystemPrompt } from "@/lib/ai-config"
import { groupChatsByDate } from "@/lib/chat-groups"
import { escapeHtml, toFileName } from "@/lib/export"
import { extractVariables, fillTemplate, missingVariables } from "@/lib/templates"
import { currentMonthUsage } from "@/lib/usage"
import { splitLesson } from "@/lib/lesson-timeline"

describe("splitLesson", () => {
  it.each([10, 30, 40, 45, 80, 90, 240])("adds up to %i minutes with every stage present", (duration) => {
    const stages = splitLesson(duration)
    expect(stages).toHaveLength(5)
    expect(stages.reduce((sum, stage) => sum + stage.minutes, 0)).toBe(duration)
    expect(stages.every((stage) => stage.minutes >= 1)).toBe(true)
  })

  it("clamps nonsense input", () => {
    expect(splitLesson(Number.NaN).reduce((sum, stage) => sum + stage.minutes, 0)).toBe(45)
    expect(splitLesson(3).reduce((sum, stage) => sum + stage.minutes, 0)).toBe(10)
  })
})

describe("templates", () => {
  const content = "Составь {количество} задач по теме { тема } для {класс}. Тема: {тема}. Пустые {} не трогай."

  it("finds each variable once", () => {
    expect(extractVariables(content)).toEqual(["количество", "тема", "класс"])
  })

  it("fills what is known and keeps the rest visible", () => {
    const result = fillTemplate(content, { тема: "дроби", класс: "5 класса" })
    expect(result).toBe("Составь {количество} задач по теме дроби для 5 класса. Тема: дроби. Пустые {} не трогай.")
    expect(missingVariables(content, { тема: "дроби" })).toEqual(["количество", "класс"])
  })
})

describe("groupChatsByDate", () => {
  it("sorts chats into buckets and skips empty ones", () => {
    const now = new Date(2026, 10, 15, 12)
    const at = (days: number) => ({ updated_at: new Date(2026, 10, 15 - days, 10).toISOString() })
    const groups = groupChatsByDate([at(0), at(1), at(3), at(40)], now)
    expect(groups.map((group) => [group.label, group.chats.length])).toEqual([
      ["Сегодня", 1],
      ["Вчера", 1],
      ["Последние 7 дней", 1],
      ["Раньше", 1],
    ])
  })
})

describe("currentMonthUsage", () => {
  const now = new Date(Date.UTC(2026, 10, 15))

  it("counts this month", () => {
    const usage = currentMonthUsage({ tokens_used: 25_000, token_limit: 100_000, usage_period_start: "2026-11-01" }, now)
    expect(usage).toMatchObject({ used: 25_000, remaining: 75_000, ratio: 0.25 })
  })

  it("treats last month's counter as already reset", () => {
    const usage = currentMonthUsage({ tokens_used: 100_000, token_limit: 100_000, usage_period_start: "2026-10-01" }, now)
    expect(usage.used).toBe(0)
  })

  it("handles an unlimited account", () => {
    expect(currentMonthUsage({ tokens_used: 5, token_limit: 0 }, now)).toMatchObject({ ratio: 0, remaining: Infinity })
  })
})

describe("buildSystemPrompt", () => {
  it("adds the answer language", () => {
    expect(buildSystemPrompt("tests", "kk")).toContain("казахском")
    expect(buildSystemPrompt("default", "en")).toContain("Answer in English")
  })
})

describe("export helpers", () => {
  it("makes a safe file name", () => {
    expect(toFileName('План урока: "Дроби" / 5 класс', "doc")).toBe("План урока Дроби 5 класс.doc")
    expect(toFileName("   ", "md")).toBe("aivera.md")
  })

  it("escapes html", () => {
    expect(escapeHtml('<b a="1">&')).toBe("&#60;b a=&#34;1&#34;&#62;&#38;")
  })
})
