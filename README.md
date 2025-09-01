# Dynamic Local IP Updater

A simple service that automatically updates a Cloudflare DNS record with your local machine's IP address. Useful for home servers or devices with dynamic IPs that you want to access remotely.

## Features

- Automatically detects your local IP address
- Updates Cloudflare DNS records
- Sends notifications via ntfy.sh
- Persistent state tracking
- Error handling with retry logic
- Docker support
- Configuration validation with Zod
- Comprehensive test suite
- Clean project structure

## How It Works

The service runs every minute and:

1. Gets your local IP address
2. Compares it with the stored IP
3. If different (or on error), updates your Cloudflare DNS record
4. Sends a notification with the status
5. Stores the result for persistence

## Setup

1. Clone this repository
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Create a `.env` file with your Cloudflare credentials (see `.env.example`):
   ```env
   CLOUDFLARE_EMAIL=your-email@example.com
   CLOUDFLARE_DOMAIN=your-domain.com
   CLOUDFLARE_ZONE_ID=your-zone-id
   CLOUDFLARE_API_KEY=your-api-key
   CLOUDFLARE_DNS_RECORD_ID=your-dns-record-id
   ```
4. Run the service:
   ```bash
   pnpm start
   ```

## Docker

You can also run this service with Docker:

```bash
docker build -t dynamic-ip-updater .
docker run -d --env-file .env dynamic-ip-updater
```

## Configuration

The service can be configured using environment variables:

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| CLOUDFLARE_EMAIL | Your Cloudflare account email | Yes | - |
| CLOUDFLARE_DOMAIN | The domain to update | Yes | - |
| CLOUDFLARE_ZONE_ID | Your Cloudflare zone ID | Yes | - |
| CLOUDFLARE_API_KEY | Your Cloudflare API key | Yes | - |
| CLOUDFLARE_DNS_RECORD_ID | The DNS record ID to update | Yes | - |
| NTFY_TOPIC | Notification topic | Yes | - |
| HOMEPAGE_URL | Homepage URL for notifications | Yes | - |
| MAX_ATTEMPTS | Max retry attempts | No | 3 |
| COOLDOWN_PERIOD | Cooldown period in ms | No | 900000 (15 min) |
| DATA_FILE | Data persistence file | No | ip_updater_data.json |

## Development Workflow

To ensure code quality, run these commands in order before committing:

```bash
# Format code
pnpm format

# Lint code
pnpm lint

# Check code (lint + format + other checks)
pnpm check

# Run tests
pnpm test:run
```

## Version Management

This project uses `bumpp` for version management. To bump the version and create a commit with a tag:

```bash
# Patch version bump (1.0.0 -> 1.0.1)
pnpm version:bump:patch

# Minor version bump (1.0.1 -> 1.1.0)
pnpm version:bump:minor

# Major version bump (1.1.0 -> 2.0.0)
pnpm version:bump:major

# Custom version bump with specific version and message
pnpm version:bump
```

## Docker Publishing

Docker images are automatically published to GitHub Container Registry (GHCR) when a new tag is pushed. The workflow is triggered automatically on tag pushes matching the pattern `v*`.

## Testing

The project includes a comprehensive test suite using Vitest:

```bash
# Run all tests
pnpm test:run

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

## Project Structure

```
src/
├── config/          # Configuration and environment validation
├── libs/            # Shared types and utilities
├── services/        # Business logic (Cloudflare, notifications)
├── __tests__/       # Test files
└── index.ts         # Main entry point
```

## Notifications

The service uses [ntfy.sh](https://ntfy.sh) for notifications. You can modify the notification code in `src/services/notification/index.ts` to use a different service if needed.

## Data Persistence

The service stores state in `ip_updater_data.json` to track:
- Current IP address
- Last update time
- Error status and count
- Last error time

This file is automatically created and updated.

## Error Handling

The service includes error handling with:
- Retry logic (configurable attempts)
- Cooldown period (configurable time) after failed attempts
- Persistent error tracking
- Detailed logging
- Configuration validation with Zod