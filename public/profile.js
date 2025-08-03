async function fetchUserData() {
    const userId = 1;
  
    const userRes = await fetch(`/api/users/${userId}`);
    const user = await userRes.json();
    document.getElementById('userName').innerText = user.name;
    document.getElementById('joinedDate').innerText = new Date(user.joined_at).toDateString();
  }
  
  async function fetchHoldings() {
    const res = await fetch('/api/stocks/holdings');
    const data = await res.json();
    const holdingsList = document.getElementById('holdingsList');
  
    const labels = [];
    const values = [];
  
    holdingsList.innerHTML = '';
    data.forEach(h => {
      const profitPercent = (((h.current_price - h.avg_buy_price) / h.avg_buy_price) * 100).toFixed(2);
      holdingsList.innerHTML += `<li>${h.symbol}: ${h.quantity} — ${profitPercent}%</li>`;
      labels.push(h.symbol);
      values.push(h.quantity);
    });
  
    new Chart(document.getElementById('donutChart'), {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          label: 'Holdings Distribution',
          data: values,
          backgroundColor: ['#36A2EB', '#FF6384', '#FFCE56', '#4BC0C0']
        }]
      }
    });
  }
  
  async function fetchSoldHistory() {
    const res = await fetch('/api/stocks/transactions');
    const transactions = await res.json();
    const soldBody = document.getElementById('soldBody');
  
    soldBody.innerHTML = '';
    transactions
      .filter(t => t.type === 'SELL')
      .forEach(t => {
        const pl = (((t.price - t.avg_price) / t.avg_price) * 100).toFixed(2);
        soldBody.innerHTML += `
          <tr>
            <td>${t.symbol}</td>
            <td>₹${t.price}</td>
            <td>${t.quantity}</td>
            <td>${pl}%</td>
            <td>${new Date(t.timestamp).toLocaleString()}</td>
          </tr>
        `;
      });
  }
  
  async function fetchPerformanceChart() {
  const res = await fetch('/api/stocks/holdings');
  const holdings = await res.json();

  const labels = [];
  const datasets = [];

  // Simulate past 7 days
  for (let d = 6; d >= 0; d--) {
    const day = new Date();
    day.setDate(day.getDate() - d);
    labels.push(day.toISOString().split('T')[0]); // YYYY-MM-DD
  }

  holdings.forEach(stock => {
    let price = parseFloat(stock.current_price);
    const prices = [];

    // Simulate daily fluctuation
    for (let i = 0; i < 7; i++) {
      const fluctuation = (Math.random() - 0.5) * 2; // -1 to +1
      price += fluctuation;
      prices.push(price.toFixed(2));
    }

    datasets.push({
      label: stock.symbol,
      data: prices,
      borderColor: getRandomColor(),
      fill: false,
      tension: 0.3
    });
  });

  new Chart(document.getElementById('lineChart'), {
    type: 'line',
    data: {
      labels,
      datasets
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'top' },
        tooltip: { mode: 'index', intersect: false }
      },
      interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false
      },
      scales: {
        y: {
          beginAtZero: false,
          title: { display: true, text: '₹ Price' }
        },
        x: {
          title: { display: true, text: 'Date' }
        }
      }
    }
  });
}

function getRandomColor() {
  const r = () => Math.floor(Math.random() * 255);
  return `rgb(${r()}, ${r()}, ${r()})`;
}

  
  
  fetchUserData();
  fetchHoldings();
  fetchSoldHistory();
  fetchPerformanceChart();
  