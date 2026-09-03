/**
 * Secure structured logger for BidWise AI
 * Prevents credential, key, and sensitive document leakages
 */

const SENSITIVE_PATTERNS = [
  /AIza[0-9A-Za-z-_]{35}/g, // Gemini / Google API Key
  /bearer\s+[A-Za-z0-9\-_.]+/gi, // Bearer JWTs
  /mongodb(?:\+srv)?:\/\/[^\s]+/gi, // MongoDB URIs
  /password["':\s]+[^\s,}]+/gi
];

const sanitize = (message) => {
  if (typeof message !== 'string') {
    try {
      message = JSON.stringify(message);
    } catch {
      message = String(message);
    }
  }
  let sanitized = message;
  SENSITIVE_PATTERNS.forEach((pattern) => {
    sanitized = sanitized.replace(pattern, '[REDACTED_SECRET]');
  });
  return sanitized;
};

const logger = {
  info: (msg, meta = '') => {
    console.log(`[INFO] [${new Date().toISOString()}] ${sanitize(msg)}`, meta ? sanitize(meta) : '');
  },
  warn: (msg, meta = '') => {
    console.warn(`[WARN] [${new Date().toISOString()}] ${sanitize(msg)}`, meta ? sanitize(meta) : '');
  },
  error: (msg, error = '') => {
    const errorDetails = error instanceof Error ? error.stack : error;
    console.error(`[ERROR] [${new Date().toISOString()}] ${sanitize(msg)}`, errorDetails ? sanitize(errorDetails) : '');
  },
  debug: (msg, meta = '') => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`[DEBUG] [${new Date().toISOString()}] ${sanitize(msg)}`, meta ? sanitize(meta) : '');
    }
  }
};

module.exports = logger;
