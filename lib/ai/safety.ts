// Rough pre-check before Gemini (which has its own filters).
// Blocks requests for harmful instructions, not topics: "Красный террор",
// "профилактика наркомании" or "процентные ставки" are normal lessons.

const HOW_TO = String.raw`(?:как|каким\s+образом|научи|инструкци[яюи]|пошагово|рецепт|способ)`
const MAKE = String.raw`(?:сделать|изготовить|собрать|создать|приготовить|синтезировать|сварить|вырастить|достать|купить)`

const HARMFUL_REQUESTS: RegExp[] = [
  // Weapons and explosives.
  new RegExp(`${HOW_TO}[^.?!\\n]{0,40}${MAKE}[^.?!\\n]{0,30}(?:бомб|взрывчат|взрывн\\w*\\s+устройств|пистолет|оружи|самопал|напалм|коктейл\\w*\\s+молотов)`, "iu"),
  // Drugs.
  new RegExp(`${HOW_TO}[^.?!\\n]{0,40}${MAKE}[^.?!\\n]{0,30}(?:наркотик|мефедрон|амфетамин|метамфетамин|героин|кокаин|спайс|закладк)`, "iu"),
  // Account intrusion and theft.
  new RegExp(`${HOW_TO}[^.?!\\n]{0,40}(?:взломать|хакнуть|украсть\\s+парол|получить\\s+доступ\\s+к\\s+чуж)`, "iu"),
  /(?:как|помоги)[^.?!\n]{0,30}(?:украсть|своровать|обокрасть)/iu,
  // Self-harm methods (prevention topics stay allowed).
  /(?:как|способ\w*|чем)[^.?!\n]{0,30}(?:покончить\s+с\s+собой|убить\s+себя|совершить\s+самоубийство)/iu,
  // English equivalents.
  /\bhow\s+(?:to|do\s+i|can\s+i)\s+(?:make|build|synthesi[sz]e|cook)\s+(?:a\s+)?(?:bomb|explosive|meth|drugs?|gun)\b/i,
  /\bhow\s+(?:to|do\s+i|can\s+i)\s+(?:hack|break)\s+into\b/i,
  /\bhow\s+(?:to|do\s+i|can\s+i)\s+kill\s+myself\b/i,
]

export function isMessageSafe(text: string): boolean {
  const normalized = text.toLowerCase().replace(/ё/g, "е")
  return !HARMFUL_REQUESTS.some((pattern) => pattern.test(normalized))
}
