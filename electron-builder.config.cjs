/**
 * @type {import('electron-builder').Configuration}
 */
module.exports = {
  appId: 'com.markdownviewer.app',
  productName: 'Markdown Viewer',
  directories: {
    buildResources: 'resources',
    output: 'dist'
  },
  files: [
    'out/**/*'
  ],
  win: {
    target: ['nsis', 'portable'],
    icon: 'resources/icon.png',
    fileAssociations: [
      {
        ext: 'md',
        name: 'Markdown Document',
        description: 'Markdown text file',
        role: 'Editor'
      },
      {
        ext: 'markdown',
        name: 'Markdown Document',
        description: 'Markdown text file',
        role: 'Editor'
      }
    ]
  },
  nsis: {
    oneClick: false,
    perMachine: true,
    allowToChangeInstallationDirectory: true,
    deleteAppDataOnUninstall: false,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: 'Markdown Viewer'
  }
}
