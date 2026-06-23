import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1200,
    kiosk: true, // 전체화면 고정 모드 (키오스크)
    autoHideMenuBar: true,
    alwaysOnTop: true, // 다른 창 위에 항상 고정
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    }
  });

  // 개발 모드일 경우 로컬 서버, 빌드 시에는 dist/index.html 로드
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// React에서 인쇄 요청이 오면 묵시적 인쇄(Silent Print)를 수행하는 IPC 리스너
ipcMain.on('print-receipt', (event) => {
  if (mainWindow) {
    mainWindow.webContents.print({
      silent: true,      // 인쇄 팝업 숨김
      printBackground: true,
      color: false,      // 흑백
      copies: 1
    }, (success, failureReason) => {
      if (!success) console.error('프린트 실패:', failureReason);
    });
  }
});
