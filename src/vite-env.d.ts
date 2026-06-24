/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FAL_KEY: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_PUBLIC_APP_URL: string;
  readonly VITE_STORE_NAME?: string;
  readonly VITE_STORE_BRANCH?: string;
  readonly VITE_STORE_ADDRESS?: string;
  readonly VITE_STORE_PHONE?: string;
  readonly VITE_SENTRY_DSN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
