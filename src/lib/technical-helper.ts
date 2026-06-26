import { TechnicalData } from "@/types"
import { calcRSI, calcMACD, calcSMA, calcEMA, calcBB, calcStochastic, getRecommendation } from "./technical"

export interface CompleteIndicators extends TechnicalData {}

export function computeIndicators(close: number[]): CompleteIndicators | null {
  const len = close.length
  if (len < 20) return null

  const i = len - 1

  const rsiArr = calcRSI(close, 14)
  const macdResult = calcMACD(close)
  const ma50Arr = calcSMA(close, 50)
  const ma200Arr = calcSMA(close, 200)
  const ema20Arr = calcEMA(close, 20)
  const ema50Arr = calcEMA(close, 50)
  const ema200Arr = calcEMA(close, 200)
  const bb = calcBB(close, 20)
  const stoch = calcStochastic(close, 14)

  return {
    rsi: Math.round(rsiArr[i] * 10) / 10 || 50,
    macd: {
      value: Math.round(macdResult.macd[i] * 10) / 10 || 0,
      signal: Math.round(macdResult.signal[i] * 10) / 10 || 0,
      histogram: Math.round(macdResult.histogram[i] * 10) / 10 || 0,
    },
    ema20: Math.round(ema20Arr[i]) || close[i],
    ema50: Math.round(ema50Arr[i]) || close[i],
    ema200: Math.round(ema200Arr[i]) || close[i],
    ma50: Math.round(ma50Arr[i]) || close[i],
    ma200: Math.round(ma200Arr[i]) || close[i],
    bb: {
      upper: Math.round(bb.upper[i]) || close[i] * 1.05,
      middle: Math.round(bb.middle[i]) || close[i],
      lower: Math.round(bb.lower[i]) || close[i] * 0.95,
    },
    stochastic: {
      k: Math.round(stoch.k[i] * 10) / 10 || 50,
      d: Math.round(stoch.d[i] * 10) / 10 || 50,
    },
    recommendation: getRecommendation(rsiArr[i] || 50, macdResult.histogram[i] || 0),
  }
}
