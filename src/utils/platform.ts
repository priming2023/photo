import { isElectron } from './electronBridge';

export type AppPlatform = 'electron' | 'pwa' | 'web';

/** 현재 실행 환경 감지 — Electron 키오스크 / PWA / 일반 웹 */
export const getAppPlatform = (): AppPlatform => {
  if (isElectron()) return 'electron';
  if (typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) {
    return 'pwa';
  }
  return 'web';
};

export const isStandaloneApp = (): boolean => getAppPlatform() !== 'web';
