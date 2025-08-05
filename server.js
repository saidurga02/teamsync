const express = require('express');
const path = require('path');

const stockRoutes = require('./src/routes/stocks');
const userRoutes = require('./src/routes/users');
const riskRoutes = require('./src/routes/risk');
const chatRoutes = require('./src/routes/chat'); // ✅ New chatbot route

const app = express();

// Middleware
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.use('/api/stocks', stockRoutes);
app.use('/api/users', userRoutes);
app.use('/api/risk', riskRoutes);
app.use('/api/chat', chatRoutes); // ✅ Chatbot route

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
