const VARIABLE = /\{([^{}\n]{1,60})\}/g

// "{предмет}" and "{ класс }" are variables; "{}" and multi-line braces are not.
export function extractVariables(content: string): string[] {
  const names = new Set<string>()
  for (const match of content.matchAll(VARIABLE)) {
    const name = match[1].trim()
    if (name) names.add(name)
  }
  return [...names].slice(0, 30)
}

// Unfilled variables stay as "{name}" so the teacher sees what is missing.
export function fillTemplate(content: string, values: Record<string, string>): string {
  return content.replace(VARIABLE, (whole, rawName: string) => {
    const value = values[rawName.trim()]?.trim()
    return value ? value : whole
  })
}

export function missingVariables(content: string, values: Record<string, string>): string[] {
  return extractVariables(content).filter((name) => !values[name]?.trim())
}
