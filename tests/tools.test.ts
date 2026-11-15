import { describe, expect, it } from "vitest"
import { getTool, getToolDefaults, TOOLS, validateToolValues } from "@/lib/tools"
import { AI_MODES } from "@/lib/ai-config"

describe("tools", () => {
  it("have unique slugs and known modes", () => {
    expect(new Set(TOOLS.map((tool) => tool.slug)).size).toBe(TOOLS.length)
    for (const tool of TOOLS) expect(AI_MODES).toHaveProperty(tool.mode)
  })

  it("defaults are valid select options", () => {
    for (const tool of TOOLS) {
      for (const field of tool.fields) {
        if (field.type === "select" && field.defaultValue) expect(field.options).toContain(field.defaultValue)
      }
    }
  })

  it("builds a lesson plan prompt with every field", () => {
    const tool = getTool("lesson-plan")!
    const prompt = tool.buildPrompt({
      ...getToolDefaults(tool),
      subject: "Алгебра",
      grade: "7 класс",
      topic: "Линейные уравнения",
      duration: "40",
    })
    expect(prompt).toContain("Предмет: Алгебра")
    expect(prompt).toContain("Длительность: 40 минут")
    expect(prompt).toContain("Цели: сформулируй сам")
    expect(tool.buildTitle({ topic: "Линейные уравнения" })).toBe("План урока: Линейные уравнения")
  })

  it("asks for two answer keys when two variants are chosen", () => {
    const tool = getTool("test")!
    expect(tool.buildPrompt({ ...getToolDefaults(tool), variants: "2" })).toContain("два равноценных варианта")
  })

  it("puts the student's work between quotes", () => {
    const tool = getTool("feedback")!
    const prompt = tool.buildPrompt({ ...getToolDefaults(tool), work: "Мой любимый герой — Абай." })
    expect(prompt).toMatch(/"""\nМой любимый герой — Абай.\n"""/)
  })
})

describe("validateToolValues", () => {
  const tool = getTool("lesson-plan")!
  const valid = { ...getToolDefaults(tool), subject: "Физика", grade: "9", topic: "Сила тока" }

  it("accepts a complete form", () => {
    expect(validateToolValues(tool, valid)).toBeNull()
  })

  it("names the missing field", () => {
    expect(validateToolValues(tool, { ...valid, topic: "  " })).toBe("Заполните поле «Тема»")
  })

  it("checks number bounds", () => {
    expect(validateToolValues(tool, { ...valid, duration: "5" })).toMatch(/не меньше 10/)
    expect(validateToolValues(tool, { ...valid, duration: "45.5" })).toMatch(/целое число/)
  })

  it("rejects a select value that is not in the list", () => {
    expect(validateToolValues(tool, { ...valid, lessonType: "Урок-квест" })).toMatch(/Выберите/)
  })
})
