import { app, BrowserWindow, ipcMain, globalShortcut } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

/** .env 파일 로드 (개발·배포 공통 — exe 옆 .env 또는 프로젝트 루트) */
const loadEnvFile = () => {
  const candidates = [
    path.join(__dirname, '../.env'),
    path.join(process.resourcesPath || '', '.env'),
    path.join(path.dirname(process.execPath), '.env'),
  ];

  for (const envPath of candidates) {
    if (!fs.existsSync(envPath)) continue;
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
    console.log('[Electron] .env 로드:', envPath);
    break;
  }
};

loadEnvFile();

const PRINTER_NAME = process.env.PRINTER_NAME || '';
const isDev = !!process.env.VITE_DEV_SERVER_URL;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1200,
    kiosk: true,
    autoHideMenuBar: true,
    alwaysOnTop: !isDev,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

/** 관리자 키오스크 탈출: Ctrl+Shift+Q */
const registerAdminShortcuts = () => {
  globalShortcut.register('Control+Shift+Q', () => {
    if (!mainWindow) return;
    mainWindow.setKiosk(false);
    mainWindow.setFullScreen(false);
    mainWindow.setAlwaysOnTop(false);
    console.log('[Electron] 키오스크 모드 해제 (Ctrl+Shift+Q)');
  });

  globalShortcut.register('Control+Shift+K', () => {
    if (!mainWindow) return;
    mainWindow.setKiosk(true);
    mainWindow.setFullScreen(true);
    mainWindow.setAlwaysOnTop(true);
    console.log('[Electron] 키오스크 모드 복귀 (Ctrl+Shift+K)');
  });
};

/**
 * 영수증 이미지(data URL)만 숨김 창에서 인쇄
 * — 메인 UI 전체가 아닌 영수증 PNG만 출력
 */
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

      if (PRINTER_NAME) {
        options.deviceName = PRINTER_NAME;
      }

      printWin.webContents.print(options, (success, failureReason) => {
        printWin.close();
        if (success) {
          console.log('[Electron] 영수증 인쇄 완료', PRINTER_NAME || '(기본 프린터)');
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
  createWindow();
  registerAdminShortcuts();

  // 프로덕션: Windows 시작 시 자동 실행
  if (!isDev && process.platform === 'win32') {
    app.setLoginItemSettings({ openAtLogin: true, path: process.execPath });
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
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
