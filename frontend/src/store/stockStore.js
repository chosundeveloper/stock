import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useStockStore = create(
  persist(
    (set) => ({
      stocks: [],

      addStock: (symbol) => set((state) => (
        state.stocks.find(s => s.symbol === symbol)
          ? state
          : {
              stocks: [
                ...state.stocks,
                {
                  symbol,
                  price: null,
                  change: null,
                  changePercent: null,
                  timestamp: null,
                },
              ],
            }
      )),

      removeStock: (symbol) => set((state) => ({
        stocks: state.stocks.filter(s => s.symbol !== symbol),
      })),

      updateStock: (symbol, data) => set((state) => ({
        stocks: state.stocks.map(s =>
          s.symbol === symbol ? { ...s, ...data } : s
        ),
      })),

      clearStocks: () => set({ stocks: [] }),
    }),
    {
      name: 'stock-watchlist',
      partialize: (state) => ({
        stocks: state.stocks.map(({ symbol }) => ({ symbol })),
      }),
    }
  )
)
