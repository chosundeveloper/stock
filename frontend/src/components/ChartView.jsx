import { useState, useEffect } from 'react'
import axios from 'axios'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

export default function ChartView({ symbol }) {
  const [interval, setInterval] = useState('5min')
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        setLoading(true)
        const response = await axios.get(`/api/stocks/intraday`, {
          params: {
            symbol,
            interval
          }
        })
        setData(response.data.data || [])
        setError(null)
      } catch (err) {
        setError(err.message)
        setData([])
      } finally {
        setLoading(false)
      }
    }

    fetchChartData()
  }, [symbol, interval])

  const intervals = ['1min', '5min', '15min', '30min', '60min']

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">{symbol} Chart</h2>
        <div className="flex gap-2">
          {intervals.map(int => (
            <button
              key={int}
              onClick={() => setInterval(int)}
              className={`px-3 py-1 rounded ${
                interval === int
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {int}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="h-96 flex items-center justify-center text-gray-400">
          Loading chart data...
        </div>
      ) : error ? (
        <div className="h-96 flex items-center justify-center text-red-600">
          Error: {error}
        </div>
      ) : data.length > 0 ? (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 12 }}
              interval={Math.max(0, Math.floor(data.length / 10))}
            />
            <YAxis />
            <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
            <Legend />
            <Line
              type="monotone"
              dataKey="close"
              stroke="#3b82f6"
              dot={false}
              name="Close Price"
            />
            <Line
              type="monotone"
              dataKey="open"
              stroke="#10b981"
              dot={false}
              name="Open Price"
              opacity={0.5}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-96 flex items-center justify-center text-gray-400">
          No chart data available
        </div>
      )}
    </div>
  )
}
