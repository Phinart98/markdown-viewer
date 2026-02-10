---
title: Example Document
author: Philip
date: 2026-02-08
tags: [markdown, viewer, example]
---

# Markdown Viewer Example

This document demonstrates the rendering features supported by Markdown Viewer.

## Text Formatting

This is **bold text**, this is *italic text*, and this is ~~strikethrough~~. You can also have `inline code` and [links](https://github.com).

## Code Blocks

### JavaScript

```javascript
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

const result = fibonacci(10);
console.log(`Fibonacci(10) = ${result}`);
```

### Python

```python
def quicksort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quicksort(left) + middle + quicksort(right)

print(quicksort([3, 6, 8, 10, 1, 2, 1]))
```

### SQL

```sql
SELECT u.name, COUNT(o.id) AS order_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.created_at > '2025-01-01'
GROUP BY u.name
HAVING COUNT(o.id) > 5
ORDER BY order_count DESC;
```

### Bash

```bash
#!/bin/bash
echo "Building project..."
npm run build && \
  docker build -t myapp:latest . && \
  docker push myapp:latest
echo "Done!"
```

## Tables

| Feature | Status | Priority |
|---------|--------|----------|
| Markdown rendering | Done | High |
| Syntax highlighting | Done | High |
| Dark mode | Done | Medium |
| Table of Contents | Done | Medium |
| File watching | Done | Medium |
| Edit mode | Done | Low |

## Task Lists

- [x] Set up Electron project
- [x] Add markdown-it rendering
- [x] Implement Shiki syntax highlighting
- [x] Add dark/light theme toggle
- [ ] Package as installable app
- [ ] Add KaTeX math support

## Blockquotes

> This is a blockquote. It can contain **bold text** and `code`.
>
> It can span multiple paragraphs too.

## Lists

### Ordered List

1. First item
2. Second item
   1. Nested item A
   2. Nested item B
3. Third item

### Unordered List

- Item one
- Item two
  - Nested item
  - Another nested
- Item three

## Horizontal Rule

---

## Images

Images with relative paths should work:
![Placeholder](https://via.placeholder.com/400x200?text=Markdown+Viewer)

## Footnotes

Here is a sentence with a footnote[^1].

And another one[^2].

[^1]: This is the first footnote.
[^2]: This is the second footnote with **bold** text.

## HTML Content

<details>
<summary>Click to expand</summary>

This content is hidden by default and revealed on click.

- Hidden item 1
- Hidden item 2
</details>

## Long Code Block

```json
{
  "name": "markdown-viewer",
  "version": "1.0.0",
  "description": "A lightweight desktop Markdown viewer with GitHub-style rendering",
  "main": "./out/main/index.js",
  "scripts": {
    "dev": "electron-vite dev",
    "build": "electron-vite build",
    "preview": "electron-vite preview",
    "package": "electron-vite build && electron-builder --config electron-builder.config.cjs"
  },
  "dependencies": {
    "chokidar": "^4.0.0",
    "electron-store": "^10.0.0",
    "gray-matter": "^4.0.3"
  }
}
```

---

*Open this file in Markdown Viewer to see all features in action.*
