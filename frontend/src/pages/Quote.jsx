import { useState } from 'react'
import SearchBar from '../components/SearchBar'
import StockCard from '../components/StockCard'
import ChartView from '../components/ChartView'
import { useStockStore } from '../store/stockStore'

export default function Quote() {
  const [selectedSymbol, setSelectedSymbol] = useState(null)
  const { stocks, addStock, removeStock } = useStockStore()

  const handleSearch = (symbol) => {
    addStock(symbol)
    setSelectedSymbol(symbol)
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-3 text-slate-900">
          🔍 종목 시세
        </h1>
        <p className="text-lg text-slate-600">
          검색해서 관심종목에 담고 실시간 가격·차트 확인
        </p>
      </div>

      <SearchBar onSearch={handleSearch} />

      {selectedSymbol && (
        <div className="mt-8">
          <ChartView symbol={selectedSymbol} />
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4 text-slate-800">관심종목</h2>
        {stocks.length === 0 ? (
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-500">
            위에서 종목을 검색해 추가해보세요
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stocks.map(stock => (
              <StockCard
                key={stock.symbol}
                stock={stock}
                isSelected={stock.symbol === selectedSymbol}
                onSelect={() => setSelectedSymbol(stock.symbol)}
                onRemove={() => removeStock(stock.symbol)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
