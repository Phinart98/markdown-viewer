import { app, BrowserWindow, ipcMain, dialog, shell, Menu } from 'electron'
import path from 'node:path'
import fs from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { watch } from 'chokidar'
import fsSync from 'node:fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Simple JSON store (replaces electron-store to avoid ESM/CJS issues)
const storeFile = path.join(app.getPath('userData'), 'settings.json')
const storeDefaults = { recentFiles: [], windowBounds: { width: 1000, height: 700 } }

function loadStore() {
  try {
    if (fsSync.existsSync(storeFile)) {
      return { ...storeDefaults, ...JSON.parse(fsSync.readFileSync(storeFile, 'utf-8')) }
    }
  } catch { /* ignore */ }
  return { ...storeDefaults }
}

function saveStore(data) {
  try {
    fsSync.mkdirSync(path.dirname(storeFile), { recursive: true })
    fsSync.writeFileSync(storeFile, JSON.stringify(data, null, 2))
  } catch { /* ignore */ }
}

let storeData = loadStore()
const store = {
  get: (key) => storeData[key] ?? storeDefaults[key],
  set: (key, value) => { storeData[key] = value; saveStore(storeData) }
}

let mainWindow = null
const watchers = new Map()

// ─── Single Instance Lock ─────────────────────────────────
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', async (_event, commandLine) => {
    const filePath = commandLine.find(arg =>
      arg.endsWith('.md') || arg.endsWith('.markdown')
    )
    if (filePath && mainWindow) {
      try {
        const content = await fs.readFile(filePath, 'utf-8')
        mainWindow.webContents.send('file:opened', { filePath: path.resolve(filePath), content })
        addRecentFile(filePath)
      } catch (err) {
        console.error('Failed to open file from second instance:', err)
      }
    }
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })

  app.whenReady().then(async () => {
    createWindow()
    registerIpcHandlers()
    buildMenu()

    // Handle file passed via command line
    const fileArg = process.argv.find(arg =>
      arg.endsWith('.md') || arg.endsWith('.markdown')
    )
    if (fileArg) {
      mainWindow.webContents.once('did-finish-load', async () => {
        try {
          const content = await fs.readFile(fileArg, 'utf-8')
          mainWindow.webContents.send('file:opened', { filePath: path.resolve(fileArg), content })
          addRecentFile(fileArg)
        } catch (err) {
          console.error('Failed to open file from CLI:', err)
        }
      })
    }
  })
}

// ─── Window Management ────────────────────────────────────
function createWindow() {
  const bounds = store.get('windowBounds')

  mainWindow = new BrowserWindow({
    width: bounds.width || 1000,
    height: bounds.height || 700,
    x: bounds.x,
    y: bounds.y,
    minWidth: 600,
    minHeight: 400,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: !process.env.ELECTRON_RENDERER_URL // secure in production, relaxed in dev for file:// images
    },
    show: false,
    title: 'Markdown Viewer'
  })

  mainWindow.on('ready-to-show', () => mainWindow.show())

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  mainWindow.on('close', () => {
    store.set('windowBounds', mainWindow.getBounds())
  })

  mainWindow.on('closed', () => {
    stopAllWatching()
    mainWindow = null
  })
}

// ─── File Watching ────────────────────────────────────────
function watchFile(filePath) {
  const resolved = path.resolve(filePath)
  if (watchers.has(resolved)) return
  const watcher = watch(resolved, {
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 300, pollInterval: 100 }
  })
  watcher.on('change', async () => {
    try {
      const content = await fs.readFile(resolved, 'utf-8')
      if (mainWindow) {
        mainWindow.webContents.send('file:changed', { filePath: resolved, content })
      }
    } catch (err) {
      console.error('File watch error:', err)
    }
  })
  watchers.set(resolved, watcher)
}

function unwatchFile(filePath) {
  const resolved = path.resolve(filePath)
  const watcher = watchers.get(resolved)
  if (watcher) {
    watcher.close()
    watchers.delete(resolved)
  }
}

function stopAllWatching() {
  for (const watcher of watchers.values()) {
    watcher.close()
  }
  watchers.clear()
}

// ─── Recent Files ─────────────────────────────────────────
function addRecentFile(filePath) {
  const resolved = path.resolve(filePath)
  let recent = store.get('recentFiles')
  recent = recent.filter(f => f !== resolved)
  recent.unshift(resolved)
  if (recent.length > 10) recent.length = 10
  store.set('recentFiles', recent)
  app.addRecentDocument(resolved)
}

// ─── IPC Handlers ─────────────────────────────────────────
function registerIpcHandlers() {
  ipcMain.handle('file:open-dialog', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      filters: [
        { name: 'Markdown', extensions: ['md', 'markdown', 'mdown', 'mkd'] },
        { name: 'Text', extensions: ['txt'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    })
    if (result.canceled || result.filePaths.length === 0) return null
    const filePath = result.filePaths[0]
    const content = await fs.readFile(filePath, 'utf-8')
    addRecentFile(filePath)
    return { filePath: path.resolve(filePath), content }
  })

  ipcMain.handle('file:read', async (_event, filePath) => {
    const content = await fs.readFile(filePath, 'utf-8')
    addRecentFile(filePath)
    return { filePath: path.resolve(filePath), content }
  })

  ipcMain.handle('file:save', async (_event, filePath, content) => {
    await fs.writeFile(filePath, content, 'utf-8')
  })

  ipcMain.handle('file:save-as', async (_event, content) => {
    const result = await dialog.showSaveDialog(mainWindow, {
      filters: [{ name: 'Markdown', extensions: ['md'] }]
    })
    if (result.canceled) return null
    await fs.writeFile(result.filePath, content, 'utf-8')
    addRecentFile(result.filePath)
    return result.filePath
  })

  ipcMain.handle('file:watch', (_event, filePath) => {
    watchFile(filePath)
  })

  ipcMain.handle('file:unwatch', (_event, filePath) => {
    unwatchFile(filePath)
  })

  ipcMain.handle('file:get-recent', () => {
    return store.get('recentFiles')
  })

  ipcMain.handle('file:resolve-path', (_event, basePath, relativePath) => {
    return path.resolve(path.dirname(basePath), relativePath)
  })

  ipcMain.handle('print:to-pdf', async (_event, html) => {
    const printWindow = new BrowserWindow({
      show: false,
      width: 800,
      height: 600,
      webPreferences: {
        offscreen: true,
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true
      }
    })

    try {
      const fullHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    font-size: 14px; line-height: 1.6; color: #1f2328;
    padding: 40px; max-width: 800px; margin: 0 auto;
  }
  h1, h2, h3, h4, h5, h6 { margin-top: 24px; margin-bottom: 16px; font-weight: 600; line-height: 1.25; }
  h1 { font-size: 2em; padding-bottom: 0.3em; }
  h2 { font-size: 1.5em; padding-bottom: 0.3em; }
  h3 { font-size: 1.25em; }
  p { margin-top: 0; margin-bottom: 16px; }
  a { color: #0969da; text-decoration: none; }
  ul, ol { padding-left: 2em; margin-bottom: 16px; }
  li { margin-top: 0.25em; }
  blockquote { padding: 0 1em; color: #656d76; border-left: 0.25em solid #d0d7de; margin-bottom: 16px; }
  code { background: #f0f1f3; padding: 0.2em 0.4em; border-radius: 6px; font-size: 85%; font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace; }
  pre { background: #f6f8fa; padding: 16px; border-radius: 6px; overflow-x: auto; margin-bottom: 16px; border: 1px solid #d0d7de; }
  pre code { background: transparent; padding: 0; border: none; border-radius: 0; font-size: 85%; color: inherit; }
  table { border-collapse: collapse; width: 100%; margin-bottom: 16px; }
  th, td { padding: 6px 13px; border: 1px solid #d0d7de; }
  th { font-weight: 600; background: #f6f8fa; }
  tr:nth-child(2n) { background: #f6f8fa; }
  img { max-width: 100%; height: auto; }
  hr { height: 1px; background: #d8dee4; border: 0; margin: 24px 0; }
  .task-list-item { list-style-type: none; }
  .task-list-item input { margin-right: 0.5em; }
  .katex-display { margin: 1em 0; text-align: center; }
  mark.search-highlight { background: transparent; }
</style>
</head>
<body class="markdown-body">${html}</body>
</html>`

      await printWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(fullHtml))

      const pdfData = await printWindow.webContents.printToPDF({
        printBackground: true,
        pageSize: 'A4',
        margins: { top: 0.4, bottom: 0.4, left: 0.4, right: 0.4 }
      })

      const result = await dialog.showSaveDialog(mainWindow, {
        filters: [{ name: 'PDF', extensions: ['pdf'] }]
      })
      if (!result.canceled) {
        await fs.writeFile(result.filePath, pdfData)
        return result.filePath
      }
      return null
    } finally {
      printWindow.close()
    }
  })

  ipcMain.handle('window:set-title', (_event, title) => {
    if (mainWindow) mainWindow.setTitle(title)
  })

  ipcMain.handle('shell:open-external', (_event, url) => {
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      shell.openExternal(url)
    }
  })

  ipcMain.handle('shell:show-in-folder', (_event, filePath) => {
    shell.showItemInFolder(filePath)
  })

}

// ─── Application Menu ─────────────────────────────────────
function buildMenu() {
  const template = [
    {
      label: '&File',
      submenu: [
        {
          label: 'Open File...',
          accelerator: 'CmdOrCtrl+O',
          click: () => mainWindow?.webContents.send('menu:open-file')
        },
        {
          label: 'Close Tab',
          accelerator: 'CmdOrCtrl+W',
          click: () => mainWindow?.webContents.send('menu:close-tab')
        },
        { type: 'separator' },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => mainWindow?.webContents.send('menu:save')
        },
        { type: 'separator' },
        {
          label: 'Export to PDF...',
          accelerator: 'CmdOrCtrl+P',
          click: () => mainWindow?.webContents.send('menu:print')
        },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: '&View',
      submenu: [
        {
          label: 'Toggle Edit Mode',
          accelerator: 'CmdOrCtrl+E',
          click: () => mainWindow?.webContents.send('menu:toggle-edit')
        },
        {
          label: 'Toggle Table of Contents',
          accelerator: 'CmdOrCtrl+Shift+T',
          click: () => mainWindow?.webContents.send('menu:toggle-toc')
        },
        {
          label: 'Toggle Dark Mode',
          accelerator: 'CmdOrCtrl+Shift+D',
          click: () => mainWindow?.webContents.send('menu:toggle-theme')
        },
        { type: 'separator' },
        {
          label: 'Find',
          accelerator: 'CmdOrCtrl+F',
          click: () => mainWindow?.webContents.send('menu:find')
        },
        { type: 'separator' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { role: 'resetZoom' },
        { type: 'separator' },
        { role: 'toggleDevTools' }
      ]
    },
    {
      label: '&Help',
      submenu: [
        {
          label: 'About Markdown Viewer',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About Markdown Viewer',
              message: 'Markdown Viewer v1.0.0',
              detail: 'A lightweight desktop Markdown viewer with GitHub-style rendering.\n\nBuilt with Electron + React + markdown-it + Shiki.'
            })
          }
        }
      ]
    }
  ]

  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

// ─── App Lifecycle ────────────────────────────────────────
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
