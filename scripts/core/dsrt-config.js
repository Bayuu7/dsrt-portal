window.DSRT_CONFIG = {
  ENV: 'production',
  PREFIX: 'DSRT',
  COOKIE_TTL_DAYS: 180,
  ANALYTICS_ENDPOINT: '/collect',
  TOKEN_ENDPOINT: '/token',
  CATALOG_URL: '/config/games.json',
  PORTAL_NAME: 'DSRT Portal',
  CONSENT_KEY: 'DSRT_consent_v2',
  BATCH_MAX: 12,
  BATCH_INTERVAL_MS: 5000,
  BATCH_RETRY_LIMIT: 5,
  BATCH_RETRY_BASE_MS: 1000,
  SENTRY_DSN: '' // set your DSN in production (do NOT put secret server-side keys here)
};
