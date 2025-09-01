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

You can run this service with Docker in three ways:

### Option 1: Using Docker Run (Build from source)

```bash
docker build -t dynamic-local-ip-updater .
docker run -d --env-file .env dynamic-local-ip-updater
```

### Option 2: Using Pre-built Image with Docker Run

```bash
docker run -d \
  --name dynamic-local-ip \
  --restart unless-stopped \
  -e CLOUDFLARE_EMAIL=your-email@example.com \
  -e CLOUDFLARE_DOMAIN=your-domain.com \
  -e CLOUDFLARE_ZONE_ID=your-zone-id \
  -e CLOUDFLARE_API_KEY=your-api-key \
  -e CLOUDFLARE_DNS_RECORD_ID=your-dns-record-id \
  -e NTFY_TOPIC=your-ntfy-topic \
  -e HOMEPAGE_URL=https://your-homepage.com \
  -e MAX_ATTEMPTS=3 \
  -e COOLDOWN_PERIOD=900000 \
  -e DATA_FILE=data.json \
  -v /path/to/data.json:/app/data.json \
  ghcr.io/hdytrfli/dynamic-local-ip:latest
```

### Option 3: Using Docker Compose (Recommended)

```bash
docker-compose up -d
```

The docker-compose setup includes:
- Predefined container name (`dynamic-local-ip`)
- Volume mount for data persistence
- All required environment variables with example values
- Automatic restart policy

Before running with docker-compose:
1. Edit `docker-compose.yml` with your actual values
2. Run with docker-compose:
   ```bash
   docker-compose up -d
   ```

The data will be persisted in `data.json` which is mounted as a volume.

Note: The pre-built Docker image is hosted on GitHub Container Registry and can be pulled directly without building from source.

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
| DATA_FILE | Data persistence file | No | data.json |

## Development Workflow

To ensure code quality, run these commands in order before committing:

```bash
# Format code
pnpm format

# Lint code
pnpm lint

# Run tests
pnpm test
```

## Docker Publishing

Docker images are automatically published to GitHub Container Registry (GHCR) when a new tag is pushed. The workflow is triggered automatically on tag pushes matching the pattern `v*`.

## Testing

The project includes a comprehensive test suite using Vitest:

```bash
# Run all tests
pnpm test

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

The service stores state in `data.json` to track:
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