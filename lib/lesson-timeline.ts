export type LessonStage = { title: string; minutes: number }

// A typical split for a lesson that introduces new material.
const STAGE_SHARES: [string, number][] = [
  ["Организационный момент", 0.1],
  ["Актуализация", 0.17],
  ["Новый материал", 0.28],
  ["Практика", 0.33],
  ["Рефлексия", 0.12],
]

const PRACTICE = 3

// Splits a lesson into stages that add up to the duration exactly.
// The rounding remainder (at most a couple of minutes) goes to practice.
export function splitLesson(duration: number): LessonStage[] {
  const total = Math.min(240, Math.max(10, Math.round(duration) || 45))
  const stages = STAGE_SHARES.map(([title, share]) => ({ title, minutes: Math.max(1, Math.round(total * share)) }))
  const rounded = stages.reduce((sum, stage) => sum + stage.minutes, 0)
  stages[PRACTICE].minutes += total - rounded
  return stages
}
