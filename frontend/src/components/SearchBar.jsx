import { useState } from 'react'
import axios from 'axios'

export default function SearchBar({ onSearch }) {
  const [input, setInput] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange = async (e) => {
    const value = e.target.value
    setInput(value)

    if (value.length < 2) {
      setSuggestions([])
      return
    }

    setIsLoading(true)
    try {
      const response = await axios.get(`/api/stocks/search?q=${value}`)
      setSuggestions(response.data.results || [])
    } catch (err) {
      console.error('Search error:', err)
      setSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelect = (symbol) => {
    onSearch(symbol)
    setInput('')
    setSuggestions([])
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (input.trim()) {
      onSearch(input.toUpperCase())
      setInput('')
      setSuggestions([])
    }
  }

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Search by stock symbol or company name (e.g., AAPL, Apple)"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg mt-1 max-h-60 overflow-y-auto z-10 shadow-lg">
              {suggestions.map((item) => (
                <button
                  key={item.symbol}
                  type="button"
                  onClick={() => handleSelect(item.symbol)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 border-b border-gray-200 last:border-b-0"
                >
                  <div className="font-semibold">{item.symbol}</div>
                  <div className="text-sm text-gray-600">{item.name}</div>
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          type="submit"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
        >
          Search
        </button>
      </form>
    </div>
  )
}
