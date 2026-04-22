import { useEffect, useState } from 'react'
import { getIpoCalendar, getEarningsCalendar } from '../services/stockApi'

function groupByDate(items, dateKey) {
  const map = new Map()
  for (const item of items) {
    const d = item[dateKey]
    if (!d) continue
    if (!map.has(d)) map.set(d, [])
    map.get(d).push(item)
  }
  return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]))
}

function formatDate(iso) {
  if (!iso) return '-'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const days = ['일', '월', '화', '수', '목', '금', '토']
  return `${iso} (${days[d.getDay()]})`
}

export default function CalendarPage() {
  const [tab, setTab] = useState('ipo')
  const [ipoData, setIpoData] = useState(null)
  const [earningsData, setEarningsData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        if (tab === 'ipo' && !ipoData) {
          const data = await getIpoCalendar(30)
          if (!cancelled) setIpoData(data)
        } else if (tab === 'earnings' && !earningsData) {
          const data = await getEarningsCalendar(14)
          if (!cancelled) setEarningsData(data)
        }
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [tab, ipoData, earningsData])

  const ipoGroups = ipoData ? groupByDate(ipoData, 'date') : []
  const earningsGroups = earningsData ? groupByDate(earningsData, 'date') : []

  return (
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-3 text-slate-900">
          📅 마켓 캘린더
        </h1>
        <p className="text-lg text-slate-600">
          IPO·공모주 / 실적 발표 일정 (미국 시장)
        </p>
      </div>

      <div className="flex gap-2 mb-6 border-b border-slate-200">
        {[
          { key: 'ipo', label: '🚀 IPO / 공모주', sub: '30일 이내' },
          { key: 'earnings', label: '📊 실적 발표', sub: '2주 이내' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-5 py-3 font-semibold border-b-2 transition ${
              tab === t.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.label}
            <span className="ml-2 text-xs text-slate-400">{t.sub}</span>
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
          {error}
        </div>
      )}

      {loading && <div className="text-center text-slate-500 py-10">불러오는 중…</div>}

      {!loading && tab === 'ipo' && ipoData && (
        <div className="space-y-4">
          {ipoGroups.length === 0 && <div className="text-center text-slate-500 py-10">예정된 IPO 없음</div>}
          {ipoGroups.map(([date, items]) => (
            <div key={date} className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 px-5 py-2 font-semibold text-slate-700">
                {formatDate(date)}
              </div>
              <div className="divide-y divide-slate-100">
                {items.map((it, i) => (
                  <div key={`${it.symbol}-${i}`} className="px-5 py-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                    <span className="font-mono font-bold text-slate-900">{it.symbol || '-'}</span>
                    <span className="flex-1 text-slate-800 min-w-[200px]">{it.name || '-'}</span>
                    <span className="text-sm text-slate-500">{it.exchange || ''}</span>
                    {it.price && <span className="text-sm text-slate-600">가격: {it.price}</span>}
                    {it.numberOfShares && (
                      <span className="text-sm text-slate-600">
                        {Number(it.numberOfShares).toLocaleString()}주
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && tab === 'earnings' && earningsData && (
        <div className="space-y-4">
          {earningsGroups.length === 0 && <div className="text-center text-slate-500 py-10">예정된 실적 발표 없음</div>}
          {earningsGroups.map(([date, items]) => (
            <div key={date} className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 px-5 py-2 font-semibold text-slate-700">
                {formatDate(date)}
                <span className="ml-2 text-xs text-slate-400">{items.length}개 기업</span>
              </div>
              <div className="divide-y divide-slate-100">
                {items.slice(0, 30).map((it, i) => (
                  <div key={`${it.symbol}-${i}`} className="px-5 py-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                    <span className="font-mono font-bold text-slate-900 w-20">{it.symbol}</span>
                    <span className="text-sm text-slate-500 w-16">
                      {it.hour === 'bmo' ? '장전' : it.hour === 'amc' ? '장후' : '-'}
                    </span>
                    {it.epsEstimate != null && (
                      <span className="text-sm text-slate-600">
                        EPS 예상: <span className="font-semibold">${Number(it.epsEstimate).toFixed(2)}</span>
                      </span>
                    )}
                    {it.revenueEstimate != null && (
                      <span className="text-sm text-slate-600">
                        매출 예상: <span className="font-semibold">${(Number(it.revenueEstimate) / 1e9).toFixed(2)}B</span>
                      </span>
                    )}
                  </div>
                ))}
                {items.length > 30 && (
                  <div className="px-5 py-2 text-sm text-slate-400">+{items.length - 30}개 더…</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
