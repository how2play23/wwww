const { app, BrowserWindow, Menu, dialog, shell } = require('electron');
const path = require('node:path');

const ARENA_URL = 'https://arena.ai/';
const ARENA_HOST = 'arena.ai';
const ALLOWED_PERMISSIONS = new Set(['clipboard-read', 'display-capture', 'fullscreen', 'geolocation', 'media', 'notifications']);

let mainWindow;

function isArenaUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);
    return url.protocol === 'https:' && (url.hostname === ARENA_HOST || url.hostname.endsWith(`.${ARENA_HOST}`));
  } catch {
    return false;
  }
}

function isHttpUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function loadHome() {
  if (!mainWindow) {
    return;
  }

  mainWindow.loadURL(ARENA_URL);
}

function createApplicationMenu() {
  const template = [
    {
      label: 'Arena AI',
      submenu: [
        {
          label: 'На главную',
          accelerator: 'CmdOrCtrl+H',
          click: loadHome,
        },
        {
          label: 'Назад',
          accelerator: 'Alt+Left',
          click: () => {
            if (mainWindow?.webContents.canGoBack()) {
              mainWindow.webContents.goBack();
            }
          },
        },
        {
          label: 'Вперед',
          accelerator: 'Alt+Right',
          click: () => {
            if (mainWindow?.webContents.canGoForward()) {
              mainWindow.webContents.goForward();
            }
          },
        },
        {
          label: 'Обновить',
          accelerator: 'CmdOrCtrl+R',
          click: () => mainWindow?.webContents.reload(),
        },
        {
          label: 'Открыть текущую страницу в браузере',
          click: () => {
            const currentUrl = mainWindow?.webContents.getURL();
            if (currentUrl && isHttpUrl(currentUrl)) {
              shell.openExternal(currentUrl);
            }
          },
        },
        { type: 'separator' },
        {
          label: 'Выход',
          role: 'quit',
        },
      ],
    },
    {
      label: 'Правка',
      submenu: [
        { label: 'Отменить', role: 'undo' },
        { label: 'Повторить', role: 'redo' },
        { type: 'separator' },
        { label: 'Вырезать', role: 'cut' },
        { label: 'Копировать', role: 'copy' },
        { label: 'Вставить', role: 'paste' },
        { label: 'Выделить все', role: 'selectAll' },
      ],
    },
    {
      label: 'Вид',
      submenu: [
        { label: 'Увеличить', role: 'zoomIn' },
        { label: 'Уменьшить', role: 'zoomOut' },
        { label: 'Обычный размер', role: 'resetZoom' },
        { type: 'separator' },
        { label: 'Полный экран', role: 'togglefullscreen' },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function describePermission(permission) {
  const labels = {
    'clipboard-read': 'буферу обмена',
    'display-capture': 'записи экрана',
    fullscreen: 'полноэкранному режиму',
    geolocation: 'геолокации',
    media: 'камере или микрофону',
    notifications: 'уведомлениям',
  };

  return labels[permission] || permission;
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 960,
    minHeight: 640,
    title: 'Arena AI',
    icon: path.join(__dirname, '..', 'assets', 'icon.png'),
    backgroundColor: '#090d1a',
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  });

  // Some websites behave better when the browser identity does not include Electron.
  mainWindow.webContents.setUserAgent(
    mainWindow.webContents.getUserAgent().replace(/\sElectron\/\S+/, ''),
  );

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isArenaUrl(url)) {
      mainWindow.loadURL(url);
    } else if (isHttpUrl(url)) {
      shell.openExternal(url);
    }

    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (isHttpUrl(url)) {
      return;
    }

    event.preventDefault();
    shell.openExternal(url);
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedUrl) => {
    if (errorCode === -3) {
      return;
    }

    mainWindow.loadFile(path.join(__dirname, 'offline.html'), {
      query: {
        url: validatedUrl || ARENA_URL,
        error: errorDescription || 'Не удалось загрузить страницу.',
      },
    });
  });

  mainWindow.webContents.session.on('will-download', (event, item) => {
    item.once('done', (_event, state) => {
      if (state === 'completed') {
        shell.showItemInFolder(item.getSavePath());
      }
    });
  });

  mainWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback, details) => {
    const requestingUrl = details.requestingUrl || webContents.getURL();

    if (!ALLOWED_PERMISSIONS.has(permission) || !isArenaUrl(requestingUrl)) {
      callback(false);
      return;
    }

    dialog
      .showMessageBox(mainWindow, {
        type: 'question',
        buttons: ['Разрешить', 'Запретить'],
        defaultId: 0,
        cancelId: 1,
        title: 'Разрешение для Arena AI',
        message: `Разрешить Arena AI доступ к ${describePermission(permission)}?`,
      })
      .then(({ response }) => callback(response === 0))
      .catch(() => callback(false));
  });

  loadHome();
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!mainWindow) {
      return;
    }

    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }

    mainWindow.focus();
  });

  app.whenReady().then(() => {
    createApplicationMenu();
    createMainWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
      }
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
}
