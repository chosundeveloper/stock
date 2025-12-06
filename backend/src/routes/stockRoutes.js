import express from 'express';
import * as stockController from '../controllers/stockController.js';

const router = express.Router();

// Current price endpoints
router.get('/price/:symbol', stockController.getCurrentPrice);

// Chart data endpoints
router.get('/intraday', stockController.getIntraday);
router.get('/daily', stockController.getDaily);

// Search endpoint
router.get('/search', stockController.searchStocks);

export default router;
