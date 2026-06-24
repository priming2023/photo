import { app, BrowserWindow, ipcMain, globalShortcut, session } from 'electron';
import { autoUpdater } from 'electron-updater';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadEnvFile, getElectronConfig } from './env.js';
import { startLocalServer } from './localServer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

loadEnvFile();
const config = getElectronConfig();

let mainWindow;
let localServer;

/** 카메라·마이크 권한 (원격 HTTPS / localhost 공통) */
const setupMediaPermissions = () => {
  const mediaPerms = ['media', 'audioCapture', 'videoCapture'];

  session.defaultSession.setPermissionRequestHandler((_wc, permission, callback) => {
    callback(mediaPerms.includes(permission));
  });

  session.defaultSession.setPermissionCheckHandler((_wc, permission) =>
    mediaPerms.includes(permission),
  );
};

function createWindow() {
  const { isDev } = config;

  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1200,
    kiosk: !isDev,
    fullscreen: !isDev,
    autoHideMenuBar: true,
    alwaysOnTop: !isDev,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  loadAppContent();
}

/**
 * 하이브리드 로딩 전략
 * 1. 개발: Vite dev server (localhost:5173)
 * 2. 프로덕션 기본: 배포된 웹앱 URL (Vercel) — API 키·카메라 모두 정상
 * 3. 폴백: dist/ 를 localhost HTTP로 제공 (오프라인·네트워크 장애 시)
 */
const loadAppContent = async () => {
  const { isDev, appUrl, useLocal } = config;

  if (isDev) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
    return;
  }

  if (useLocal) {
    await loadLocalFallback();
    return;
  }

  console.log('[Electron] 웹앱 로드:', appUrl);
  mainWindow.loadURL(appUrl);

  mainWindow.webContents.once('did-fail-load', async (_event, errorCode, desc) => {
    console.warn(`[Electron] 웹앱 로드 실패 (${errorCode}: ${desc}) — 로컬 폴백`);
    await loadLocalFallback();
  });
};

const loadLocalFallback = async () => {
  try {
    if (!localServer) {
      localServer = await startLocalServer();
    }
    mainWindow.loadURL(localServer.url);
  } catch (err) {
    console.error('[Electron] 로컬 폴백 실패:', err.message);
  }
};

/** 관리자 단축키 */
const registerAdminShortcuts = () => {
  globalShortcut.register('Control+Shift+Q', () => {
    if (!mainWindow) return;
    mainWindow.setKiosk(false);
    mainWindow.setFullScreen(false);
    mainWindow.setAlwaysOnTop(false);
    console.log('[Electron] 키오스크 해제 — Cmd+Q 또는 Ctrl+Shift+X 로 종료');
  });

  globalShortcut.register('Control+Shift+K', () => {
    if (!mainWindow) return;
    mainWindow.setKiosk(true);
    mainWindow.setFullScreen(true);
    mainWindow.setAlwaysOnTop(true);
    console.log('[Electron] 키오스크 모드 복귀');
  });

  globalShortcut.register('Control+Shift+R', () => {
    if (!mainWindow) return;
    mainWindow.webContents.reload();
    console.log('[Electron] 페이지 새로고침');
  });

  globalShortcut.register('Control+Shift+X', () => {
    console.log('[Electron] 앱 종료 (Ctrl+Shift+X)');
    app.quit();
  });
};

/** 영수증 이미지(data URL)만 숨김 창에서 인쇄 */
const printReceiptImage = (imageDataUrl) =>
  new Promise((resolve) => {
    const printWin = new BrowserWindow({
      show: false,
      webPreferences: { contextIsolation: true, nodeIntegration: false },
    });

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  @page { margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: 80mm; }
  img { width: 80mm; height: auto; display: block; }
</style></head>
<body><img src="${imageDataUrl}" /></body></html>`;

    printWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

    printWin.webContents.on('did-finish-load', () => {
      const options = {
        silent: true,
        printBackground: true,
        color: false,
        copies: 1,
        margins: { marginType: 'none' },
      };

      if (config.printerName) {
        options.deviceName = config.printerName;
      }

      printWin.webContents.print(options, (success, failureReason) => {
        printWin.close();
        if (success) {
          console.log('[Electron] 영수증 인쇄 완료', config.printerName || '(기본 프린터)');
        } else {
          console.error('[Electron] 영수증 인쇄 실패:', failureReason);
        }
        resolve({ success, reason: failureReason || '' });
      });
    });

    printWin.webContents.on('did-fail-load', () => {
      printWin.close();
      resolve({ success: false, reason: '영수증 이미지 로드 실패' });
    });
  });

app.whenReady().then(() => {
  setupMediaPermissions();
  createWindow();
  registerAdminShortcuts();

  if (!config.isDev && process.platform === 'win32') {
    app.setLoginItemSettings({ openAtLogin: true, path: process.execPath });
  }

  if (!config.isDev) {
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.checkForUpdatesAndNotify().catch((err) => {
      console.warn('[Electron] 업데이트 확인 실패:', err.message);
    });
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  localServer?.server?.close();
});

app.on('window-all-closed', () => {
  if (config.isDev || process.platform !== 'darwin') app.quit();
});

ipcMain.handle('print-receipt', async (_event, imageDataUrl) => {
  if (!imageDataUrl) return { success: false, reason: '영수증 이미지 없음' };
  return printReceiptImage(imageDataUrl);
});

ipcMain.handle('list-printers', async () => {
  if (!mainWindow) return [];
  try {
    return await mainWindow.webContents.getPrintersAsync();
  } catch {
    return [];
  }
});

ipcMain.handle('get-platform-info', () => ({
  isElectron: true,
  appUrl: config.appUrl,
  useLocal: config.useLocal,
}));
