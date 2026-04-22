import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import TimeMachine from './pages/TimeMachine'
import CalendarPage from './pages/Calendar'
import Quote from './pages/Quote'

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <Header />
      <main className="px-4 py-10">
        <Routes>
          <Route path="/" element={<TimeMachine />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/quote" element={<Quote />} />
          <Route path="*" element={<TimeMachine />} />
        </Routes>
      </main>
      <footer className="mt-16 py-8 text-center text-sm text-slate-400 border-t border-slate-200">
        시세·일정 데이터: Finnhub · Alpha Vantage · 투자 손실 책임지지 않음
      </footer>
    </div>
  )
}

export default App
