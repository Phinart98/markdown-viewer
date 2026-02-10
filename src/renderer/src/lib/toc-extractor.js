export function extractHeadings(markdownContent) {
  // Strip fenced code blocks before extracting headings
  const stripped = markdownContent.replace(/^```[\s\S]*?^```/gm, '')
  const headingRegex = /^(#{1,6})\s+(.+)$/gm
  const headings = []
  let match
  while ((match = headingRegex.exec(stripped)) !== null) {
    const level = match[1].length
    const text = match[2].replace(/[*_`\[\]]/g, '').trim()
    const slug = text.toLowerCase().replace(/[^\w]+/g, '-').replace(/^-+|-+$/g, '')
    headings.push({ level, text, slug })
  }
  return headings
}
