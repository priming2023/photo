import { isElectron, printReceipt, type PrintResult } from './electronBridge';

const RECEIPT_PRINT_HTML = (imageDataUrl: string) => `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>영수증</title><style>
  @page { margin: 0; size: 80mm auto; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 80mm; background: #fff; }
  img { width: 80mm; height: auto; display: block; }
</style></head>
<body><img src="${imageDataUrl}" alt="영수증" /></body></html>`;

/** 브라우저: 영수증 PNG만 숨김 iframe에서 인쇄 (전체 페이지 인쇄 방지) */
const printInBrowser = (imageDataUrl: string): Promise<PrintResult> =>
  new Promise((resolve) => {
    try {
      const iframe = document.createElement('iframe');
      iframe.setAttribute(
        'style',
        'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden',
      );
      document.body.appendChild(iframe);

      const win = iframe.contentWindow;
      const doc = iframe.contentDocument;
      if (!win || !doc) {
        document.body.removeChild(iframe);
        resolve({ success: false, reason: '인쇄 프레임 생성 실패' });
        return;
      }

      let settled = false;
      const finish = (success: boolean, reason = '') => {
        if (settled) return;
        settled = true;
        setTimeout(() => {
          if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
        }, 300);
        resolve({ success, reason });
      };

      win.onafterprint = () => finish(true);

      doc.open();
      doc.write(RECEIPT_PRINT_HTML(imageDataUrl));
      doc.close();

      win.onload = () => {
        win.focus();
        win.print();
        setTimeout(() => finish(true), 5_000);
      };
    } catch (e) {
      resolve({ success: false, reason: e instanceof Error ? e.message : '브라우저 인쇄 실패' });
    }
  });

/**
 * 영수증 PNG만 80mm 용지로 인쇄 — 웹·Electron 동일 방식
 * Electron: silent 프린터 연동 / 웹: iframe 인쇄
 */
export const printReceiptImage = async (imageDataUrl: string): Promise<PrintResult> => {
  if (!imageDataUrl) return { success: false, reason: '영수증 이미지 없음' };

  if (isElectron()) {
    const result = await printReceipt(imageDataUrl);
    if (result.success) return result;
    console.warn('[Print] Electron 인쇄 실패, 브라우저 방식 폴백:', result.reason);
    return printInBrowser(imageDataUrl);
  }

  return printInBrowser(imageDataUrl);
};
