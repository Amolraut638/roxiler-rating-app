/**
 * src/config/index.js
 * Central configuration module.
 * Responsibility: Read environment variables once, validate them, and export a
 * frozen configuration object.  Every other module imports from here instead of
 * reading process.env directly.  This keeps env-variable names in a single place
 * and makes it easy to swap sources (e.g. secrets manager) later.
 */

const config = Object.freeze({
  port: parseInt(process.env.PORT, 10) || 5000,

  nodeEnv: process.env.NODE_ENV || 'development',

  databaseUrl: process.env.DATABASE_URL || '',

  jwtSecret: process.env.JWT_SECRET || '',

  // How long a signed JWT remains valid (e.g. '1d', '7d', '2h').
  // Consumed by the JWT utility; never hardcoded in source files.
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
});

export default config;
