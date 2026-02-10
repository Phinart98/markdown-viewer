import MarkdownIt from 'markdown-it'
import taskLists from 'markdown-it-task-lists'
import footnote from 'markdown-it-footnote'
import anchor from 'markdown-it-anchor'
import katex from 'katex'
import katexPlugin from '@vscode/markdown-it-katex'

let shikiPlugin = null
let initPromise = null

export function initializePipeline() {
  if (initPromise) return initPromise
  initPromise = (async () => {
    try {
      const { fromHighlighter } = await import('@shikijs/markdown-it')
      const { createHighlighter } = await import('shiki')
      const highlighter = await createHighlighter({
        themes: ['github-light', 'github-dark'],
        langs: [
          'javascript', 'typescript', 'python', 'java', 'c', 'cpp', 'csharp',
          'go', 'rust', 'ruby', 'php', 'swift', 'kotlin', 'html', 'css',
          'json', 'yaml', 'toml', 'xml', 'sql', 'bash', 'shell', 'powershell',
          'dockerfile', 'markdown', 'properties', 'ini', 'diff', 'plaintext'
        ]
      })
      shikiPlugin = fromHighlighter(highlighter, {
        themes: {
          light: 'github-light',
          dark: 'github-dark'
        }
      })
    } catch (err) {
      console.warn('Shiki initialization failed, falling back to plain code blocks:', err)
    }
  })()
  return initPromise
}

export function createMarkdownRenderer() {
  const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    breaks: false
  })

  md.use(taskLists, { enabled: false, label: true })
  md.use(footnote)
  md.use(anchor, {
    permalink: false,
    slugify: (s) => s.toLowerCase().replace(/[^\w]+/g, '-').replace(/^-+|-+$/g, '')
  })

  const katexFn = typeof katexPlugin === 'function' ? katexPlugin : katexPlugin.default
  if (katexFn) md.use(katexFn, { katex, throwOnError: false })

  if (shikiPlugin) {
    md.use(shikiPlugin)
  }

  // Custom image rule: resolve relative paths
  const defaultImageRender = md.renderer.rules.image ||
    ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options))

  md.renderer.rules.image = (tokens, idx, options, env, self) => {
    const token = tokens[idx]
    const src = token.attrGet('src')
    if (src && !src.startsWith('http') && !src.startsWith('data:') && !src.startsWith('file:')) {
      const resolvedBase = env.basePath
      if (resolvedBase) {
        const absolutePath = resolvedBase.replace(/\\/g, '/') + '/' + src
        token.attrSet('src', 'file:///' + absolutePath)
      }
    }
    return defaultImageRender(tokens, idx, options, env, self)
  }

  // Custom link rule: mark external links
  const defaultLinkRender = md.renderer.rules.link_open ||
    ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options))

  md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
    const href = tokens[idx].attrGet('href')
    if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
      tokens[idx].attrSet('target', '_blank')
      tokens[idx].attrSet('rel', 'noopener noreferrer')
      tokens[idx].attrSet('data-external', 'true')
    }
    return defaultLinkRender(tokens, idx, options, env, self)
  }

  return md
}
