create database spm1;
use spm1;


CREATE TABLE users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100),
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add a default user
INSERT INTO users (name, email) VALUES ('Default User', 'user@example.com');



-- Stocks master table
CREATE TABLE stocks (
  stock_id INT AUTO_INCREMENT PRIMARY KEY,
  symbol VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  current_price DECIMAL(10,2) NOT NULL,
  avg_daily_price DECIMAL(10,2),
  day_high DECIMAL(10,2),
  day_low DECIMAL(10,2),
  open_price DECIMAL(10,2),
  prev_close_price DECIMAL(10,2),
  volume BIGINT,
  market_cap BIGINT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- User holdings
CREATE TABLE holdings (
  holding_id INT AUTO_INCREMENT PRIMARY KEY,
  stock_id INT,
  quantity INT NOT NULL,
  avg_buy_price DECIMAL(10,2),
  FOREIGN KEY (stock_id) REFERENCES stocks(stock_id)
);



-- Transaction history
CREATE TABLE transactions (
  transaction_id INT AUTO_INCREMENT PRIMARY KEY,
  stock_id INT,
  type ENUM('BUY', 'SELL'),
  quantity INT,
  price DECIMAL(10,2),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (stock_id) REFERENCES stocks(stock_id)
);

ALTER TABLE stocks
ADD COLUMN type_of_play ENUM('Intraday', 'Swing', 'Long-Term') DEFAULT 'Long-Term',
ADD COLUMN sector VARCHAR(50);
INSERT INTO stocks 
(symbol, name, current_price, avg_daily_price, day_high, day_low, open_price, prev_close_price, volume, market_cap, type_of_play, sector)
VALUES
('GOOGL', 'Alphabet Inc.', 2701.30, 2689.80, 2725.50, 2670.00, 2690.00, 2698.00, 1800000, 1800000000000, 'Long-Term', 'Tech'),
('AMZN', 'Amazon.com Inc.', 3350.10, 3300.45, 3400.00, 3280.00, 3320.00, 3345.00, 2100000, 1700000000000, 'Swing', 'Retail'),
('MSFT', 'Microsoft Corporation', 299.40, 295.85, 302.50, 290.00, 293.00, 297.00, 23000000, 2500000000000, 'Intraday', 'Tech'),
('IBM', 'International Business Machines', 142.33, 141.50, 144.20, 140.00, 141.00, 142.00, 4800000, 125000000000, 'Long-Term', 'Tech'),
('INTC', 'Intel Corporation', 35.66, 35.50, 36.20, 34.80, 35.00, 35.40, 8700000, 150000000000, 'Swing', 'Tech'),
('NVDA', 'NVIDIA Corporation', 875.40, 869.50, 890.00, 860.00, 865.00, 870.00, 20000000, 2150000000000, 'Intraday', 'Tech'),
('META', 'Meta Platforms Inc.', 345.80, 340.70, 350.00, 335.00, 338.00, 343.00, 19000000, 900000000000, 'Swing', 'Tech'),
('PYPL', 'PayPal Holdings Inc.', 72.88, 71.90, 74.00, 70.00, 71.00, 72.00, 5600000, 82000000000, 'Intraday', 'Finance'),
('CRM', 'Salesforce Inc.', 252.12, 250.00, 255.00, 247.00, 248.00, 250.00, 4800000, 245000000000, 'Long-Term', 'Tech'),
('KO', 'Coca-Cola Company', 60.11, 59.80, 60.70, 59.00, 59.40, 60.00, 6400000, 260000000000, 'Swing', 'Consumer'),
('VZ', 'Verizon Communications Inc.', 32.55, 32.40, 33.00, 31.80, 32.10, 32.45, 6200000, 135000000000, 'Intraday', 'Telecom'),
('WMT', 'Walmart Inc.', 160.70, 159.60, 162.00, 158.00, 159.00, 160.00, 5800000, 430000000000, 'Long-Term', 'Retail'),

('JPM', 'JPMorgan Chase & Co.', 192.10, 190.80, 195.00, 188.00, 189.50, 191.00, 7500000, 560000000000, 'Long-Term', 'Finance');



INSERT INTO stocks 
(symbol, name, current_price, avg_daily_price, day_high, day_low, open_price, prev_close_price, volume, market_cap, type_of_play, sector)
VALUES

('TCS', 'Tata Consultancy Services', 3450.10, 3420.00, 3475.00, 3400.00, 3425.00, 3440.00, 1100000, 150000000000, 'Long-Term', 'IT'),
('INFY', 'Infosys Ltd.', 1575.00, 1550.00, 1600.00, 1530.00, 1540.00, 1565.00, 1000000, 90000000000, 'Swing', 'IT'),
('RELIANCE', 'Reliance Industries', 2600.00, 2580.00, 2650.00, 2550.00, 2560.00, 2590.00, 1800000, 230000000000, 'Long-Term', 'Energy');

INSERT INTO stocks 
(symbol, name, current_price, avg_daily_price, day_high, day_low, open_price, prev_close_price, volume, market_cap, type_of_play, sector)
VALUES
('NFLX', 'Netflix Inc.', 500.20, 495.00, 510.00, 480.00, 490.00, 498.00, 1200000, 250000000000, 'Swing', 'Media'),
('HSBC', 'HSBC Holdings plc', 35.40, 34.90, 36.00, 34.00, 34.50, 35.00, 800000, 160000000000, 'Long-Term', 'Banking'),
('JSWSTEEL', 'JSW Steel Ltd.', 820.90, 810.00, 835.00, 800.00, 805.00, 815.00, 950000, 20000000000, 'Swing', 'Metals');
select * from transactions;
DELETE FROM stocks
WHERE symbol IN ('NFLX');