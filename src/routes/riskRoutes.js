// // src/routes/riskRoutes.js
// const express = require('express');
// const router = express.Router();

// router.post('/risk', (req, res) => {
//   const { age, income, goal, risk } = req.body;

//   let recommendations = [];

//   if (risk === 'low') {
//     recommendations = ['Fixed Deposits', 'Bonds', 'Savings Schemes'];
//   } else if (risk === 'medium') {
//     recommendations = ['Index Funds', 'Balanced Mutual Funds', 'ETFs'];
//   } else if (risk === 'high') {
//     recommendations = ['Stocks', 'Crypto', 'Sector ETFs'];
//   }

//   return res.json({ recommendations });
// });

// module.exports = router; // ✅ Only export the router
const express = require('express');
const router = express.Router();

router.post('/risk', (req, res) => {
  const { age, income, goal, risk } = req.body;
  let recommendations = [];

  if (risk === 'low') {
    recommendations = ['Fixed Deposits', 'Bonds', 'Savings Schemes'];
  } else if (risk === 'medium') {
    recommendations = ['Index Funds', 'Balanced Mutual Funds', 'ETFs'];
  } else if (risk === 'high') {
    recommendations = ['Stocks', 'Crypto', 'Sector ETFs'];
  }

  return res.json({ recommendations });
});

module.exports = router;
