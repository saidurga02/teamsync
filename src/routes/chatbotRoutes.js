const express = require('express');
const axios = require('axios');
const router = express.Router();

const OPENROUTER_API_KEY = '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';
const FINNHUB_API_KEY = 'd29dd81r01qhoenbevl0d29dd81r01qhoenbevlg';

router.post('/ask', async (req, res) => {
  const { message } = req.body;

  const priceMatch = message.toLowerCase().match(/price of (\w{1,6})/i);
  if (priceMatch) {
    const ticker = priceMatch[1].toUpperCase();
    try {
      const response = await axios.get(`https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${FINNHUB_API_KEY}`);
      const price = response.data.c;
      if (price) return res.json({ reply: `The current price of <b>${ticker}</b> is ₹${price}` });
      return res.json({ reply: `No data found for <b>${ticker}</b>.` });
    } catch {
      return res.json({ reply: `Error fetching price for <b>${ticker}</b>.` });
    }
  }

  const trendingMatch = message.match(/(best|top|trending).*(stocks|equities)/i);
  if (trendingMatch) {
    return res.json({ reply: `Top trending: <b>AAPL</b>, <b>MSFT</b>, <b>TSLA</b>` });
  }

  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'mistralai/mistral-7b-instruct:free',
        messages: [{ role: 'user', content: message }],
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        }
      }
    );
    res.json({ reply: response.data.choices[0].message.content });
  } catch (err) {
    res.status(500).json({ reply: 'Chatbot error. Please try again.' });
  }
});

module.exports = router;
