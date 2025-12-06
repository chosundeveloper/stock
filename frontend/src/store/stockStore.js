import { create } from 'zustand'

export const useStockStore = create((set) => ({
  stocks: [],

  addStock: (symbol) => set((state) => ({
    stocks: [
      ...state.stocks,
      {
        symbol,
        price: null,
        change: null,
        changePercent: null,
        timestamp: null
      }
    ]
  })),

  removeStock: (symbol) => set((state) => ({
    stocks: state.stocks.filter(s => s.symbol !== symbol)
  })),

  updateStock: (symbol, data) => set((state) => ({
    stocks: state.stocks.map(s =>
      s.symbol === symbol ? { ...s, ...data } : s
    )
  })),

  clearStocks: () => set({ stocks: [] })
}))
