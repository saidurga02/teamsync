

// replace with your real key

// const express = require('express');
// const axios = require('axios');
// const router = express.Router();

// const FINNHUB_API_KEY = 'sk-188b2f5514f641428fa994b07cdd7940';  // replace with your real key
// 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
// src/routes/chatbotRoutes.js
// src/routes/chatbotRoutes.js
// src/routes/chatbotRoutes.js

// // src/routes/chatbotRoutes.js
// const express = require('express');
// const router = express.Router();
// const axios = require('axios');

// const OPENROUTER_API_KEY = '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'; // Replace with your actual OpenRouter key

const express = require('express');
const router = express.Router();
const axios = require('axios');

const OPENROUTER_API_KEY = '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';  // your actual OpenRouter key
const FINNHUB_API_KEY = 'sk-188b2f5514f641428fa994b07cdd7940';
// src/routes/chatbotRoutes.js

router.post('/ask', async (req, res) => {
  const { message } = req.body;

  // 🔍 Price query
  const priceMatch = message.toLowerCase().match(/price of (\w{1,6})/i);

  if (priceMatch) {
    const rawTicker = priceMatch[1];
    const ticker = rawTicker.replace(/[^a-z]/gi, '').toUpperCase();  // strip special chars
  
    try {
      const response = await axios.get(`https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${FINNHUB_API_KEY}`);
      const price = response.data.c;
      if (price) {
        return res.json({
            reply: `❌ Couldn't fetch data for <b>${ticker}</b>. Please check the symbol.`
          });
          
      } else {
        return res.json({ reply: `❌ Could not fetch price for <b>${ticker}</b>.` });
      }
    } catch (err) {
      return res.json({ reply: `❌ Error fetching data for <b>${ticker}</b>.` });
    }
  }

  // 🔥 Trending stocks
  const bestMatch = message.match(/(best|top|trending).*(stocks|equities)/i);
  if (bestMatch) {
    const topStocks = [' <b>AAPL</b>', ' <b>TSLA</b>', ' <b>MSFT</b>'];
    return res.json({
      reply: ` Here are 3 trending stocks right now:\n• ${topStocks.join('\n• ')}`
    });
  }

  // 🧠 Fallback to LLM
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
        },
      }
    );

    const reply = response.data.choices?.[0]?.message?.content || '🤖 No reply from chatbot.';
    res.json({ reply });

  } catch (err) {
    console.error(" Chatbot error:", err.response?.data || err.message);
    res.status(500).json({
      reply: ` Chatbot error: ${JSON.stringify(err.response?.data || err.message)}`
    });
  }
});

module.exports = router;
