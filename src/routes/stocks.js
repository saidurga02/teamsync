const express = require('express');
const { StocksController } = require('../controllers/stocks');
const router = express.Router();
const controller = new StocksController();

router.get('/', (req, res) => controller.getStocks(req, res));
router.post('/buy', (req, res) => controller.buyStock(req, res));
router.post('/sell', (req, res) => controller.sellStock(req, res));
router.get('/holdings', (req, res) => controller.getHoldings(req, res));
router.get('/transactions', (req, res) => controller.getTransactions(req, res));
router.get('/returns', (req, res) => controller.getReturns(req, res));


module.exports = router;
