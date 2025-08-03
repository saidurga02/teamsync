const mysql = require('mysql2/promise');

const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'n3u3da!',
  database: 'spm1',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

console.log('✅ Connected to MySQL');

module.exports = db;
