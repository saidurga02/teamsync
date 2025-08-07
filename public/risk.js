const apiKey = '7abdfcf528aa41648308ffc30ff7ed35'; // Replace with your actual TwelveData API key

async function getRecommendation() {
  const age = parseInt(document.getElementById('age').value);
  const salary = parseInt(document.getElementById('salary').value);
  const symbol = document.getElementById('symbolInput').value.trim().toUpperCase();
  const output = document.getElementById('output');
  output.innerHTML = '';

  if (!age || !salary || !symbol) {
    output.textContent = 'Please enter all details.';
    return;
  }
  if (isNaN(age) || age < 10 || age > 100) {
    return output.innerHTML = "<p style='color:red;'>Please enter a valid age between 10 and 100.</p>";
  }

  if (isNaN(salary) || salary <= 0) {
    return output.innerHTML = "<p style='color:red;'>Please enter a valid salary.</p>";
  }

  try {
    // ✅ Get user holdings from your backend
    const holdingsRes = await fetch('/api/stocks/holdings');
    const holdingsData = await holdingsRes.json();
    const ownedSymbols = holdingsData.map(h => h.symbol.toUpperCase());

    const hasStock = ownedSymbols.includes(symbol);

    // ✅ Fetch stock performance
    const intervals = ['1month', '6month', '1year'];
    const prices = {};

    for (let interval of intervals) {
      const res = await fetch(`https://api.twelvedata.com/time_series?symbol=${symbol}&interval=1day&outputsize=260&apikey=${apiKey}`);
      const data = await res.json();

      if (data.status === 'error') {
        output.innerHTML = `<p>Error: ${data.message}</p>`;
        return;
      }

      const series = data.values;
      if (series.length < 130) {
        output.innerHTML = `<p>Not enough data for ${symbol}</p>`;
        return;
      }

      const daysAgo = {
        '1month': 22,
        '6month': 130,
        '1year': 260
      };

      const recent = parseFloat(series[0].close);
      const past = parseFloat(series[Math.min(daysAgo[interval], series.length - 1)].close);
      const change = (((recent - past) / past) * 100).toFixed(2);
      prices[interval] = { recent, past, change };
    }

    const oneMonthChange = parseFloat(prices['1month'].change);
    const sixMonthChange = parseFloat(prices['6month'].change);
    const oneYearChange = parseFloat(prices['1year'].change);

    // ✅ Age-based risk tolerance
    const riskTolerance = age < 30 ? 'High' : age < 50 ? 'Medium' : 'Low';
    const budget = salary * 0.2;

    // ✅ Decision logic
    let recommendation = 'Hold';
    let reason = 'The stock is stable, and there is no clear trend for action.';
    let extraAdvice = '';

    if (hasStock) {
      if (oneMonthChange < -5 || oneYearChange < -10) {
        recommendation = 'Sell';
        reason = 'You hold this stock and it has shown significant decline.';
      } else if (oneMonthChange > 5 && sixMonthChange > 10 && oneYearChange > 15) {
        recommendation = 'Hold or Sell for profit';
        reason = 'You already hold this, and it is performing well — consider partial selling for profit.';
      } else {
        recommendation = 'Hold';
        reason = 'Stock is performing stably in your holdings.';
      }
    } else {
      if (oneMonthChange > 5 && sixMonthChange > 10 && oneYearChange > 15) {
        recommendation = riskTolerance === 'High' ? 'Buy' : 'Watch';
        reason = 'Strong growth across time frames — might be a good entry.';
      } else if (oneMonthChange < -5 || oneYearChange < -10) {
        recommendation = 'Wait';
        reason = 'Stock is dropping — not ideal for new entry.';
      } else {
        recommendation = 'Watch';
        reason = 'Stock is stable, but no major movement.';
      }

      extraAdvice = `
        <p><strong>You don't currently hold this stock.</strong></p>
        <p>Based on your age (${age}) and salary (₹${salary}):</p>
        <ul>
          <li>Risk Profile: <strong>${riskTolerance}</strong></li>
          <li>Suggested investment budget (20% of monthly): <strong>₹${budget}</strong></li>
          <li>${generateEntryAdvice(riskTolerance, oneMonthChange, sixMonthChange, oneYearChange)}</li>
        </ul>
      `;
    }

    // ✅ Display output
    output.innerHTML = `
      <h3>${symbol} Analysis</h3>
      <p><strong>Age:</strong> ${age} | <strong>Salary:</strong> ₹${salary} | <strong>Risk Tolerance:</strong> ${riskTolerance}</p>
      <p><strong>Investment Budget:</strong> ₹${budget}</p>
      <hr>
      <p><strong>1 Month:</strong> ${prices['1month'].change}%</p>
      <p><strong>6 Months:</strong> ${prices['6month'].change}%</p>
      <p><strong>1 Year:</strong> ${prices['1year'].change}%</p>
      <hr>
      <p><strong>Recommendation:</strong> <span style="color:blue">${recommendation}</span></p>
      <p><strong>Reason:</strong> ${reason}</p>
      ${extraAdvice}
    `;
  } catch (error) {
    output.textContent = 'Error fetching data.';
    console.error(error);
  }
}

// ✅ Entry advice generator
function generateEntryAdvice(risk, m1, m6, y1) {
  if (risk === 'High') {
    if (m1 < 0 && y1 > 10) return "You can consider buying now – this may be a good dip opportunity.";
    if (m1 > 3 && m6 > 5) return "Stock is trending up. Enter now to ride the momentum.";
    return "Monitor for a slight dip or correction, then enter.";
  }
  if (risk === 'Medium') {
    if (m1 > 3 && y1 > 10) return "Consider entering with a small investment and increase gradually.";
    return "Wait for more stable trend or correction before entering.";
  }
  if (risk === 'Low') {
    if (m6 > 5 && y1 > 10) return "If stability continues, consider entering next month.";
    return "Too risky now. Reassess next month.";
  }
  return "Monitor the market for better entry timing.";
}
function closePopup() {
  document.querySelector('.popup').style.display = 'none';
}

function refreshPage() {
  location.reload();
}