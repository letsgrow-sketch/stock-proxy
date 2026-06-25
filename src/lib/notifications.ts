export interface NotificationMessage {
  title: string
  body: string
  stockCode: string
  stockName: string
  price: number
  changePercent: number
  type: string
  details?: string
  url?: string
}

export interface ChannelConfig {
  type: "email" | "telegram" | "whatsapp" | "browser"
  enabled: boolean
  config: Record<string, string>
}

export async function sendNotification(
  channel: ChannelConfig,
  message: NotificationMessage
): Promise<{ ok: boolean; error?: string }> {
  switch (channel.type) {
    case "email":
      return sendEmail(channel.config, message)
    case "telegram":
      return sendTelegram(channel.config, message)
    case "whatsapp":
      return sendWhatsApp(channel.config, message)
    case "browser":
      return sendBrowserPush(channel.config, message)
    default:
      return { ok: false, error: `Unknown channel type: ${channel.type}` }
  }
}

async function sendEmail(
  config: Record<string, string>,
  msg: NotificationMessage
): Promise<{ ok: boolean; error?: string }> {
  const { emailFrom, emailTo, smtpHost, smtpPort, smtpUser, smtpPass } = config
  if (!emailTo) return { ok: false, error: "No recipient email configured" }

  const html = buildEmailHtml(msg)
  const text = buildPlainText(msg)

  try {
    const payload = {
      from: emailFrom || "noreply@idx-screener.app",
      to: emailTo,
      subject: msg.title,
      text,
      html,
    }

    if (smtpHost && smtpUser && smtpPass) {
      const res = await fetch(`https://api.sendgrid.com/v3/mail/send`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${smtpPass}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: emailTo }] }],
          from: { email: emailFrom || "noreply@idx-screener.app" },
          subject: msg.title,
          content: [
            { type: "text/plain", value: text },
            { type: "text/html", value: html },
          ],
        }),
      })
      if (!res.ok) {
        const errText = await res.text()
        return { ok: false, error: `SendGrid error: ${res.status} ${errText}` }
      }
      return { ok: true }
    }

    const res = await fetch("https://api.mailgun.net/v3/sandbox.mailgun.org/messages", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${btoa(`api:${smtpPass || ""}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        from: emailFrom || "noreply@idx-screener.app",
        to: emailTo,
        subject: msg.title,
        text,
        html,
      }),
    })
    if (!res.ok) {
      const errText = await res.text()
      return { ok: false, error: `Mailgun error: ${res.status} ${errText}` }
    }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: String(err) }
  }
}

async function sendTelegram(
  config: Record<string, string>,
  msg: NotificationMessage
): Promise<{ ok: boolean; error?: string }> {
  const { telegramBotToken, telegramChatId } = config
  if (!telegramBotToken || !telegramChatId) {
    return { ok: false, error: "Telegram bot token or chat ID not configured" }
  }

  const text = [
    `*${escapeTelegram(msg.title)}*`,
    ``,
    `${escapeTelegram(msg.body)}`,
    ``,
    `Stock: ${msg.stockCode} — ${msg.stockName}`,
    `Price: Rp ${msg.price.toLocaleString("id-ID")} (${msg.changePercent >= 0 ? "+" : ""}${msg.changePercent.toFixed(2)}%)`,
    msg.details ? `\n${escapeTelegram(msg.details)}` : "",
    msg.url ? `\n[Open Dashboard](${msg.url})` : "",
  ].join("\n")

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${telegramBotToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: telegramChatId,
          text,
          parse_mode: "Markdown",
          disable_web_page_preview: true,
        }),
      }
    )
    if (!res.ok) {
      const errData = await res.json()
      return { ok: false, error: `Telegram error: ${errData.description || res.status}` }
    }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: String(err) }
  }
}

async function sendWhatsApp(
  config: Record<string, string>,
  msg: NotificationMessage
): Promise<{ ok: boolean; error?: string }> {
  const { whatsappPhone, whatsappApiKey, whatsappApiUrl } = config
  if (!whatsappPhone) return { ok: false, error: "WhatsApp phone not configured" }

  const text = [
    `*${msg.title}*`,
    ``,
    msg.body,
    ``,
    `📈 ${msg.stockCode} — ${msg.stockName}`,
    `💰 Rp ${msg.price.toLocaleString("id-ID")} (${msg.changePercent >= 0 ? "+" : ""}${msg.changePercent.toFixed(2)}%)`,
    msg.details ? `\n${msg.details}` : "",
    msg.url ? `\n🔗 ${msg.url}` : "",
  ].join("\n")

  const apiUrl = whatsappApiUrl || "https://api.twilio.com/2010-04-01"

  try {
    if (whatsappApiKey) {
      const res = await fetch(`${apiUrl}/Accounts/${whatsappApiKey}/Messages.json`, {
        method: "POST",
        headers: {
          "Authorization": `Basic ${btoa(`${whatsappApiKey}:${whatsappApiKey}`)}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          From: `whatsapp:+14155238886`,
          To: `whatsapp:${whatsappPhone}`,
          Body: text,
        }),
      })
      if (!res.ok) {
        const errText = await res.text()
        return { ok: false, error: `Twilio error: ${res.status} ${errText}` }
      }
      return { ok: true }
    }

    const res = await fetch(`${apiUrl}/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${whatsappApiKey || ""}`,
      },
      body: JSON.stringify({
        phone: whatsappPhone,
        message: text,
      }),
    })
    if (!res.ok) {
      const errText = await res.text()
      return { ok: false, error: `WhatsApp API error: ${res.status} ${errText}` }
    }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: String(err) }
  }
}

async function sendBrowserPush(
  config: Record<string, string>,
  msg: NotificationMessage
): Promise<{ ok: boolean; error?: string }> {
  const subscriptionJson = config.subscription
  if (!subscriptionJson) return { ok: false, error: "No push subscription configured" }

  let subscription: PushSubscriptionJSON
  try {
    subscription = JSON.parse(subscriptionJson)
  } catch {
    return { ok: false, error: "Invalid push subscription JSON" }
  }

  const vapidPublicKey = config.vapidPublicKey || ""
  const vapidPrivateKey = config.vapidPrivateKey || ""

  const payload = JSON.stringify({
    title: msg.title,
    body: msg.body,
    stockCode: msg.stockCode,
    type: msg.type,
    url: msg.url || "/",
  })

  try {
    const res = await sendWebPush(subscription, payload, {
      vapidPublicKey,
      vapidPrivateKey,
      subject: "mailto:notifications@idx-screener.app",
    })
    if (!res.ok) return { ok: false, error: `Push send error: ${res.statusText}` }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: String(err) }
  }
}

async function sendWebPush(
  subscription: PushSubscriptionJSON,
  payload: string,
  options: { vapidPublicKey: string; vapidPrivateKey: string; subject: string }
): Promise<Response> {
  const { endpoint, keys } = subscription
  if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
    return new Response("Invalid subscription", { status: 400 })
  }

  const crypto = await import("crypto")

  const salt = crypto.randomBytes(16)
  const serverKeyPair = crypto.createECDH("prime256v1")
  serverKeyPair.generateKeys()
  const serverPublicKey = serverKeyPair.getPublicKey()
  const serverPrivateKey = serverKeyPair.getPrivateKey()

  const clientPublicKey = Buffer.from(keys.p256dh, "base64url")
  const authSecret = Buffer.from(keys.auth, "base64url")

  const sharedSecret = serverKeyPair.computeSecret(clientPublicKey)

  const prk = hkdf(crypto, authSecret, sharedSecret, "Content-Encoding: auth\0", 32)
  const prkHmac = crypto.createHmac("sha256", prk)

  const nonce = hkdf(crypto, salt, prk, "Content-Encoding: nonce\0", 12)
  const contentKey = hkdf(crypto, salt, prk, "Content-Encoding: aes128gcm\0", 16)

  const cipher = crypto.createCipheriv("aes-128-gcm", contentKey, nonce)
  const plaintext = Buffer.from(payload, "utf-8")
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()])
  const tag = cipher.getAuthTag()

  const header = Buffer.concat([
    salt,
    Buffer.from([0, 0, 0, 0, serverPublicKey.length]),
    serverPublicKey,
    Buffer.from([0, 0, 0, 0, 0]),
  ])
  const body = Buffer.concat([encrypted, tag])

  const encryptedPayload = Buffer.concat([header, body])

  const headers: Record<string, string> = {
    "Content-Type": "application/octet-stream",
    "Content-Encoding": "aes128gcm",
    "Content-Length": encryptedPayload.length.toString(),
    "TTL": "86400",
  }

  if (options.vapidPublicKey && options.vapidPrivateKey) {
    const vapidJwt = createVapidJWT(
      crypto,
      options.subject,
      endpoint,
      options.vapidPublicKey,
      options.vapidPrivateKey
    )
    headers["Authorization"] = `WebPush ${vapidJwt}`
  }

  return fetch(endpoint, { method: "POST", headers, body: encryptedPayload })
}

function hkdf(
  crypto: typeof import("crypto"),
  salt: Buffer,
  ikm: Buffer,
  info: string,
  length: number
): Buffer {
  const prk = crypto.createHmac("sha256", salt).update(ikm).digest()
  const result = crypto.createHmac("sha256", prk).update(Buffer.concat([Buffer.from(info), Buffer.from([1])])).digest()
  return result.subarray(0, length)
}

function createVapidJWT(
  crypto: typeof import("crypto"),
  subject: string,
  endpoint: string,
  publicKey: string,
  privateKey: string
): string {
  const header = Buffer.from(JSON.stringify({ alg: "ES256", typ: "JWT" })).toString("base64url")
  const now = Math.floor(Date.now() / 1000)
  const payload = Buffer.from(
    JSON.stringify({ aud: new URL(endpoint).origin, exp: now + 86400, sub: subject })
  ).toString("base64url")

  const key = crypto.createPrivateKey({
    key: Buffer.from(privateKey, "base64url"),
    format: "der",
    type: "pkcs8",
  })

  const signature = crypto.createSign("sha256").update(`${header}.${payload}`).sign(key, "base64url")
  return `${header}.${payload}.${signature}`
}

function escapeTelegram(text: string): string {
  return text.replace(/([_*\[\]()~`>#+\-=|{}.!])/g, "\\$1")
}

export function buildPlainText(msg: NotificationMessage): string {
  return [
    msg.title,
    "",
    msg.body,
    "",
    `Stock: ${msg.stockCode} — ${msg.stockName}`,
    `Price: Rp ${msg.price.toLocaleString("id-ID")} (${msg.changePercent >= 0 ? "+" : ""}${msg.changePercent.toFixed(2)}%)`,
    msg.details ? `\n${msg.details}` : "",
    msg.url ? `\nOpen: ${msg.url}` : "",
  ].join("\n")
}

export function buildEmailHtml(msg: NotificationMessage): string {
  const changeClass = msg.changePercent >= 0 ? "color: #22c55e" : "color: #ef4444"
  const changeSign = msg.changePercent >= 0 ? "+" : ""
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0b10;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;padding:24px">
    <tr><td style="padding-bottom:16px">
      <h1 style="color:#e2e8f0;font-size:20px;margin:0">${msg.title}</h1>
    </td></tr>
    <tr><td style="padding:16px;background:#13151d;border-radius:8px;border:1px solid rgba(255,255,255,0.08)">
      <p style="color:#94a3b8;font-size:14px;margin:0 0 12px 0;line-height:1.5">${msg.body}</p>
      <table cellpadding="0" cellspacing="0" style="width:100%">
        <tr>
          <td style="font-size:13px;color:#64748b;padding:4px 0">Stock</td>
          <td style="font-size:13px;color:#e2e8f0;padding:4px 0;text-align:right">${msg.stockCode} — ${msg.stockName}</td>
        </tr>
        <tr>
          <td style="font-size:13px;color:#64748b;padding:4px 0">Price</td>
          <td style="font-size:13px;${changeClass};padding:4px 0;text-align:right">Rp ${msg.price.toLocaleString("id-ID")} (${changeSign}${msg.changePercent.toFixed(2)}%)</td>
        </tr>
        ${msg.details ? `<tr><td style="font-size:13px;color:#64748b;padding:4px 0">Details</td><td style="font-size:13px;color:#e2e8f0;padding:4px 0;text-align:right">${msg.details}</td></tr>` : ""}
      </table>
    </td></tr>
    ${msg.url ? `<tr><td style="padding-top:16px;text-align:center">
      <a href="${msg.url}" style="display:inline-block;padding:10px 24px;background:#6366f1;color:#fff;text-decoration:none;border-radius:6px;font-size:13px">Open Dashboard</a>
    </td></tr>` : ""}
    <tr><td style="padding-top:24px;font-size:11px;color:#475569;text-align:center">
      IDX Stock Screener — Notification
    </td></tr>
  </table>
</body>
</html>`.trim()
}

export function formatAlertMessage(
  eventType: string,
  stockCode: string,
  stockName: string,
  price: number,
  changePercent: number,
  details?: string
): NotificationMessage {
  const titles: Record<string, string> = {
    breakout: "🚀 Breakout Detected",
    volume_spike: "📊 Volume Spike",
    foreign_accumulation: "🌍 Foreign Accumulation",
    rsi_oversold: "📉 RSI Oversold",
    rsi_overbought: "📈 RSI Overbought",
    macd_crossover: "🔀 MACD Crossover",
    golden_cross: "✨ Golden Cross",
    death_cross: "⚠️ Death Cross",
    price_target: "🎯 Price Target Hit",
  }

  const bodies: Record<string, string> = {
    breakout: `${stockName} has broken out with strong momentum. Price is above key moving averages with increasing volume.`,
    volume_spike: `${stockName} is experiencing unusually high trading volume ${details ? "(" + details + ")" : ""}. This may signal institutional activity.`,
    foreign_accumulation: `Foreign investors are accumulating ${stockName}. Net buy volume indicates institutional confidence.`,
    rsi_oversold: `${stockName} RSI indicates oversold conditions. This could present a buying opportunity if other signals confirm.`,
    rsi_overbought: `${stockName} RSI indicates overbought conditions. Consider taking profits or tightening stops.`,
    macd_crossover: `${stockName} MACD has crossed signal line ${details || ""}. Trend momentum is shifting.`,
    golden_cross: `${stockName} 50-day MA crossed above 200-day MA — a bullish long-term signal.`,
    death_cross: `${stockName} 50-day MA crossed below 200-day MA — a bearish long-term signal.`,
    price_target: `${stockName} has reached a price target ${details ? "(" + details + ")" : ""}. Review your position.`,
  }

  return {
    title: titles[eventType] || `Alert: ${stockCode}`,
    body: bodies[eventType] || `${stockName} triggered a ${eventType} alert.`,
    stockCode,
    stockName,
    price,
    changePercent,
    type: eventType,
    details,
    url: process.env.NEXT_PUBLIC_APP_URL || undefined,
  }
}
