import { config } from "dotenv"
import pino from "pino"
import { schedule } from "node-cron"

config()

const EMAIL = process.env.CLOUDFLARE_EMAIL
const DOMAIN = process.env.CLOUDFLARE_DOMAIN
const ZONE_ID = process.env.CLOUDFLARE_ZONE_ID
const API_KEY = process.env.CLOUDFLARE_API_KEY
const DNS_RECORD_ID = process.env.CLOUDFLARE_DNS_RECORD_ID

const logger = pino({
  transport: {
    targets: [
      {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      },
    ],
  },
})

const MAX_ATTEMPTS = 3
const COOLDOWN_PERIOD = 15 * 60 * 1000
const DATA_FILE = "ip_updater_data.json"

interface Data {
  current_ip: string | null
  attemp_count: number
  last_updated: string | null
  last_error: string | null
  is_error: boolean
}

const getLocalIP = async (): Promise<string> => {
  try {
    const proc = Bun.spawn(["hostname", "--all-ip-address"])
    const output = await new Response(proc.stdout).text()
    return output.trim().split(" ")[0]
  } catch (error) {
    logger.error({ error }, "Error getting local IP")
    throw error
  }
}

const readData = async (): Promise<Data> => {
  try {
    const file = Bun.file(DATA_FILE)
    const exists = await file.exists()
    if (exists) return await file.json()
  } catch (error) {
    logger.error({ error }, "Error reading data file")
  }

  return {
    attemp_count: 0,
    current_ip: null,
    last_updated: null,
    last_error: null,
    is_error: false,
  }
}

const writeData = async (data: Data): Promise<void> => {
  try {
    await Bun.write(DATA_FILE, JSON.stringify(data, null, 2))
  } catch (error) {
    logger.error({ error }, "Error writing data file")
  }
}

const updateCloudflare = async (ip: string): Promise<boolean> => {
  logger.info({ domain: DOMAIN, ip }, "Updating Cloudflare")

  const url = `https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records/${DNS_RECORD_ID}`

  try {
    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-Auth-Email": EMAIL as string,
        "X-Auth-Key": API_KEY as string,
      },
      body: JSON.stringify({
        type: "A",
        ttl: 3600,
        content: ip,
        name: DOMAIN,
        proxied: false,
      }),
    })

    const result = await response.json() as { success: boolean }
    logger.info({ result }, "Cloudflare update result")
    return response.ok && result.success
  } catch (error) {
    logger.error({ error }, "Error updating Cloudflare")
    return false
  }
}

const sendNotification = async (data: Data) => {
  const message = data.is_error
    ? `Failed to update IP. Attempts: ${data.attemp_count}. Last error: ${data.last_error}`
    : `Current IP: ${data.current_ip}. Last updated: ${data.last_updated}`

  await fetch("https://ntfy.sh", {
    method: "POST",
    body: JSON.stringify({
      topic: "nichiyoo-notification",
      message: message,
      actions: [
        {
          action: "view",
          label: "Open Glance",
          url: "https://glance.nichi.duckdns.org",
          clear: true,
        },
      ],
    }),
  })

  logger.info({ message }, "Notification sent")
}

const checkAndUpdateIP = async () => {
  const currentIP = await getLocalIP()
  const data = await readData()

  if (currentIP !== data.current_ip || data.is_error) {
    logger.info(
      { currentIP, storedIP: data.current_ip, errorFlag: data.is_error },
      "IP change detected or previous error",
    )

    const success = await updateCloudflare(currentIP)

    if (success) {
      data.current_ip = currentIP
      data.last_updated = new Date().toISOString()
      data.attemp_count = 0
      data.last_error = null
      data.is_error = false
    } else {
      data.attemp_count += 1
      data.last_error = new Date().toISOString()
      data.is_error = true
    }

    await writeData(data)
    await sendNotification(data)
  } else {
    logger.debug("No IP change detected")
  }
}

schedule("* * * * *", async () => {
  try {
    const data = await readData()
    const now = new Date()
    const parsed = data.last_error ? new Date(data.last_error) : null
    const diff = parsed && now.getTime() - parsed.getTime()

    if (data.is_error) {
      if (data.attemp_count >= MAX_ATTEMPTS) {
        if (diff && diff < COOLDOWN_PERIOD) {
          logger.info("In cooldown period, skipping update")
          return
        } else {
          data.attemp_count = 0
          await writeData(data)
        }
      }
    }

    await checkAndUpdateIP()
  } catch (error) {
    logger.error({ error }, "Error in cron job")
  }
})

logger.info("Cloudflare IP updater started")