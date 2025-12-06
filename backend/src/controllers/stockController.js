import * as finnanceService from '../services/finnanceService.js';

export async function getCurrentPrice(req, res) {
  try {
    const { symbol } = req.params;

    if (!symbol) {
      return res.status(400).json({ error: 'Symbol is required' });
    }

    const data = await finnanceService.getStockPrice(symbol.toUpperCase());
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getIntraday(req, res) {
  try {
    const { symbol, interval = '5min' } = req.query;

    if (!symbol) {
      return res.status(400).json({ error: 'Symbol is required' });
    }

    const validIntervals = ['1min', '5min', '15min', '30min', '60min'];
    if (!validIntervals.includes(interval)) {
      return res.status(400).json({ error: 'Invalid interval' });
    }

    const data = await finnanceService.getIntraday(symbol.toUpperCase(), interval);
    res.json({ symbol: symbol.toUpperCase(), interval, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getDaily(req, res) {
  try {
    const { symbol, outputsize = 'compact' } = req.query;

    if (!symbol) {
      return res.status(400).json({ error: 'Symbol is required' });
    }

    if (!['compact', 'full'].includes(outputsize)) {
      return res.status(400).json({ error: 'Invalid outputsize' });
    }

    const data = await finnanceService.getDailyData(symbol.toUpperCase(), outputsize);
    res.json({ symbol: symbol.toUpperCase(), data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function searchStocks(req, res) {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const results = await finnanceService.searchSymbol(q);
    res.json({ query: q, results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
