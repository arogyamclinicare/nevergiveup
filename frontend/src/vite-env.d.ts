/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_REACT_APP_SUPABASE_URL: string
  readonly VITE_REACT_APP_SUPABASE_ANON_KEY: string
  readonly VITE_REACT_APP_OWNER_USERNAME: string
  readonly VITE_REACT_APP_OWNER_PASSWORD: string
  readonly VITE_REACT_APP_STAFF_USERNAME: string
  readonly VITE_REACT_APP_STAFF_PASSWORD: string
  readonly VITE_REACT_APP_DEFAULT_PIN: string
  readonly VITE_REACT_APP_SESSION_TIMEOUT: string
  readonly VITE_REACT_APP_MAX_LOGIN_ATTEMPTS: string
  readonly VITE_REACT_APP_LOCKOUT_DURATION: string
  readonly VITE_REACT_APP_APP_NAME: string
  readonly VITE_REACT_APP_VERSION: string
  readonly VITE_REACT_APP_ENVIRONMENT: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
