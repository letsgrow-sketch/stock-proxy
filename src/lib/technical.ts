export function calcSMA(data: number[], period: number): number[] {
  const result: number[] = []
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) { result.push(NaN); continue }
    const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0)
    result.push(sum / period)
  }
  return result
}

export function calcEMA(data: number[], period: number): number[] {
  const result: number[] = []
  const k = 2 / (period + 1)
  let ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) { result.push(NaN); continue }
    if (i === period - 1) { result.push(ema); continue }
    ema = data[i] * k + ema * (1 - k)
    result.push(ema)
  }
  return result
}

export function calcRSI(data: number[], period = 14): number[] {
  const result: number[] = []
  let gains = 0, losses = 0
  for (let i = 1; i < data.length; i++) {
    const diff = data[i] - data[i - 1]
    if (i <= period) {
      if (diff > 0) gains += diff; else losses -= diff
      if (i === period) {
        const avgGain = gains / period, avgLoss = losses / period
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss
        result.push(100 - 100 / (1 + rs))
      } else result.push(NaN)
    } else {
      const prevAvgGain = gains, prevAvgLoss = losses
      const currGain = diff > 0 ? diff : 0, currLoss = diff < 0 ? -diff : 0
      gains = (prevAvgGain * (period - 1) + currGain) / period
      losses = (prevAvgLoss * (period - 1) + currLoss) / period
      const rs = losses === 0 ? 100 : gains / losses
      result.push(100 - 100 / (1 + rs))
    }
  }
  return result
}

export function calcMACD(data: number[]): { macd: number[]; signal: number[]; histogram: number[] } {
  const ema12 = calcEMA(data, 12)
  const ema26 = calcEMA(data, 26)
  const macdLine: number[] = []
  for (let i = 0; i < data.length; i++) {
    if (isNaN(ema12[i]) || isNaN(ema26[i])) macdLine.push(NaN)
    else macdLine.push(ema12[i] - ema26[i])
  }
  const validMacd = macdLine.filter(v => !isNaN(v))
  const signal = calcEMA(validMacd, 9)
  const histogram: number[] = []
  let signalIdx = 0
  for (let i = 0; i < data.length; i++) {
    if (isNaN(macdLine[i])) histogram.push(NaN)
    else {
      histogram.push(macdLine[i] - signal[signalIdx])
      signalIdx++
    }
  }
  return { macd: macdLine, signal: [...Array(data.length - signal.length).fill(NaN), ...signal], histogram }
}

export function calcBB(data: number[], period = 20, multiplier = 2): { upper: number[]; middle: number[]; lower: number[] } {
  const middle = calcSMA(data, period)
  const upper: number[] = [], lower: number[] = []
  for (let i = 0; i < data.length; i++) {
    if (isNaN(middle[i])) { upper.push(NaN); lower.push(NaN); continue }
    const slice = data.slice(i - period + 1, i + 1)
    const mean = middle[i]
    const squaredDiffs = slice.map(v => (v - mean) ** 2)
    const std = Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / period)
    upper.push(mean + multiplier * std)
    lower.push(mean - multiplier * std)
  }
  return { upper, middle, lower }
}

export function calcStochastic(data: number[], period = 14): { k: number[]; d: number[] } {
  const k: number[] = []
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) { k.push(NaN); continue }
    const slice = data.slice(i - period + 1, i + 1)
    const high = Math.max(...slice), low = Math.min(...slice)
    k.push(high === low ? 50 : ((data[i] - low) / (high - low)) * 100)
  }
  const validK = k.filter(v => !isNaN(v))
  const d = calcSMA(validK, 3)
  const paddedD: number[] = []
  let di = 0
  for (let i = 0; i < data.length; i++) {
    if (isNaN(k[i])) paddedD.push(NaN)
    else { paddedD.push(d[di]); di++ }
  }
  return { k, d: paddedD }
}

export function getRecommendation(rsi: number, macdHistogram: number): string {
  let score = 0
  if (rsi < 30) score += 2
  else if (rsi < 45) score += 1
  else if (rsi > 70) score -= 2
  else if (rsi > 55) score -= 1
  if (macdHistogram > 0) score += 1
  else score -= 1
  if (score >= 2) return "Buy"
  if (score <= -2) return "Sell"
  return "Hold"
}
