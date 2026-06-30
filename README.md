# Dynamic Local IP Updater

A service that automatically updates Cloudflare DNS A records with your local machine's LAN IP address. Designed for home servers whose local IP may change after a router reboot or DHCP renewal.

## Features

- Detects your local IPv4 address
- Updates multiple Cloudflare DNS records simultaneously
- CIDR range filtering — only update when IP is within a trusted subnet
- Stability monitoring — debounces transient IP flaps before updating
- Configurable retry with cooldown on failures
- Push notifications via ntfy.sh
- Docker support

## How It Works

The service runs every minute via `node-cron`:

1. Detects the current local IPv4 address
2. Checks the IP against the optional CIDR range filter
3. Applies stability monitoring — waits for the IP to remain stable for a configurable period before treating a change as real
4. On error, retries with exponential-like backoff using attempt count and cooldown
5. Updates all configured Cloudflare DNS records concurrently via `Promise.allSettled`
6. Sends a notification on success or failure

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Create a `.env` file (see `.env.example`):
   ```env
   CLOUDFLARE_API_TOKEN=your-api-token
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

```bash
docker compose up -d
```

Edit `docker-compose.yml` with your Cloudflare credentials before running.

## Configuration

| Variable                   | Description                                               | Required | Default           |
| -------------------------- | --------------------------------------------------------- | -------- | ----------------- |
| `CLOUDFLARE_API_TOKEN`     | Cloudflare API token                                      | Yes      | —                 |
| `CLOUDFLARE_ZONE_ID`       | Cloudflare zone ID                                        | Yes      | —                 |
| `CLOUDFLARE_DNS_RECORD_ID` | DNS record ID(s) — comma-separated for multiple           | Yes      | —                 |
| `NTFY_TOPIC`               | ntfy.sh notification topic                                | Yes      | —                 |
| `HOMEPAGE_URL`             | Homepage URL for the notification action button           | Yes      | —                 |
| `IP_RANGE`                 | CIDR range to filter the local IP (e.g. `192.168.0.0/24`) | No       | —                 |
| `STABILITY_PERIOD`         | Milliseconds to wait before trusting an IP change         | No       | `60000`           |
| `MAX_ATTEMPTS`             | Max retry attempts before entering cooldown               | No       | `3`               |
| `COOLDOWN_PERIOD`          | Cooldown period in ms after max attempts                  | No       | `900000` (15 min) |

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
├── config/          # Environment variable validation (Zod)
├── libs/
│   ├── exceptions   # Error classes
│   ├── ip           # IP detection and CIDR matching
│   ├── logger       # Pino logger
│   ├── state        # App state interface and store singleton
│   ├── storage      # Generic typed store
│   └── utils        # Guard/predicate functions
├── services/
│   ├── cloudflare   # DNS record update via Cloudflare SDK
│   └── notification # ntfy.sh push notifications
├── __tests__/       # Test suite (Vitest)
└── index.ts         # Entry point and orchestration
```

## License

MIT
