/**
 * Base error class for the application
 */
export class AppError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ConfigError extends AppError {
  constructor(message: string) {
    super('Configuration error: ' + message);
  }
}

export class IPDetectionError extends AppError {
  constructor(message: string) {
    super('IP detection error: ' + message);
  }
}

export class CloudflareError extends AppError {
  constructor(message: string) {
    super('Cloudflare error: ' + message);
  }
}

export class DataError extends AppError {
  constructor(message: string) {
    super('Data error: ' + message);
  }
}

export class NotificationError extends AppError {
  constructor(message: string) {
    super('Notification error: ' + message);
  }
}
