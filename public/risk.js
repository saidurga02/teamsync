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

  try {
    const intervals = ['1month', '6month', '1year'];
    const prices = {};

    for (let interval of intervals) {
      const res = await fetch(`https://api.twelvedata.com/time_series?symbol=${symbol}&interval=1day&outputsize=130&apikey=${apiKey}`);
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

      let daysAgo = {
        '1month': 22,
        '6month': 130,
        '1year': 260
      };

      const recent = parseFloat(series[0].close);
      const past = parseFloat(series[Math.min(daysAgo[interval], series.length - 1)].close);
      const change = (((recent - past) / past) * 100).toFixed(2);
      prices[interval] = { recent, past, change };
    }

    // Simple recommendation logic
    let recommendation = 'Hold';
    const oneMonthChange = parseFloat(prices['1month'].change);
    const sixMonthChange = parseFloat(prices['6month'].change);
    const oneYearChange = parseFloat(prices['1year'].change);

    const riskTolerance = age < 30 ? 'High' : age < 50 ? 'Medium' : 'Low';
    const budget = salary * 0.2;

    if (oneMonthChange > 5 && sixMonthChange > 10 && oneYearChange > 15) {
      recommendation = riskTolerance === 'High' ? 'Buy' : 'Hold';
    } else if (oneMonthChange < -5 || oneYearChange < -10) {
      recommendation = 'Sell';
    }

    output.innerHTML = `
      <h3>${symbol} Analysis</h3>
      <p><strong>Age:</strong> ${age} | <strong>Salary:</strong> ₹${salary} | <strong>Risk:</strong> ${riskTolerance}</p>
      <p><strong>Investment Budget:</strong> ₹${budget}</p>
      <hr>
      <p><strong>1 Month:</strong> ${prices['1month'].change}%</p>
      <p><strong>6 Months:</strong> ${prices['6month'].change}%</p>
      <p><strong>1 Year:</strong> ${prices['1year'].change}%</p>
      <hr>
      <p><strong>Recommendation:</strong> <span style="color:blue">${recommendation}</span></p>
    `;
  } catch (error) {
    output.textContent = 'Error fetching data.';
    console.error(error);
  }
}
