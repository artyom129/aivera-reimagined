// Masks contacts and payment data before text goes to Gemini.
// Only real phone/card/ИИН shapes are masked, so number series,
// dates and decimals in lesson material stay intact.

export const MAX_MESSAGE_CHARS = 12_000

const INLINE_IMAGE = /!\[[^\]]*\]\(data:image\/[^)]+\)/gi
const FILE_BLOCK = /\s*\[File:\s*[^\]]+\]\s*```[\s\S]*?```/gi
const EMAIL = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi
const UUID = /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi

// "+7 701 123 45 67", "8 (701) 123-45-67", "8 701 123 45 67"
const PHONE_INTERNATIONAL = /(?<![\w+])\+\d{1,3}[\s.-]?(?:\(\d{2,4}\)|\d{2,4})(?:[\s.-]?\d){5,9}(?!\d)/g
const PHONE_TRUNK = /(?<![\w])8[\s-]?\(\d{3}\)[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}(?!\d)/g
const PHONE_TRUNK_PLAIN = /(?<![\d.,])8[\s-]\d{3}[\s-]\d{3}[\s-]?\d{2}[\s-]?\d{2}(?![\d,]|\.\d)/g

// Cards are masked only if the Luhn checksum matches.
const CARD_CANDIDATE = /(?<![\d.,])(?:\d{4}[ -]?){3}\d{1,7}(?![\d.,])/g

// ИИН/БИН: 12 digits with a valid control digit.
const IIN_CANDIDATE = /(?<![\d.,])\d{12}(?![\d.,])/g

export function passesLuhn(digits: string): boolean {
  if (!/^\d{13,19}$/.test(digits)) return false
  let sum = 0
  let double = false
  for (let index = digits.length - 1; index >= 0; index -= 1) {
    let value = digits.charCodeAt(index) - 48
    if (double) {
      value *= 2
      if (value > 9) value -= 9
    }
    sum += value
    double = !double
  }
  return sum % 10 === 0
}

export function isValidIin(digits: string): boolean {
  if (!/^\d{12}$/.test(digits)) return false
  const numbers = digits.split("").map(Number)
  const weightsA = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
  const weightsB = [3, 4, 5, 6, 7, 8, 9, 10, 11, 1, 2]
  let control = weightsA.reduce((sum, weight, index) => sum + weight * numbers[index], 0) % 11
  if (control === 10) {
    control = weightsB.reduce((sum, weight, index) => sum + weight * numbers[index], 0) % 11
    if (control === 10) return false
  }
  return control === numbers[11]
}

export function maskPersonalData(text: string): string {
  return text
    .replace(EMAIL, "[email скрыт]")
    .replace(UUID, "[идентификатор скрыт]")
    .replace(CARD_CANDIDATE, (match) => (passesLuhn(match.replace(/\D/g, "")) ? "[номер карты скрыт]" : match))
    .replace(IIN_CANDIDATE, (match) => (isValidIin(match) ? "[ИИН скрыт]" : match))
    .replace(PHONE_INTERNATIONAL, "[телефон скрыт]")
    .replace(PHONE_TRUNK, "[телефон скрыт]")
    .replace(PHONE_TRUNK_PLAIN, "[телефон скрыт]")
}

export function sanitizeForGemini(text: string): string {
  return maskPersonalData(text.replace(INLINE_IMAGE, "").replace(FILE_BLOCK, ""))
    .trim()
    .slice(0, MAX_MESSAGE_CHARS)
}
