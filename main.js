const { app, BrowserWindow, Menu, shell } = require("electron");

const HOME_URL = "https://arena.ai/";

/**
 * Показываем понятный экран, если сайт временно недоступен.
 */
function buildErrorPage(errorCode, errorDescription) {
  return `data:text/html;charset=UTF-8,${encodeURIComponent(`
    <!doctype html>
    <html lang="ru">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Arena AI Desktop</title>
        <style>
          :root {
            color-scheme: dark;
          }
          body {
            margin: 0;
            min-height: 100vh;
            display: grid;
            place-items: center;
            font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
            background: #0b0f17;
            color: #e6edf3;
          }
          .card {
            width: min(540px, calc(100vw - 32px));
            background: #111827;
            border: 1px solid #263244;
            border-radius: 14px;
            padding: 24px;
            box-sizing: border-box;
          }
          h1 {
            margin: 0 0 10px;
            font-size: 24px;
          }
          p {
            margin: 0 0 14px;
            opacity: 0.9;
            line-height: 1.45;
          }
          .error {
            display: inline-block;
            margin: 2px 0 16px;
            padding: 6px 10px;
            border-radius: 999px;
            background: #1f2a3a;
            border: 1px solid #32445f;
            font-size: 13px;
          }
          button {
            border: none;
            border-radius: 10px;
            padding: 10px 16px;
            font-size: 14px;
            cursor: pointer;
            background: #16a34a;
            color: white;
          }
          button:hover {
            background: #15803d;
          }
        </style>
      </head>
      <body>
        <main class="card">
          <h1>Не удалось открыть arena.ai</h1>
          <p>Проверьте интернет-соединение и попробуйте снова.</p>
          <span class="error">Код: ${errorCode} · ${errorDescription}</span>
          <p>Если сайт доступен в браузере, нажмите кнопку ниже для повторной загрузки.</p>
          <button onclick="location.href='${HOME_URL}'">Повторить</button>
        </main>
      </body>
    </html>
  `)}`;
}

function createMenu(mainWindow) {
  const template = [
    {
      label: "Файл",
      submenu: [
        {
          label: "Открыть arena.ai",
          accelerator: "CmdOrCtrl+L",
          click: () => mainWindow.loadURL(HOME_URL),
        },
        {
          label: "Открыть в браузере",
          accelerator: "CmdOrCtrl+Shift+O",
          click: () => shell.openExternal(mainWindow.webContents.getURL() || HOME_URL),
        },
        { type: "separator" },
        { role: process.platform === "darwin" ? "close" : "quit", label: "Выход" },
      ],
    },
    {
      label: "Навигация",
      submenu: [
        {
          label: "Назад",
          accelerator: "Alt+Left",
          click: () => {
            if (mainWindow.webContents.canGoBack()) {
              mainWindow.webContents.goBack();
            }
          },
        },
        {
          label: "Вперед",
          accelerator: "Alt+Right",
          click: () => {
            if (mainWindow.webContents.canGoForward()) {
              mainWindow.webContents.goForward();
            }
          },
        },
        { type: "separator" },
        { role: "reload", label: "Обновить" },
        { role: "forceReload", label: "Жесткое обновление" },
        {
          label: "Домой (arena.ai)",
          accelerator: "CmdOrCtrl+Home",
          click: () => mainWindow.loadURL(HOME_URL),
        },
      ],
    },
    {
      label: "Вид",
      submenu: [
        { role: "zoomIn", label: "Увеличить" },
        { role: "zoomOut", label: "Уменьшить" },
        { role: "resetZoom", label: "Сбросить масштаб" },
        { type: "separator" },
        { role: "togglefullscreen", label: "Полный экран" },
      ],
    },
    {
      label: "Помощь",
      submenu: [
        {
          label: "Сайт arena.ai",
          click: () => shell.openExternal(HOME_URL),
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function createMainWindow() {
  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1024,
    minHeight: 680,
    title: "Arena AI Desktop",
    backgroundColor: "#0b0f17",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: true,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith(HOME_URL)) {
      return { action: "allow" };
    }

    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.webContents.on("did-fail-load", (_event, errorCode, errorDescription, _url, isMainFrame) => {
    if (!isMainFrame || errorCode === -3) {
      return;
    }

    mainWindow.loadURL(buildErrorPage(errorCode, errorDescription));
  });

  mainWindow.webContents.on("page-title-updated", (event) => {
    event.preventDefault();
  });

  mainWindow.loadURL(HOME_URL);
  createMenu(mainWindow);
}

const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    const [win] = BrowserWindow.getAllWindows();
    if (!win) {
      return;
    }
    if (win.isMinimized()) {
      win.restore();
    }
    win.focus();
  });

  app.whenReady().then(() => {
    createMainWindow();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
      }
    });
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });
}
