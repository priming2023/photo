import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

/** dist/ 폴더를 localhost HTTP로 제공 — file:// 대신 카메라·API 사용 가능 */
export const startLocalServer = (port = 37564) =>
  new Promise((resolve, reject) => {
    const distRoot = path.join(__dirname, '../dist');

    if (!fs.existsSync(distRoot)) {
      reject(new Error('dist 폴더 없음 — npm run build 먼저 실행'));
      return;
    }

    const server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
      let filePath = path.join(distRoot, urlPath === '/' ? 'index.html' : urlPath);

      if (!filePath.startsWith(distRoot)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }

      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(distRoot, 'index.html');
      }

      const ext = path.extname(filePath);
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    });

    server.on('error', reject);
    server.listen(port, '127.0.0.1', () => {
      const url = `http://127.0.0.1:${port}`;
      console.log('[Electron] 로컬 서버 시작:', url);
      resolve({ server, url });
    });
  });
