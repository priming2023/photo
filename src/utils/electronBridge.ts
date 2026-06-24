export interface PrintResult {
  success: boolean;
  reason: string;
}

export interface PrinterInfo {
  name: string;
  isDefault: boolean;
  status: number;
}

declare global {
  interface Window {
    electronAPI?: {
      isElectron: boolean;
      printReceipt: (imageDataUrl: string) => Promise<PrintResult>;
      listPrinters: () => Promise<PrinterInfo[]>;
    };
  }
}

export const isElectron = (): boolean =>
  typeof window !== 'undefined' && !!window.electronAPI?.isElectron;

export const printReceipt = async (imageDataUrl: string): Promise<PrintResult> => {
  if (!window.electronAPI) {
    return { success: false, reason: 'Electron 환경이 아닙니다' };
  }
  return window.electronAPI.printReceipt(imageDataUrl);
};

export const listPrinters = async (): Promise<PrinterInfo[]> => {
  if (!window.electronAPI) return [];
  return window.electronAPI.listPrinters();
};
