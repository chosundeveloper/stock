import { useMemo, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { getDaily } from '../services/stockApi'

const PRESET_TICKERS = ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NFLX', 'AMD', 'COIN']
const PRESET_YEARS = [1, 3, 5, 10]

function formatMoney(n) {
  if (!Number.isFinite(n)) return '-'
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })
}

function formatPct(n) {
  if (!Number.isFinite(n)) return '-'
  const sign = n > 0 ? '+' : ''
  return `${sign}${n.toFixed(2)}%`
}

function yearsAgo(n) {
  const d = new Date()
  d.setFullYear(d.getFullYear() - n)
  return d.toISOString().slice(0, 10)
}

export default function TimeMachine() {
  const [ticker, setTicker] = useState('TSLA')
  const [amount, setAmount] = useState(1000)
  const [startDate, setStartDate] = useState(yearsAgo(5))
  const [series, setSeries] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [submittedKey, setSubmittedKey] = useState(null)

  const run = async () => {
    const t = ticker.trim().toUpperCase()
    if (!t) return
    setLoading(true)
    setError(null)
    setSeries(null)
    try {
      const daily = await getDaily(t, 'full')
      setSeries(daily)
      setSubmittedKey({ ticker: t, amount: Number(amount), startDate })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const result = useMemo(() => {
    if (!series || !submittedKey) return null
    const { amount: amt, startDate: start } = submittedKey
    const from = series.find(p => p.date >= start) || series[0]
    const to = series[series.length - 1]
    if (!from || !to) return null
    const shares = amt / from.close
    const finalValue = shares * to.close
    const totalReturnPct = ((finalValue - amt) / amt) * 100
    const years = Math.max(
      (new Date(to.date) - new Date(from.date)) / (365.25 * 24 * 3600 * 1000),
      1 / 365
    )
    const cagr = (Math.pow(finalValue / amt, 1 / years) - 1) * 100

    const chart = series
      .filter(p => p.date >= from.date)
      .map(p => ({ date: p.date, value: shares * p.close }))

    return { from, to, shares, finalValue, totalReturnPct, cagr, years, chart }
  }, [series, submittedKey])

  const shareText = result && submittedKey
    ? `${submittedKey.ticker}에 ${formatMoney(submittedKey.amount)}을 ${submittedKey.startDate}에 투자했다면 오늘 ${formatMoney(result.finalValue)} (${formatPct(result.totalReturnPct)}) 📈`
    : ''

  return (
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-3 text-slate-900">
          🕰️ 타임머신
        </h1>
        <p className="text-lg text-slate-600">
          과거에 그 종목 샀으면 지금 얼마?
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">종목</label>
            <input
              type="text"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && run()}
              placeholder="TSLA"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg uppercase font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">투자 금액 ($)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && run()}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">시작 날짜</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={run}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-slate-400 transition"
            >
              {loading ? '불러오는 중…' : '계산하기'}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-slate-500">빠른 선택:</span>
          {PRESET_YEARS.map(y => (
            <button
              key={y}
              onClick={() => setStartDate(yearsAgo(y))}
              className="px-3 py-1 text-sm bg-slate-100 hover:bg-slate-200 rounded-full text-slate-700"
            >
              {y}년 전
            </button>
          ))}
          <span className="w-full" />
          <span className="text-sm text-slate-500">종목:</span>
          {PRESET_TICKERS.map(t => (
            <button
              key={t}
              onClick={() => setTicker(t)}
              className="px-3 py-1 text-sm bg-slate-100 hover:bg-slate-200 rounded-full text-slate-700 font-mono"
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
          {error}
        </div>
      )}

      {result && submittedKey && (
        <>
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow p-6 mb-6 border border-blue-100">
            <div className="text-sm text-slate-600 mb-2">
              <span className="font-mono font-bold">{submittedKey.ticker}</span>에
              {' '}<span className="font-bold">{formatMoney(submittedKey.amount)}</span>를
              {' '}<span className="font-bold">{result.from.date}</span>에 투자했다면…
            </div>
            <div className="flex flex-wrap gap-6 items-baseline">
              <div>
                <div className="text-sm text-slate-500">현재 가치</div>
                <div className="text-4xl md:text-5xl font-extrabold text-slate-900">
                  {formatMoney(result.finalValue)}
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-500">총 수익률</div>
                <div className={`text-3xl font-bold ${result.totalReturnPct >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {formatPct(result.totalReturnPct)}
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-500">연평균 (CAGR)</div>
                <div className={`text-3xl font-bold ${result.cagr >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {formatPct(result.cagr)}
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-500">보유 주식 수</div>
                <div className="text-2xl font-semibold text-slate-800">
                  {result.shares.toFixed(4)}주
                </div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(shareText)
                }}
                className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm hover:bg-slate-50"
              >
                📋 결과 복사
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow p-6 border border-slate-200">
            <h3 className="text-lg font-semibold mb-4 text-slate-800">포트폴리오 가치 추이</h3>
            <ResponsiveContainer width="100%" height={360}>
              <LineChart data={result.chart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  interval={Math.max(0, Math.floor(result.chart.length / 8))}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `$${Math.round(v).toLocaleString()}`}
                />
                <Tooltip
                  formatter={(v) => [formatMoney(v), '가치']}
                  labelStyle={{ color: '#334155' }}
                />
                <ReferenceLine y={submittedKey.amount} stroke="#94a3b8" strokeDasharray="4 4" label={{ value: '원금', position: 'right', fill: '#64748b', fontSize: 11 }} />
                <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  )
}
