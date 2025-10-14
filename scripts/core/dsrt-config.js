/* dsrt-config.js
   Minimal runtime config (frontend).
   In production, override values via server or at build-time (replace during deploy).
*/
window.DSRT_CONFIG = {
  ENV: 'production',                // 'development' | 'production'
  PREFIX: 'DSRT',
  COOKIE_TTL_DAYS: 180,
  ANALYTICS_ENDPOINT: '/collect',   // relative to same domain or absolute URL
  CATALOG_URL: '/config/games.json',
  PORTAL_NAME: 'DSRT Portal',
  CONSENT_KEY: 'DSRT_consent_v2',
  BATCH_MAX: 12,
  BATCH_INTERVAL_MS: 5000,
  BATCH_RETRY_LIMIT: 5,
  BATCH_RETRY_BASE_MS: 1000,
  CSP: {
    // Content Security Policy defaults (for injecting into HTML <meta> or server header)
    DEFAULT_SRC: ["'self'"],
    SCRIPT_SRC: ["'self'"],
    STYLE_SRC: ["'self'", "'unsafe-inline'"],
    IMG_SRC: ["'self'", "data:"],
    CONNECT_SRC: ["'self'"],
    OBJECT_SRC: ["'none'"]
  }
};
