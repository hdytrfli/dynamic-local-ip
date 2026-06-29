# Dynamic Local IP Updater

A service that automatically updates a Cloudflare DNS record with your local machine's IP address. Useful for home servers or devices with dynamic IPs.

## Features

- Automatically detects your local IP address
- Updates Cloudflare DNS A records via the official Node.js SDK
- Sends notifications via ntfy.sh
- Persistent state tracking with automatic retry and cooldown
- Docker support with data persistence
- Configuration validation with Zod

## How It Works

The service runs every minute and:

1. Gets your local IP address
2. Compares it with the stored IP
3. If different (or on previous error), updates the Cloudflare DNS record
4. Sends a notification with the status
5. Stores the result in `data/cache.json`

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Create a `.env` file (see `.env.example`):
   ```env
   CLOUDFLARE_API_TOKEN=your-api-token
   CLOUDFLARE_DOMAIN=your-domain.com
   CLOUDFLARE_ZONE_ID=your-zone-id
   CLOUDFLARE_DNS_RECORD_ID=your-dns-record-id
   NTFY_TOPIC=your-ntfy-topic
   HOMEPAGE_URL=https://your-homepage.com
   ```
4. Run:
   ```bash
   pnpm dev
   ```

## Docker

### Using Docker Compose (Recommended)

```bash
docker compose up -d
```

Before running, edit `docker-compose.yml` with your actual Cloudflare credentials. The `data/` directory will be created and mounted for persistence.

### Using Docker Run

```bash
docker build -t dynamic-local-ip-updater .
docker run -d \
  --name dynamic-local-ip \
  --restart unless-stopped \
  --env-file .env \
  -v ./data:/app/data \
  dynamic-local-ip-updater
```

## Configuration

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| CLOUDFLARE_API_TOKEN | Cloudflare API token | Yes | - |
| CLOUDFLARE_DOMAIN | Domain to update (e.g. `home.example.com`) | Yes | - |
| CLOUDFLARE_ZONE_ID | Cloudflare zone ID | Yes | - |
| CLOUDFLARE_DNS_RECORD_ID | DNS record ID to update | Yes | - |
| NTFY_TOPIC | ntfy.sh notification topic | Yes | - |
| HOMEPAGE_URL | Homepage URL for notification action button | Yes | - |
| MAX_ATTEMPTS | Max retry attempts before cooldown | No | 3 |
| COOLDOWN_PERIOD | Cooldown period in ms after max attempts | No | 900000 (15 min) |

## Development

```bash
pnpm dev        # Run with hot reload
pnpm build      # Compile TypeScript
pnpm start      # Run compiled build
pnpm test       # Run tests
pnpm lint       # Lint code
pnpm format     # Format code
```

## Project Structure

```
src/
├── config/       # Environment validation (Zod)
├── libs/         # Shared utilities and types
├── services/     # Cloudflare DNS and notification logic
├── __tests__/    # Test suite (Vitest)
└── index.ts      # Entry point
```

## Data Persistence

State is stored in `data/cache.json`:
- Current IP address
- Last update time
- Error status and count

## Notifications

Uses [ntfy.sh](https://ntfy.sh) for push notifications. Customize in `src/services/notification/index.ts`.

## License

MIT
