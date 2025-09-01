/**
 * Base error class for the application
 */
export class AppError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

const PREFIXES = {
  CONFIG: 'Configuration error',
  IP_DETECTION: 'IP detection error',
  CLOUDFLARE: 'Cloudflare error',
  DATA: 'Data error',
  NOTIFICATION: 'Notification error',
} as const;

/**
 * Error thrown when environment variables are missing or invalid
 */
export class ConfigError extends AppError {
  constructor(message: string) {
    super(`${PREFIXES.CONFIG}: ${message}`);
  }
}

/**
 * Error thrown when IP detection fails
 */
export class IPDetectionError extends AppError {
  constructor(message: string) {
    super(`${PREFIXES.IP_DETECTION}: ${message}`);
  }
}

/**
 * Error thrown when Cloudflare API calls fail
 */
export class CloudflareError extends AppError {
  constructor(message: string) {
    super(`${PREFIXES.CLOUDFLARE}: ${message}`);
  }
}

/**
 * Error thrown when data persistence operations fail
 */
export class DataError extends AppError {
  constructor(message: string) {
    super(`${PREFIXES.DATA}: ${message}`);
  }
}

/**
 * Error thrown when notification sending fails
 */
export class NotificationError extends AppError {
  constructor(message: string) {
    super(`${PREFIXES.NOTIFICATION}: ${message}`);
  }
}
