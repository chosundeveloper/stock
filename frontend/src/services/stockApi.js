import axios from 'axios'

const FINNHUB_BASE = 'https://finnhub.io/api/v1'
const ALPHA_VANTAGE_BASE = 'https://www.alphavantage.co/query'

const FINNHUB_KEY = import.meta.env.VITE_FINNHUB_API_KEY || ''
const AV_KEY = import.meta.env.VITE_AV_API_KEY || ''

const sessionCache = new Map()
const CACHE_TTL_MS = 30_000

function cacheGet(key) {
  const entry = sessionCache.get(key)
  if (!entry) return null
  if (Date.now() - entry.at > CACHE_TTL_MS) {
    sessionCache.delete(key)
    return null
  }
  return entry.value
}

function cacheSet(key, value) {
  sessionCache.set(key, { value, at: Date.now() })
}

export async function getQuote(symbol) {
  const cacheKey = `quote:${symbol}`
  const cached = cacheGet(cacheKey)
  if (cached) return cached

  if (!FINNHUB_KEY) throw new Error('VITE_FINNHUB_API_KEY not set')

  const { data } = await axios.get(`${FINNHUB_BASE}/quote`, {
    params: { symbol, token: FINNHUB_KEY },
    timeout: 5000,
  })

  if (!data || data.c === undefined || data.c === 0) {
    throw new Error(`No data for ${symbol}`)
  }

  const result = {
    symbol,
    price: data.c,
    high: data.h,
    low: data.l,
    open: data.o,
    previousClose: data.pc,
    change: data.d,
    changePercent: data.dp,
    timestamp: new Date().toISOString(),
    source: 'finnhub',
  }
  cacheSet(cacheKey, result)
  return result
}

export async function searchSymbol(q) {
  if (!FINNHUB_KEY) return []
  const { data } = await axios.get(`${FINNHUB_BASE}/search`, {
    params: { q, token: FINNHUB_KEY },
    timeout: 5000,
  })
  return (data?.result || []).slice(0, 20).map(item => ({
    symbol: item.symbol,
    name: item.description,
    type: item.type,
    displaySymbol: item.displaySymbol,
  }))
}

const AV_INTERVAL_MAP = {
  '1min': '1min',
  '5min': '5min',
  '15min': '15min',
  '30min': '30min',
  '60min': '60min',
}

export async function getIntraday(symbol, interval = '5min') {
  const cacheKey = `intraday:${symbol}:${interval}`
  const cached = cacheGet(cacheKey)
  if (cached) return cached

  if (!AV_KEY) throw new Error('VITE_AV_API_KEY not set')

  const avInterval = AV_INTERVAL_MAP[interval] || '5min'
  const { data } = await axios.get(ALPHA_VANTAGE_BASE, {
    params: {
      function: 'TIME_SERIES_INTRADAY',
      symbol,
      interval: avInterval,
      apikey: AV_KEY,
    },
    timeout: 10000,
  })

  if (data?.Note) throw new Error('API rate limit (Alpha Vantage free tier: 5/min, 500/day)')
  if (data?.['Error Message']) throw new Error(data['Error Message'])

  const seriesKey = `Time Series (${avInterval})`
  const series = data?.[seriesKey]
  if (!series) throw new Error(`No intraday data for ${symbol}`)

  const points = Object.entries(series)
    .slice(0, 100)
    .map(([time, v]) => ({
      time,
      open: parseFloat(v['1. open']),
      high: parseFloat(v['2. high']),
      low: parseFloat(v['3. low']),
      close: parseFloat(v['4. close']),
      volume: parseInt(v['5. volume'], 10),
    }))
    .reverse()

  cacheSet(cacheKey, points)
  return points
}

export function hasApiKeys() {
  return Boolean(FINNHUB_KEY && AV_KEY)
}
