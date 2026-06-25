import { prisma } from "@/lib/prisma"

export interface AIAnalysisData {
  stockCode: string
  stockName: string
  sector: string
  action: string
  confidence: number
  sentiment: string
  recommendation: string
  summary: string
  technicalSignals?: string
  fundamentalSignals?: string
  flowSignals?: string
  keyLevels?: string
}

export async function saveAnalysis(userId: string, data: AIAnalysisData) {
  return prisma.aIAnalysis.create({
    data: { userId, ...data, technicalSignals: data.technicalSignals || "[]", fundamentalSignals: data.fundamentalSignals || "[]", flowSignals: data.flowSignals || "[]", keyLevels: data.keyLevels || "{}" },
  })
}

export async function getAnalysisHistory(userId: string, limit = 20) {
  return prisma.aIAnalysis.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  })
}

export async function clearAnalysisHistory(userId: string) {
  return prisma.aIAnalysis.deleteMany({ where: { userId } })
}

export async function saveScreenerPreset(userId: string, name: string, filters: string) {
  return prisma.screenerPreset.create({
    data: { userId, name, filters },
  })
}

export async function getScreenerPresets(userId: string) {
  return prisma.screenerPreset.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  })
}

export async function deleteScreenerPreset(userId: string, presetId: string) {
  return prisma.screenerPreset.deleteMany({
    where: { id: presetId, userId },
  })
}

export async function getAlertRules(userId: string) {
  return prisma.alertRule.findMany({ where: { userId }, orderBy: { createdAt: "desc" } })
}

export async function saveAlertRule(userId: string, rule: { type: string; label: string; stockCode?: string; enabled?: boolean; id?: string }) {
  if (rule.id) {
    return prisma.alertRule.update({
      where: { id: rule.id },
      data: { type: rule.type, label: rule.label, stockCode: rule.stockCode || "", enabled: rule.enabled ?? false },
    })
  }
  return prisma.alertRule.create({
    data: { userId, type: rule.type, label: rule.label, stockCode: rule.stockCode || "", enabled: rule.enabled ?? false },
  })
}

export async function deleteAlertRule(userId: string, ruleId: string) {
  return prisma.alertRule.deleteMany({ where: { id: ruleId, userId } })
}

export async function getAlertEvents(userId: string, limit = 50) {
  return prisma.alertEvent.findMany({
    where: { userId },
    orderBy: { timestamp: "desc" },
    take: limit,
  })
}

export async function saveAlertEvent(data: { userId: string; ruleId: string; type: string; stockCode: string; stockName: string; sector: string; price: number; changePercent: number; message: string; details: string }) {
  return prisma.alertEvent.create({ data })
}

export async function markAlertEventRead(userId: string, eventId: string) {
  return prisma.alertEvent.updateMany({ where: { id: eventId, userId }, data: { read: true } })
}

export async function markAllAlertEventsRead(userId: string) {
  return prisma.alertEvent.updateMany({ where: { userId, read: false }, data: { read: true } })
}

export async function deleteAlertEvent(userId: string, eventId: string) {
  return prisma.alertEvent.deleteMany({ where: { id: eventId, userId } })
}

export interface NotificationChannelData {
  type: string
  enabled: boolean
  config: Record<string, string>
}

export async function getNotificationChannels(userId: string) {
  return prisma.notificationChannel.findMany({ where: { userId }, orderBy: { createdAt: "desc" } })
}

export async function setNotificationChannel(userId: string, data: NotificationChannelData) {
  return prisma.notificationChannel.upsert({
    where: { userId_type: { userId, type: data.type } },
    update: { enabled: data.enabled, config: JSON.stringify(data.config) },
    create: { userId, type: data.type, enabled: data.enabled, config: JSON.stringify(data.config) },
  })
}

export async function deleteNotificationChannel(userId: string, type: string) {
  return prisma.notificationChannel.deleteMany({ where: { userId, type } })
}

export async function getNotificationRuleMappings(userId: string) {
  return prisma.notificationRuleMapping.findMany({ where: { userId } })
}

export async function setNotificationRuleMapping(userId: string, eventType: string, channels: string[]) {
  return prisma.notificationRuleMapping.upsert({
    where: { userId_eventType: { userId, eventType } },
    update: { channels: JSON.stringify(channels) },
    create: { userId, eventType, channels: JSON.stringify(channels) },
  })
}

export async function deleteNotificationRuleMapping(userId: string, eventType: string) {
  return prisma.notificationRuleMapping.deleteMany({ where: { userId, eventType } })
}
