import { useEffect, useState } from 'react'
import axios from 'axios'
import { useStockStore } from '../store/stockStore'

export default function StockCard({ stock, isSelected, onSelect, onRemove }) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const updateStock = useStockStore(state => state.updateStock)

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        setLoading(true)
        const response = await axios.get(`/api/stocks/price/${stock.symbol}`)
        setData(response.data)
        updateStock(stock.symbol, response.data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchPrice()
    const interval = setInterval(fetchPrice, 60000) // Refresh every minute

    return () => clearInterval(interval)
  }, [stock.symbol, updateStock])

  const isPositive = data?.change >= 0
  const changeColor = isPositive ? 'text-green-600' : 'text-red-600'
  const bgColor = isSelected ? 'bg-blue-50 border-blue-500' : 'bg-white border-gray-300'

  return (
    <div
      onClick={onSelect}
      className={`${bgColor} border-2 rounded-lg p-4 cursor-pointer hover:shadow-lg transition-shadow`}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-bold">{stock.symbol}</h3>
          <p className="text-sm text-gray-500">Real-time</p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="text-gray-400 hover:text-red-600 text-xl"
        >
          ✕
        </button>
      </div>

      {loading ? (
        <div className="text-gray-400">Loading...</div>
      ) : error ? (
        <div className="text-red-600 text-sm">{error}</div>
      ) : data ? (
        <div>
          <div className="mb-3">
            <div className="text-2xl font-bold">${data.price?.toFixed(2)}</div>
            <div className={`text-sm font-semibold ${changeColor}`}>
              {isPositive ? '▲' : '▼'} ${Math.abs(data.change || 0).toFixed(2)} ({data.changePercent?.toFixed(2)}%)
            </div>
          </div>
          <div className="text-xs text-gray-500 space-y-1">
            <div>High: ${data.high?.toFixed(2)}</div>
            <div>Low: ${data.low?.toFixed(2)}</div>
            <div>Open: ${data.open?.toFixed(2)}</div>
          </div>
        </div>
      ) : (
        <div className="text-gray-400">No data available</div>
      )}
    </div>
  )
}
