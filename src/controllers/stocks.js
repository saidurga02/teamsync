const db = require('../db');

class StocksController {
  async getStocks(req, res) {
    try {
      const [rows] = await db.query('SELECT * FROM stocks');
      res.json(rows);
    } catch (err) {
      console.error('Error fetching stocks:', err);
      res.status(500).json({ error: 'Database error' });
    }
  }

  async addStock(req, res) {
    const { symbol, name, current_price, sector, type_of_play } = req.body;
  
    try {
      const [result] = await db.query(
        'INSERT INTO stocks (symbol, name, current_price, sector, type_of_play) VALUES (?, ?, ?, ?, ?)',
        [symbol, name, current_price, sector, type_of_play]
      );
      res.status(201).json({ id: result.insertId });
    } catch (err) {
      console.error('Error adding stock:', err);
      res.status(500).json({ error: 'Database insert error' });
    }
  }
  

  async buyStock(req, res) {
    const { symbol, quantity, price } = req.body;

    try {
      const [rows] = await db.query('SELECT stock_id FROM stocks WHERE symbol = ?', [symbol]);
      if (!rows.length) return res.status(404).json({ error: 'Stock not found' });

      const stock_id = rows[0].stock_id;

      await db.query(
        'INSERT INTO transactions (stock_id, type, quantity, price) VALUES (?, "BUY", ?, ?)',
        [stock_id, quantity, price]
      );

      // Check if user has holdings already
      const [holdings] = await db.query('SELECT quantity, avg_buy_price FROM holdings WHERE stock_id = ?', [stock_id]);

      if (!holdings.length) {
        await db.query(
          'INSERT INTO holdings (stock_id, quantity, avg_buy_price) VALUES (?, ?, ?)',
          [stock_id, quantity, price]
        );
      } else {
        const totalQty = holdings[0].quantity + quantity;
        const totalCost = (holdings[0].avg_buy_price * holdings[0].quantity) + (price * quantity);
        const newAvgPrice = totalCost / totalQty;

        await db.query(
          'UPDATE holdings SET quantity = ?, avg_buy_price = ? WHERE stock_id = ?',
          [totalQty, newAvgPrice.toFixed(2), stock_id]
        );
      }

      res.status(200).json({ message: 'Stock bought successfully' });
    } catch (err) {
      console.error('Error buying stock:', err);
      res.status(500).json({ error: 'Buy error' });
    }
  }

  async sellStock(req, res) {
    const { symbol, quantity, price } = req.body;

    try {
      const [rows] = await db.query('SELECT stock_id FROM stocks WHERE symbol = ?', [symbol]);
      if (!rows.length) return res.status(404).json({ error: 'Stock not found' });

      const stock_id = rows[0].stock_id;

      const [holdings] = await db.query('SELECT quantity FROM holdings WHERE stock_id = ?', [stock_id]);
      if (!holdings.length || holdings[0].quantity < quantity) {
        return res.status(400).json({ error: 'Not enough stock to sell' });
      }

      await db.query(
        'INSERT INTO transactions (stock_id, type, quantity, price) VALUES (?, "SELL", ?, ?)',
        [stock_id, quantity, price]
      );

      await db.query(
        'UPDATE holdings SET quantity = quantity - ? WHERE stock_id = ?',
        [quantity, stock_id]
      );

      res.status(200).json({ message: 'Stock sold successfully' });
    } catch (err) {
      console.error('Error selling stock:', err);
      res.status(500).json({ error: 'Sell error' });
    }
  }
  async getHoldings(req, res) {
    const [rows] = await db.query(`
      SELECT 
        h.holding_id,
        s.symbol,
        s.name,
        s.current_price,
        h.quantity,
        h.avg_buy_price,
        s.sector,
        s.type_of_play
      FROM holdings h
      JOIN stocks s ON h.stock_id = s.stock_id;
    `);
    res.json(rows);
  }
  
  
  async getTransactions(req, res) {
    const [rows] = await db.query(`
      SELECT t.*, s.symbol, h.avg_buy_price AS avg_price
      FROM transactions t
      JOIN stocks s ON t.stock_id = s.stock_id
      LEFT JOIN holdings h ON t.stock_id = h.stock_id
    `);
    res.json(rows);
  }
  
  async getReturns(req, res) {
    const [rows] = await db.query(`
      SELECT DATE(timestamp) AS date, SUM(quantity * price) AS net_gain
      FROM transactions
      GROUP BY DATE(timestamp)
      ORDER BY date ASC
    `);
    res.json(rows);
  }
  
}



module.exports = { StocksController };
