const webview = document.getElementById('webview');
const progressBar = document.getElementById('progress-bar');
const loadingOverlay = document.getElementById('loading-overlay');
const urlText = document.getElementById('url-text');
const btnBack = document.getElementById('btn-back');
const btnForward = document.getElementById('btn-forward');
const btnRefresh = document.getElementById('btn-refresh');
const btnHome = document.getElementById('btn-home');
const btnMinimize = document.getElementById('btn-minimize');
const btnMaximize = document.getElementById('btn-maximize');
const btnClose = document.getElementById('btn-close');

let arenaUrl = 'https://arena.ai/';

function updateNavButtons() {
  btnBack.disabled = !webview.canGoBack();
  btnForward.disabled = !webview.canGoForward();
}

function updateUrlDisplay(url) {
  try {
    const parsed = new URL(url);
    urlText.textContent = parsed.hostname + parsed.pathname.replace(/\/$/, '');
  } catch {
    urlText.textContent = url;
  }
}

function setLoading(isLoading) {
  if (isLoading) {
    loadingOverlay.classList.remove('hidden');
    progressBar.classList.add('active');
  } else {
    loadingOverlay.classList.add('hidden');
    progressBar.style.width = '100%';
    setTimeout(() => {
      progressBar.classList.remove('active');
      progressBar.style.width = '0%';
    }, 300);
  }
}

function isArenaDomain(url) {
  try {
    const host = new URL(url).hostname;
    return host === 'arena.ai' || host.endsWith('.arena.ai');
  } catch {
    return false;
  }
}

function setupPlatformUi() {
  const platform = window.arenaApp.getPlatform();
  const useNativeFrame = platform === 'win32' || platform === 'darwin';

  if (useNativeFrame) {
    document.body.classList.add('native-frame');
    document.querySelector('.window-controls')?.remove();
  }
}

async function init() {
  setupPlatformUi();
  arenaUrl = await window.arenaApp.getArenaUrl();
  webview.src = arenaUrl;
  updateUrlDisplay(arenaUrl);
}

btnBack.addEventListener('click', () => webview.goBack());
btnForward.addEventListener('click', () => webview.goForward());
btnRefresh.addEventListener('click', () => webview.reload());
btnHome.addEventListener('click', () => {
  webview.loadURL(arenaUrl);
});

if (btnMinimize) btnMinimize.addEventListener('click', () => window.arenaApp.minimize());
if (btnMaximize) {
  btnMaximize.addEventListener('click', async () => {
    await window.arenaApp.maximize();
    const maximized = await window.arenaApp.isMaximized();
    btnMaximize.textContent = maximized ? '❐' : '□';
  });
}
if (btnClose) btnClose.addEventListener('click', () => window.arenaApp.close());

webview.addEventListener('did-start-loading', () => setLoading(true));
webview.addEventListener('did-stop-loading', () => {
  setLoading(false);
  updateNavButtons();
  updateUrlDisplay(webview.getURL());
});
webview.addEventListener('did-navigate', (_e) => {
  updateNavButtons();
  updateUrlDisplay(webview.getURL());
});
webview.addEventListener('did-navigate-in-page', () => {
  updateNavButtons();
  updateUrlDisplay(webview.getURL());
});
webview.addEventListener('load-progress', (e) => {
  progressBar.style.width = `${Math.round(e.progress * 100)}%`;
});
webview.addEventListener('page-title-updated', (e) => {
  document.title = e.title ? `${e.title} — Arena AI` : 'Arena AI';
});
webview.addEventListener('will-navigate', (e) => {
  if (!isArenaDomain(e.url)) {
    e.preventDefault();
    window.arenaApp.openExternal(e.url);
  }
});
webview.addEventListener('new-window', (e) => {
  e.preventDefault();
  if (isArenaDomain(e.url)) {
    webview.loadURL(e.url);
  } else {
    window.arenaApp.openExternal(e.url);
  }
});

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'r') {
    e.preventDefault();
    webview.reload();
  }
  if (e.altKey && e.key === 'ArrowLeft') {
    e.preventDefault();
    if (webview.canGoBack()) webview.goBack();
  }
  if (e.altKey && e.key === 'ArrowRight') {
    e.preventDefault();
    if (webview.canGoForward()) webview.goForward();
  }
  if (e.key === 'F5') {
    e.preventDefault();
    webview.reload();
  }
});

init();
