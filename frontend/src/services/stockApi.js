import axios from 'axios'

const FINNHUB_BASE = 'https://finnhub.io/api/v1'
const ALPHA_VANTAGE_BASE = 'https://www.alphavantage.co/query'

const FINNHUB_KEY = import.meta.env.VITE_FINNHUB_API_KEY || ''
const AV_KEY = import.meta.env.VITE_AV_API_KEY || ''

const sessionCache = new Map()
const DEFAULT_TTL_MS = 30_000

function cacheGet(key) {
  const entry = sessionCache.get(key)
  if (!entry) return null
  if (Date.now() - entry.at > entry.ttl) {
    sessionCache.delete(key)
    return null
  }
  return entry.value
}

function cacheSet(key, value, ttl = DEFAULT_TTL_MS) {
  sessionCache.set(key, { value, at: Date.now(), ttl })
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
  if (data?.Information) throw new Error(String(data.Information))
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

export async function getDaily(symbol, outputsize = 'full') {
  const cacheKey = `daily:${symbol}:${outputsize}`
  const cached = cacheGet(cacheKey)
  if (cached) return cached

  if (!AV_KEY) throw new Error('VITE_AV_API_KEY not set')

  const { data } = await axios.get(ALPHA_VANTAGE_BASE, {
    params: {
      function: 'TIME_SERIES_DAILY',
      symbol,
      outputsize,
      apikey: AV_KEY,
    },
    timeout: 15000,
  })

  if (data?.Note) throw new Error('Alpha Vantage 요청 제한 (무료 5/min, 500/day). 잠시 후 다시 시도해줘')
  if (data?.Information) throw new Error(String(data.Information))
  if (data?.['Error Message']) throw new Error(data['Error Message'])

  const series = data?.['Time Series (Daily)']
  if (!series) throw new Error(`${symbol} 일봉 데이터 없음`)

  const points = Object.entries(series)
    .map(([date, v]) => ({
      date,
      open: parseFloat(v['1. open']),
      high: parseFloat(v['2. high']),
      low: parseFloat(v['3. low']),
      close: parseFloat(v['4. close']),
      volume: parseInt(v['5. volume'], 10),
    }))
    .sort((a, b) => a.date.localeCompare(b.date))

  cacheSet(cacheKey, points, 60 * 60 * 1000) // 1h — daily data barely changes intraday
  return points
}

function toYmd(d) {
  return d.toISOString().slice(0, 10)
}

export async function getIpoCalendar(daysAhead = 30) {
  if (!FINNHUB_KEY) throw new Error('VITE_FINNHUB_API_KEY not set')

  const from = new Date()
  const to = new Date()
  to.setDate(to.getDate() + daysAhead)

  const cacheKey = `ipo:${toYmd(from)}:${toYmd(to)}`
  const cached = cacheGet(cacheKey)
  if (cached) return cached

  const { data } = await axios.get(`${FINNHUB_BASE}/calendar/ipo`, {
    params: { from: toYmd(from), to: toYmd(to), token: FINNHUB_KEY },
    timeout: 10000,
  })

  const list = data?.ipoCalendar || []
  cacheSet(cacheKey, list, 60 * 60 * 1000)
  return list
}

export async function getEarningsCalendar(daysAhead = 14) {
  if (!FINNHUB_KEY) throw new Error('VITE_FINNHUB_API_KEY not set')

  const from = new Date()
  const to = new Date()
  to.setDate(to.getDate() + daysAhead)

  const cacheKey = `earnings:${toYmd(from)}:${toYmd(to)}`
  const cached = cacheGet(cacheKey)
  if (cached) return cached

  const { data } = await axios.get(`${FINNHUB_BASE}/calendar/earnings`, {
    params: { from: toYmd(from), to: toYmd(to), token: FINNHUB_KEY },
    timeout: 10000,
  })

  const list = data?.earningsCalendar || []
  cacheSet(cacheKey, list, 30 * 60 * 1000)
  return list
}

export async function getCompanyNews(symbol, daysBack = 14) {
  if (!FINNHUB_KEY) throw new Error('VITE_FINNHUB_API_KEY not set')

  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - daysBack)

  const cacheKey = `news:${symbol}:${toYmd(from)}:${toYmd(to)}`
  const cached = cacheGet(cacheKey)
  if (cached) return cached

  const { data } = await axios.get(`${FINNHUB_BASE}/company-news`, {
    params: { symbol, from: toYmd(from), to: toYmd(to), token: FINNHUB_KEY },
    timeout: 10000,
  })

  const list = (data || []).slice(0, 10)
  cacheSet(cacheKey, list, 30 * 60 * 1000)
  return list
}

export function hasApiKeys() {
  return Boolean(FINNHUB_KEY && AV_KEY)
}

export function hasFinnhubKey() {
  return Boolean(FINNHUB_KEY)
}

export function hasAvKey() {
  return Boolean(AV_KEY)
}
