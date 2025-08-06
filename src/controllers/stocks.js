class StocksController {
  constructor(dbInstance) {
    this.db = dbInstance || require('../db'); // allow mock injection
  }

  async getStocks(req, res) {
    try {
      const [rows] = await this.db.query('SELECT * FROM stocks');
      return res.json(rows);
    } catch (err) {
      console.error('Error fetching stocks:', err);
      return res.status(500).json({ error: 'Database error' });
    }
  }

  async addStock(req, res) {
    const { symbol, name, current_price, sector, type_of_play } = req.body;
    try {
      const [result] = await this.db.query(
        'INSERT INTO stocks (symbol, name, current_price, sector, type_of_play) VALUES (?, ?, ?, ?, ?)',
        [symbol, name, current_price, sector, type_of_play]
      );
      return res.status(201).json({ id: result.insertId });
    } catch (err) {
      console.error('Error adding stock:', err);
      return res.status(500).json({ error: 'Database insert error' });
    }
  }

  async buyStock(req, res) {
    const { symbol, quantity, price } = req.body;
    try {
      const [rows] = await this.db.query('SELECT stock_id FROM stocks WHERE symbol = ?', [symbol]);
      if (!rows.length) return res.status(404).json({ error: 'Stock not found' });

      const stock_id = rows[0].stock_id;

      await this.db.query(
        'INSERT INTO transactions (stock_id, type, quantity, price) VALUES (?, "BUY", ?, ?)',
        [stock_id, quantity, price]
      );

      const [holdings] = await this.db.query('SELECT quantity, avg_buy_price FROM holdings WHERE stock_id = ?', [stock_id]);

      if (!holdings.length) {
        await this.db.query(
          'INSERT INTO holdings (stock_id, quantity, avg_buy_price) VALUES (?, ?, ?)',
          [stock_id, quantity, price]
        );
      } else {
        const totalQty = holdings[0].quantity + quantity;
        const totalCost = (holdings[0].avg_buy_price * holdings[0].quantity) + (price * quantity);
        const newAvgPrice = totalCost / totalQty;

        await this.db.query(
          'UPDATE holdings SET quantity = ?, avg_buy_price = ? WHERE stock_id = ?',
          [totalQty, newAvgPrice.toFixed(2), stock_id]
        );
      }

      return res.status(200).json({ message: 'Stock bought successfully' });
    } catch (err) {
      console.error('Error buying stock:', err);
      return res.status(500).json({ error: 'Buy error' });
    }
  }

  async sellStock(req, res) {
    const { symbol, quantity, price } = req.body;
    try {
      const [rows] = await this.db.query('SELECT stock_id FROM stocks WHERE symbol = ?', [symbol]);
      if (!rows.length) return res.status(404).json({ error: 'Stock not found' });

      const stock_id = rows[0].stock_id;

      const [holdings] = await this.db.query('SELECT quantity FROM holdings WHERE stock_id = ?', [stock_id]);
      if (!holdings.length || holdings[0].quantity < quantity) {
        return res.status(400).json({ error: 'Not enough stock to sell' });
      }

      await this.db.query(
        'INSERT INTO transactions (stock_id, type, quantity, price) VALUES (?, "SELL", ?, ?)',
        [stock_id, quantity, price]
      );

      await this.db.query(
        'UPDATE holdings SET quantity = quantity - ? WHERE stock_id = ?',
        [quantity, stock_id]
      );

      return res.status(200).json({ message: 'Stock sold successfully' });
    } catch (err) {
      console.error('Error selling stock:', err);
      return res.status(500).json({ error: 'Sell error' });
    }
  }

  async getHoldings(req, res) {
    try {
      const [rows] = await this.db.query(`
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
      return res.json(rows);
    } catch (err) {
      console.error('Error fetching holdings:', err);
      return res.status(500).json({ error: 'Database error' });
    }
  }

  async getTransactions(req, res) {
    try {
      const [rows] = await this.db.query(`
        SELECT t.*, s.symbol, h.avg_buy_price AS avg_price
        FROM transactions t
        JOIN stocks s ON t.stock_id = s.stock_id
        LEFT JOIN holdings h ON t.stock_id = h.stock_id
      `);
      return res.json(rows);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      return res.status(500).json({ error: 'Database error' });
    }
  }

  async getReturns(req, res) {
    try {
      const [rows] = await this.db.query(`
        SELECT DATE(timestamp) AS date, SUM(quantity * price) AS net_gain
        FROM transactions
        GROUP BY DATE(timestamp)
        ORDER BY date ASC
      `);
      return res.json(rows);
    } catch (err) {
      console.error('Error fetching returns:', err);
      return res.status(500).json({ error: 'Database error' });
    }
  }
}

module.exports = { StocksController };
