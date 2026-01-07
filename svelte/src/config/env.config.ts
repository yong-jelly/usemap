// src/config/env.config.ts
export const ENV_CONFIG = {
    API_URL: import.meta.env.VITE_API_URL,
    API_VERSION: import.meta.env.VITE_API_VERSION,
    API_TIMEOUT: import.meta.env.VITE_API_TIMEOUT,
    AUTH_TOKEN_KEY: import.meta.env.VITE_AUTH_TOKEN_KEY,
    REFRESH_TOKEN_KEY: import.meta.env.VITE_REFRESH_TOKEN_KEY,
    API_PROD_URL: import.meta.env.VITE_API_PROD_URL,
    PROD_URL: import.meta.env.VITE_PROD_URL,
    FORCE_API_PROD_URL: import.meta.env.VITE_FORCE_API_PROD_URL
  };
  