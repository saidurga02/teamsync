// ========================== USER INFO ==============================
async function fetchUserData() {
    const userId = 1;
    const userRes = await fetch(`/api/users/${userId}`);
    const user = await userRes.json();
  
    document.getElementById('userName').innerText = user.name;
    document.getElementById('joinedDate').innerText = new Date(user.joined_at).toDateString();
  }
  
  // ========================== HOLDINGS & DONUT ========================
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
          backgroundColor: ['#36A2EB', '#FF6384', '#FFCE56', '#4BC0C0', '#9966FF']
        }]
      }
    });
  }
  
 

 
  // ========================= SOLD HISTORY TABLE ==========================
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
  
  // =================== HISTORICAL TREND LINE CHART ======================
  async function fetchPerformanceChart() {
    const res = await fetch('/api/stocks/holdings');
    const holdings = await res.json();
  
    const labels = [];
    const datasets = [];
  
    for (let d = 6; d >= 0; d--) {
      const day = new Date();
      day.setDate(day.getDate() - d);
      labels.push(day.toISOString().split('T')[0]);
    }
  
    holdings.forEach(stock => {
      let price = parseFloat(stock.current_price);
      const prices = [];
  
      for (let i = 0; i < 7; i++) {
        const fluctuation = (Math.random() - 0.5) * 2;
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
  
  // ========================== UTIL ============================
  function getRandomColor() {
    const r = () => Math.floor(Math.random() * 255);
    return `rgb(${r()}, ${r()}, ${r()})`;
  }
  async function renderSectorHoldingsBarChart() {
    const res = await fetch('/api/stocks/holdings');
    const data = await res.json();
  
    const sectorMap = {};
  
    data.forEach(stock => {
      const sector = stock.sector || 'Unknown';
      if (!sectorMap[sector]) sectorMap[sector] = 0;
      sectorMap[sector] += stock.quantity;
    });
  
    const canvas = document.createElement('canvas');
    canvas.id = 'sectorBarChart';
    document.querySelector('.chart-section').appendChild(canvas);
  
    new Chart(canvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels: Object.keys(sectorMap),
        datasets: [{
          label: 'Holdings by Sector',
          data: Object.values(sectorMap),
          backgroundColor: '#36A2EB'
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Quantity Held' }
          },
          x: {
            title: { display: true, text: 'Sector' }
          }
        }
      }
    });
  }
  async function renderTypeOfPlayBarChart() {
    const res = await fetch('/api/stocks/holdings');
    const data = await res.json();
  
    const playTypeMap = { 'Intraday': 0, 'Swing': 0, 'Long-Term': 0 };
  
    data.forEach(stock => {
      const type = stock.type_of_play || 'Unknown';
      if (!playTypeMap[type]) playTypeMap[type] = 0;
      playTypeMap[type] += stock.quantity;
    });
  
    const canvas = document.createElement('canvas');
    canvas.id = 'typeBarChart';
    document.querySelector('.chart-section').appendChild(canvas);
  
    new Chart(canvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels: Object.keys(playTypeMap),
        datasets: [{
          label: 'Holdings by Type of Play',
          data: Object.values(playTypeMap),
          backgroundColor: '#FF9F40'
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Quantity Held' }
          },
          x: {
            title: { display: true, text: 'Type of Play' }
          }
        }
      }
    });
  }
  
  
  // ========================== RUN =============================
  fetchUserData();
  fetchHoldings();
  fetchSoldHistory();
  fetchPerformanceChart();
  renderSectorHoldingsBarChart();
  renderTypeOfPlayBarChart();
  
  