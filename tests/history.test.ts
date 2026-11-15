import { describe, expect, it } from "vitest"
import { fitHistoryToBudget, type HistoryMessage } from "@/lib/ai/history"

const user = (text: string): HistoryMessage => ({ role: "user", text })
const bot = (text: string): HistoryMessage => ({ role: "assistant", text })

describe("fitHistoryToBudget", () => {
  it("keeps everything that fits", () => {
    const history = [user("a"), bot("b"), user("c")]
    expect(fitHistoryToBudget(history, 100)).toEqual(history)
  })

  it("drops the oldest messages first", () => {
    const history = [user("1".repeat(50)), bot("2".repeat(50)), user("3".repeat(10)), bot("4".repeat(10)), user("5")]
    expect(fitHistoryToBudget(history, 30)).toEqual([user("3".repeat(10)), bot("4".repeat(10)), user("5")])
  })

  it("never starts with an assistant turn", () => {
    const history = [user("x".repeat(40)), bot("y"), user("z")]
    expect(fitHistoryToBudget(history, 5)).toEqual([user("z")])
  })

  it("keeps the newest message even when it is over budget", () => {
    expect(fitHistoryToBudget([user("long".repeat(100))], 10)).toHaveLength(1)
  })
})
