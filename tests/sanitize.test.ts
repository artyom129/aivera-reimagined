import { describe, expect, it } from "vitest"
import { isValidIin, maskPersonalData, passesLuhn, sanitizeForGemini, MAX_MESSAGE_CHARS } from "@/lib/ai/sanitize"

describe("maskPersonalData", () => {
  it("hides emails", () => {
    expect(maskPersonalData("пишите на teacher.ivanova@school.kz")).toBe("пишите на [email скрыт]")
  })

  it.each([
    "+7 701 123 45 67",
    "+7 (701) 123-45-67",
    "+77011234567",
    "8 (701) 123-45-67",
    "8 701 123 45 67",
  ])("hides the phone %s", (phone) => {
    expect(maskPersonalData(`Звоните: ${phone}.`)).toBe("Звоните: [телефон скрыт].")
  })

  it("hides a real card number but keeps a random one", () => {
    expect(maskPersonalData("карта 4111 1111 1111 1111")).toBe("карта [номер карты скрыт]")
    expect(maskPersonalData("код 1234 5678 9012 3456")).toBe("код 1234 5678 9012 3456")
  })

  it("hides a valid ИИН only", () => {
    expect(isValidIin("900101300017")).toBe(true)
    expect(isValidIin("900101300014")).toBe(false)
    expect(maskPersonalData("ИИН 900101300017")).toBe("ИИН [ИИН скрыт]")
    expect(maskPersonalData("номер 123456789012")).toBe("номер 123456789012")
  })

  // These used to be masked as phones or card numbers.
  it.each([
    "Продолжи ряд: 2, 4, 6, 8, 10, 12, 14, 16, 18, 20",
    "Числа 1 2 3 4 5 6 7 8 9 10 11 12",
    "π ≈ 3.14159265358979",
    "Даты: 2026-09-01, 2026-09-15, 2026-10-01",
    "Расписание: 08.30 09.15 10.10 11.05 12.00",
    "Вычисли 123456 × 789",
    "В 1812 году, в 1941–1945 годах",
  ])("leaves lesson content alone: %s", (text) => {
    expect(maskPersonalData(text)).toBe(text)
  })
})

describe("passesLuhn", () => {
  it("checks the checksum", () => {
    expect(passesLuhn("4111111111111111")).toBe(true)
    expect(passesLuhn("4111111111111112")).toBe(false)
    expect(passesLuhn("12")).toBe(false)
  })
})

describe("sanitizeForGemini", () => {
  it("drops inline images and attached file blocks", () => {
    const text = "Смотри ![график](data:image/png;base64,AAAA) и [File: a.txt] ```секрет```"
    expect(sanitizeForGemini(text)).toBe("Смотри  и")
  })

  it("caps the length", () => {
    expect(sanitizeForGemini("a".repeat(MAX_MESSAGE_CHARS + 50))).toHaveLength(MAX_MESSAGE_CHARS)
  })
})
