import axios from 'axios';
import { cacheStock, getStockCache } from './redisService.js';

const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

// Alpha Vantage endpoints
const ALPHA_VANTAGE_BASE = 'https://www.alphavantage.co/query';

// Finnhub endpoints
const FINNHUB_BASE = 'https://finnhub.io/api/v1';

export async function getStockPrice(symbol) {
  // Try cache first
  const cached = await getStockCache(symbol);
  if (cached) {
    return cached;
  }

  try {
    // Try Finnhub first (faster response)
    const response = await axios.get(`${FINNHUB_BASE}/quote`, {
      params: {
        symbol,
        token: FINNHUB_API_KEY
      },
      timeout: 5000
    });

    if (response.data && response.data.c) {
      const data = {
        symbol,
        price: response.data.c,
        high: response.data.h,
        low: response.data.l,
        open: response.data.o,
        previousClose: response.data.pc,
        change: response.data.d,
        changePercent: response.data.dp,
        timestamp: new Date(),
        source: 'finnhub'
      };

      // Cache for 60 seconds
      await cacheStock(symbol, data, 60);
      return data;
    }
  } catch (err) {
    console.error(`Finnhub error for ${symbol}:`, err.message);
  }

  // Fallback to Alpha Vantage
  try {
    const response = await axios.get(ALPHA_VANTAGE_BASE, {
      params: {
        function: 'GLOBAL_QUOTE',
        symbol,
        apikey: ALPHA_VANTAGE_API_KEY
      },
      timeout: 5000
    });

    const quote = response.data['Global Quote'];
    if (quote && quote['05. price']) {
      const data = {
        symbol,
        price: parseFloat(quote['05. price']),
        high: parseFloat(quote['03. high']),
        low: parseFloat(quote['04. low']),
        open: parseFloat(quote['02. open']),
        previousClose: parseFloat(quote['08. previous close']),
        change: parseFloat(quote['09. change']),
        changePercent: parseFloat(quote['10. change percent']),
        timestamp: new Date(),
        source: 'alpha_vantage'
      };

      await cacheStock(symbol, data, 60);
      return data;
    }
  } catch (err) {
    console.error(`Alpha Vantage error for ${symbol}:`, err.message);
  }

  throw new Error(`Failed to fetch price for ${symbol}`);
}

export async function getIntraday(symbol, interval = '1min') {
  try {
    const response = await axios.get(ALPHA_VANTAGE_BASE, {
      params: {
        function: 'INTRADAY',
        symbol,
        interval,
        apikey: ALPHA_VANTAGE_API_KEY
      },
      timeout: 5000
    });

    const key = `Time Series (${interval})`;
    const timeSeries = response.data[key] || {};

    return Object.entries(timeSeries)
      .slice(0, 100) // Last 100 entries
      .map(([time, values]) => ({
        time,
        open: parseFloat(values['1. open']),
        high: parseFloat(values['2. high']),
        low: parseFloat(values['3. low']),
        close: parseFloat(values['4. close']),
        volume: parseInt(values['5. volume'])
      }))
      .reverse(); // Oldest first
  } catch (err) {
    console.error(`Intraday error for ${symbol}:`, err.message);
    throw err;
  }
}

export async function getDailyData(symbol, outputsize = 'compact') {
  try {
    const response = await axios.get(ALPHA_VANTAGE_BASE, {
      params: {
        function: 'TIME_SERIES_DAILY',
        symbol,
        apikey: ALPHA_VANTAGE_API_KEY,
        outputsize
      },
      timeout: 5000
    });

    const timeSeries = response.data['Time Series (Daily)'] || {};

    return Object.entries(timeSeries)
      .map(([date, values]) => ({
        date,
        open: parseFloat(values['1. open']),
        high: parseFloat(values['2. high']),
        low: parseFloat(values['3. low']),
        close: parseFloat(values['4. close']),
        volume: parseInt(values['5. volume'])
      }))
      .reverse(); // Oldest first
  } catch (err) {
    console.error(`Daily data error for ${symbol}:`, err.message);
    throw err;
  }
}

export async function searchSymbol(keywords) {
  try {
    const response = await axios.get(`${FINNHUB_BASE}/search`, {
      params: {
        q: keywords,
        token: FINNHUB_API_KEY
      },
      timeout: 5000
    });

    return response.data.result.slice(0, 20).map(item => ({
      symbol: item.symbol,
      name: item.description,
      type: item.type,
      displaySymbol: item.displaySymbol
    }));
  } catch (err) {
    console.error(`Search error:`, err.message);
    throw err;
  }
}
