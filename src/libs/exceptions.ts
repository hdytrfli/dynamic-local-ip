export class IPDetectionError extends Error {
  constructor(message: string) {
    super('IP detection error: ' + message);
  }
}

export class CloudflareError extends Error {
  constructor(message: string) {
    super('Cloudflare error: ' + message);
  }
}

export class NotificationError extends Error {
  constructor(message: string) {
    super('Notification error: ' + message);
  }
}
