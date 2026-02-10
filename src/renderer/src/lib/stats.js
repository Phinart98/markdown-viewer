export function calculateStats(text) {
  const stripped = text.replace(/```[\s\S]*?```/g, '').replace(/[#*_`\[\]()>|~-]/g, '')
  const words = stripped.trim().split(/\s+/).filter(w => w.length > 0).length
  const readTime = Math.max(1, Math.ceil(words / 200))
  return {
    words,
    readTime: `${readTime} min read`,
    chars: text.length
  }
}
