import { useState } from 'react'
import Header from './components/Header'
import SearchBar from './components/SearchBar'
import StockCard from './components/StockCard'
import ChartView from './components/ChartView'
import { useStockStore } from './store/stockStore'

function App() {
  const [selectedSymbol, setSelectedSymbol] = useState(null)
  const { stocks, addStock, removeStock } = useStockStore()

  const handleSearch = (symbol) => {
    if (!stocks.find(s => s.symbol === symbol)) {
      addStock(symbol)
    }
    setSelectedSymbol(symbol)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <SearchBar onSearch={handleSearch} />

        {selectedSymbol && (
          <div className="mt-8">
            <ChartView symbol={selectedSymbol} />
          </div>
        )}

        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Watched Stocks</h2>
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
        </div>
      </div>
    </div>
  )
}

export default App
