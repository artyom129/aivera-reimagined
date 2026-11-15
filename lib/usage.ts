type UsageFields = {
  tokens_used: number
  token_limit: number
  usage_period_start?: string | null
}

// The counter is reset lazily on the next AI request, so a stale
// period from last month already means "nothing used yet".
export function currentMonthUsage(profile: UsageFields, now = new Date()) {
  const monthStart = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-01`
  const isCurrent = !profile.usage_period_start || profile.usage_period_start >= monthStart
  const used = isCurrent ? profile.tokens_used : 0
  const limit = profile.token_limit
  return {
    used,
    limit,
    remaining: limit > 0 ? Math.max(limit - used, 0) : Infinity,
    ratio: limit > 0 ? used / limit : 0,
  }
}
