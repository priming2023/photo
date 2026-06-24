/** 매장 브랜딩 — 환경변수로 다른 지점 재사용 가능 */
export const storeConfig = {
  name: import.meta.env.VITE_STORE_NAME || '월드킹 당진서산점',
  branch: import.meta.env.VITE_STORE_BRANCH || '당진서산점',
  address: import.meta.env.VITE_STORE_ADDRESS || '충남 당진시',
  phone: import.meta.env.VITE_STORE_PHONE || '',
  receiptTagline: '미래의 내 모습 포토부스',
};

export const storeDisplayName = () =>
  storeConfig.name.includes(storeConfig.branch)
    ? storeConfig.name
    : `${storeConfig.name} ${storeConfig.branch}`;
