type Dated = { updated_at: string }

export type ChatGroup<T> = { label: string; chats: T[] }

const DAY = 24 * 60 * 60 * 1000

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

// Chats come sorted by updated_at desc; groups keep that order.
export function groupChatsByDate<T extends Dated>(chats: T[], now = new Date()): ChatGroup<T>[] {
  const today = startOfDay(now)
  const buckets: ChatGroup<T>[] = [
    { label: "Сегодня", chats: [] },
    { label: "Вчера", chats: [] },
    { label: "Последние 7 дней", chats: [] },
    { label: "Последние 30 дней", chats: [] },
    { label: "Раньше", chats: [] },
  ]

  for (const chat of chats) {
    const time = new Date(chat.updated_at).getTime()
    if (time >= today) buckets[0].chats.push(chat)
    else if (time >= today - DAY) buckets[1].chats.push(chat)
    else if (time >= today - 7 * DAY) buckets[2].chats.push(chat)
    else if (time >= today - 30 * DAY) buckets[3].chats.push(chat)
    else buckets[4].chats.push(chat)
  }

  return buckets.filter((bucket) => bucket.chats.length > 0)
}
