export function extractFrontMatter(rawContent) {
  // Simple YAML front matter parser (avoids gray-matter's Node.js dependencies in renderer)
  if (!rawContent.startsWith('---')) {
    return { data: null, content: rawContent }
  }
  const endIndex = rawContent.indexOf('\n---', 3)
  if (endIndex === -1) {
    return { data: null, content: rawContent }
  }
  const yamlBlock = rawContent.slice(4, endIndex).trim()
  const content = rawContent.slice(endIndex + 4).trim()

  // Parse simple key: value pairs
  const data = {}
  for (const line of yamlBlock.split('\n')) {
    const colonIndex = line.indexOf(':')
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim()
      let value = line.slice(colonIndex + 1).trim()
      // Handle arrays like [a, b, c]
      if (value.startsWith('[') && value.endsWith(']')) {
        value = value.slice(1, -1).split(',').map(s => s.trim())
      }
      data[key] = value
    }
  }

  return { data: Object.keys(data).length > 0 ? data : null, content }
}
