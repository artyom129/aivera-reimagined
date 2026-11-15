export function toFileName(title: string, extension: string) {
  const base =
    title
      .replace(/[\\/:*?"<>|]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 80) || "aivera"
  return `${base}.${extension}`
}

function download(content: BlobPart, type: string, fileName: string) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const link = document.createElement("a")
  link.href = url
  link.download = fileName
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function downloadMarkdown(markdown: string, title: string) {
  download(markdown, "text/markdown;charset=utf-8", toFileName(title, "md"))
}

const WORD_STYLES = `
  body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; line-height: 1.4; }
  h1 { font-size: 16pt; } h2 { font-size: 14pt; } h3 { font-size: 12pt; }
  table { border-collapse: collapse; width: 100%; margin: 8pt 0; }
  th, td { border: 1px solid #999; padding: 4pt 6pt; vertical-align: top; text-align: left; }
  th { background: #eee; }
  blockquote { border-left: 3px solid #999; margin-left: 0; padding-left: 8pt; color: #444; }
`

export function escapeHtml(text: string) {
  return text.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`)
}

// Word opens HTML saved with a .doc extension, tables and headings included.
export function downloadWord(renderedHtml: string, title: string) {
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>${WORD_STYLES}</style></head><body>${renderedHtml}</body></html>`
  download(`﻿${html}`, "application/msword", toFileName(title, "doc"))
}

export function printHtml(renderedHtml: string) {
  const root = document.createElement("div")
  root.id = "print-root"
  root.innerHTML = `<div class="markdown-content">${renderedHtml}</div>`
  document.body.append(root)
  document.body.classList.add("printing-answer")

  const cleanup = () => {
    root.remove()
    document.body.classList.remove("printing-answer")
    window.removeEventListener("afterprint", cleanup)
  }
  window.addEventListener("afterprint", cleanup)
  window.print()
  // Some browsers never fire afterprint.
  setTimeout(cleanup, 60_000)
}
