// Environment Configuration
export const ENV = {
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes in milliseconds
  MAX_LOGIN_ATTEMPTS: 3,
  LOCKOUT_DURATION: 5 * 60 * 1000, // 5 minutes in milliseconds
  APP_NAME: 'Milk Delivery App',
  VERSION: '1.0.0',
  ENVIRONMENT: 'production'
}

// Get environment variables safely
export const getEnvVar = (key: string, defaultValue: string = ''): string => {
  if (typeof window !== 'undefined' && (window as any).__ENV__) {
    return (window as any).__ENV__[key] || defaultValue
  }
  return defaultValue
}

