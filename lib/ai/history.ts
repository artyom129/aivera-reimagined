export type HistoryMessage = {
  role: "user" | "assistant"
  text: string
}

// Keeps the newest messages that fit into the budget. Gemini wants the
// conversation to start with a user turn, so a leading answer is dropped.
// The newest message is always kept, even if it alone is over budget.
export function fitHistoryToBudget(messages: HistoryMessage[], budgetChars: number): HistoryMessage[] {
  const kept: HistoryMessage[] = []
  let used = 0

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index]
    if (kept.length > 0 && used + message.text.length > budgetChars) break
    kept.unshift(message)
    used += message.text.length
  }

  while (kept.length > 1 && kept[0].role !== "user") kept.shift()
  return kept
}
