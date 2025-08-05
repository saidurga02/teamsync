const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /api/chat
router.post('/', async (req, res) => {
  const { message } = req.body;
  const lowerMsg = message.toLowerCase();

  try {
    // =====================
    // 1. Simple Stock Advice
    // =====================
    if (lowerMsg.startsWith('should i buy')) {
      const symbol = lowerMsg.replace('should i buy', '').trim().toUpperCase();
      if (!symbol) {
        return res.json({ reply: "Please specify the stock symbol." });
      }

      const [rows] = await db.query(
        `SELECT * FROM stocks WHERE symbol = ?`,
        [symbol]
      );

      if (!rows.length) {
        return res.json({ reply: `I couldn't find any data for ${symbol}.` });
      }

      const stock = rows[0];
      let advice = '';

      if (stock.current_price < stock.avg_daily_price) {
        advice = `✅ ${symbol} is trading below its average daily price — could be a good entry point.`;
      } else {
        advice = `⚠️ ${symbol} is above its average daily price — you might want to wait.`;
      }

      return res.json({ reply: advice });
    }

    // ====================================
    // 2. Recommend Most Profitable (History)
    // ====================================
    if (
      lowerMsg.includes('which stock') &&
      lowerMsg.includes('buy') &&
      lowerMsg.includes('profit')
    ) {
      const [rows] = await db.query(`
        SELECT 
          s.symbol,
          AVG(CASE 
                WHEN t.type = 'SELL' THEN (t.price - h.avg_buy_price) / h.avg_buy_price * 100
                ELSE NULL
              END) AS avg_return
        FROM transactions t
        JOIN stocks s ON t.stock_id = s.stock_id
        LEFT JOIN holdings h ON t.stock_id = h.stock_id
        GROUP BY s.symbol
        HAVING avg_return IS NOT NULL
        ORDER BY avg_return DESC
        LIMIT 3
      `);

      if (!rows.length) {
        return res.json({ reply: "I couldn't find enough transaction data to make a recommendation." });
      }

      const suggestions = rows.map(s => {
        const gain = parseFloat(s.avg_return) || 0;
        return `${s.symbol} (+${gain.toFixed(2)}% avg return)`;
      });

      return res.json({
        reply: `📊 Based on your historical transactions, you might consider: ${suggestions.join(', ')}`
      });
    }

    // ===========================
    // 3. Default Fallback
    // ===========================
    return res.json({
      reply: "🤖 I can help with stock advice. Try asking: 'Should I buy TCS?' or 'Which stock should I buy to get more profit?'"
    });

  } catch (err) {
    console.error("DB error fetching stock advice:", err);
    return res.json({
      reply: "⚠️ Error analyzing stock data."
    });
  }
});

module.exports = router;
