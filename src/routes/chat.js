const express = require('express');
const router = express.Router();
const db = require('../db');

router.post('/', async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.json({ reply: "Please enter a message." });
  }

  const lowerMsg = message.toLowerCase();

  try {
    // Handle "which stock should I buy" first to avoid falling into the 'should I buy' branch
    if (lowerMsg.includes('which stock') || lowerMsg.includes('what stock')) {
      const [rows] = await db.query(`
        SELECT 
          s.symbol,
          ROUND(((AVG(t.price) - h.avg_buy_price) / h.avg_buy_price) * 100, 2) AS profit_percent
        FROM transactions t
        JOIN stocks s ON t.stock_id = s.stock_id
        JOIN holdings h ON h.stock_id = s.stock_id
        WHERE t.type = 'SELL'
        GROUP BY s.symbol, h.avg_buy_price
        ORDER BY profit_percent DESC
        LIMIT 1
      `);

      if (rows.length > 0) {
        return res.json({
          reply: `📈 Based on your transaction history, ${rows[0].symbol} has given the highest returns (${rows[0].profit_percent}%). You might consider buying it.`
        });
      } else {
        // Fallback: suggest based on current holdings if no sell history
        const [holdings] = await db.query(`
          SELECT s.symbol,
                 ROUND(((s.current_price - h.avg_buy_price) / h.avg_buy_price) * 100, 2) AS potential_gain
          FROM holdings h
          JOIN stocks s ON h.stock_id = s.stock_id
          ORDER BY potential_gain DESC
          LIMIT 1
        `);

        if (holdings.length > 0) {
          return res.json({
            reply: `📊 Based on current prices, ${holdings[0].symbol} shows the highest potential gain (${holdings[0].potential_gain}%).`
          });
        } else {
          return res.json({
            reply: "I couldn't find enough data to suggest a stock."
          });
        }
      }
    }

    // Handle "should I buy <symbol>"
    if (lowerMsg.includes('should i buy')) {
      const stockSymbol = lowerMsg.split('buy')[1]?.trim().toUpperCase();
      if (!stockSymbol) {
        return res.json({ reply: "Please specify the stock symbol." });
      }

      const [rows] = await db.query(
        `SELECT AVG(price) AS avg_buy, 
                (SELECT current_price FROM stocks WHERE symbol = ?) AS current_price
         FROM transactions t
         JOIN stocks s ON t.stock_id = s.stock_id
         WHERE s.symbol = ? AND t.type = 'BUY'`,
        [stockSymbol, stockSymbol]
      );

      if (!rows.length || !rows[0].avg_buy) {
        return res.json({ reply: `You don't have any history for ${stockSymbol}. Do more research before buying.` });
      }

      const avgBuy = parseFloat(rows[0].avg_buy);
      const currentPrice = parseFloat(rows[0].current_price);

      if (isNaN(avgBuy) || isNaN(currentPrice)) {
        return res.json({ reply: `Unable to get price data for ${stockSymbol}.` });
      }

      if (currentPrice < avgBuy) {
        return res.json({ reply: `✅ ${stockSymbol} is currently below your average buy price. Could be a good entry.` });
      } else {
        return res.json({ reply: `⚠️ ${stockSymbol} is above your average buy price. You might wait for a dip.` });
      }
    }

    // Default fallback
    return res.json({ reply: "I'm not sure how to respond to that. Try asking about stocks to buy." });

  } catch (err) {
    console.error("Chatbot error:", err);
    return res.json({ reply: "⚠️ Error processing your request." });
  }
});

module.exports = router;
