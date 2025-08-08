const express = require('express');
const path = require('path');
const app = express();
const stockRoutes = require('./src/routes/stocks');
const chatbotRoutes = require('./src/routes/chatbotRoutes');
const userRoutes = require('./src/routes/users');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/stocks', stockRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/users', userRoutes);

app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    res.status(404).json({ error: 'API route not found' });
  } else {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
