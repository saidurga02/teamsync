// tests/stocksController.test.js
const { StocksController } = require('../src/controllers/stocks');
const mockDb = require('./mockDb');

// ✅ Mock the real db.js module so that our controller uses the fake db
jest.mock('../src/db', () => mockDb);

describe('StocksController', () => {
  let controller;
  let mockRes;

  beforeEach(() => {
    controller = new StocksController();

    // Mock Express res object
    mockRes = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };

    jest.clearAllMocks();
  });

  // ========================
  // getStocks()
  // ========================
  it('should return a list of stocks', async () => {
    const fakeStocks = [{ symbol: 'TCS', current_price: 3500 }];
    mockDb.query.mockResolvedValue([fakeStocks]);

    await controller.getStocks({}, mockRes);

    expect(mockDb.query).toHaveBeenCalledWith('SELECT * FROM stocks');
    expect(mockRes.json).toHaveBeenCalledWith(fakeStocks);
  });

  // ========================
  // buyStock()
  // ========================
  it('should insert buy transaction and update holdings', async () => {
    const req = { body: { symbol: 'TCS', quantity: 10, price: 3500 } };

    // Mock finding stock_id
    mockDb.query
      .mockResolvedValueOnce([[{ stock_id: 1 }]])  // SELECT stock_id
      .mockResolvedValueOnce([[]])                 // No existing holdings
      .mockResolvedValueOnce([{}]);                // INSERT holdings

    await controller.buyStock(req, mockRes);

    expect(mockDb.query).toHaveBeenCalledTimes(4);
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Stock bought successfully' });
  });

  // ========================
  // sellStock()
  // ========================
  it('should return error if not enough stock to sell', async () => {
    const req = { body: { symbol: 'TCS', quantity: 5, price: 3500 } };

    mockDb.query
      .mockResolvedValueOnce([[{ stock_id: 1 }]])     // Stock found
      .mockResolvedValueOnce([[{ quantity: 2 }]]);    // Only 2 in holdings

    await controller.sellStock(req, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Not enough stock to sell' });
  });
});
