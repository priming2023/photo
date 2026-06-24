import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** .env 파일 로드 (개발·배포 공통 — exe 옆 .env 또는 프로젝트 루트) */
export const loadEnvFile = () => {
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

export const getElectronConfig = () => {
  const isDev = !!process.env.VITE_DEV_SERVER_URL;
  const appUrl =
    process.env.VITE_PUBLIC_APP_URL ||
    process.env.ELECTRON_APP_URL ||
    'https://phto-orcin.vercel.app';
  const useLocal = process.env.ELECTRON_USE_LOCAL === 'true';
  const printerName = process.env.PRINTER_NAME || '';

  return { isDev, appUrl: appUrl.replace(/\/$/, ''), useLocal, printerName };
};
