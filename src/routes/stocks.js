const express = require('express');
const db = require('../db'); 
const { StocksController } = require('../controllers/stocks');

const router = express.Router();
const controller = new StocksController();

// Routes mapping to controller methods
router.get('/', (req, res) => controller.getStocks(req, res));
router.post('/buy', (req, res) => controller.buyStock(req, res));
router.post('/sell', (req, res) => controller.sellStock(req, res));
router.get('/holdings', (req, res) => controller.getHoldings(req, res));
router.get('/transactions', (req, res) => controller.getTransactions(req, res));
router.get('/returns', (req, res) => controller.getReturns(req, res));

// GET single stock info by symbol
router.get('/:symbol', async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();

  try {
    const [rows] = await db.execute('SELECT * FROM stocks WHERE symbol = ?', [symbol]);

    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Stock not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("Error fetching stock:", err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
