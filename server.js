const express = require('express');
const path = require('path');
const stockRoutes = require('./src/routes/stocks');

const app = express();

// Middleware
app.use(express.json());

// Serve static frontend files (e.g., dashboard.html, dashboard.js)
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.use('/api/stocks', stockRoutes);

// Catch-all route for unknown API paths
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API route not found' });
  } else {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));


const userRoutes = require('./src/routes/users');
app.use('/api/users', userRoutes);

const riskRoutes = require('./src/routes/risk');
app.use('/api/risk', riskRoutes)