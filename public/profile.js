// ========================== USER INFO ==============================
async function fetchUserData() {
    const userId = 1;
    try {
      const userRes = await fetch(`/api/users/${userId}`);
      const user = await userRes.json();
  
      const userName = user?.name || 'James Charlie';
      const joinedAt = new Date(user?.joined_at);
      const isValidDate = joinedAt instanceof Date && !isNaN(joinedAt);
  
      document.getElementById('userName').innerText = userName;
      document.getElementById('joinedDate').innerText = isValidDate
        ? joinedAt.toDateString()
        : '2nd Aug 2025';
    } catch (error) {
      // fallback if fetch fails completely
      document.getElementById('userName').innerText = 'James Charlie';
      document.getElementById('joinedDate').innerText = '2nd Aug 2025';
    }
  }
  
  
  // ========================== HOLDINGS & DONUT ========================
  async function fetchHoldings() {
    const res = await fetch('/api/stocks/holdings');
    const data = await res.json();
  
    const holdingsList = document.getElementById('holdingsList');
    const donutDetails = document.getElementById('donutDetails');
    const donutCanvas = document.getElementById('donutChart');
  
    const labels = [];
    const values = [];
    const backgroundColors = [];
  
    holdingsList.innerHTML = '';
    donutDetails.innerHTML = '';
  
    data.forEach((h, i) => {
      const profitPercent = (((h.current_price - h.avg_buy_price) / h.avg_buy_price) * 100).toFixed(2);
      
      holdingsList.innerHTML += `
  <li>
    <img src="https://logo.clearbit.com/${h.symbol.toLowerCase()}.com" 
         alt="${h.symbol}" 
         width="20" height="20" 
         style="vertical-align:middle; margin-right:8px;" />
    ${h.symbol}: ${h.quantity} — ${profitPercent}%
  </li>`;

      
      labels.push(h.symbol);
      values.push(h.quantity);
      
      // Generate a color dynamically
      const color = getRandomColor();
      backgroundColors.push(color);
  
      // Create donut legend item
      donutDetails.innerHTML += `
        <div class="legend-item">
          <div class="legend-color" style="background: ${color}"></div>
          ${h.symbol} (${h.quantity} shares)
        </div>`;
    });
  
    // Destroy existing chart if exists (avoid overlaying charts)
    if (window.donutChartInstance) {
      window.donutChartInstance.destroy();
    }
  
    // Draw donut chart
    window.donutChartInstance = new Chart(donutCanvas, {
      type: 'pie',
      data: {
        labels,
        datasets: [{
          label: 'Holdings Distribution',
          data: values,
          backgroundColor: backgroundColors
        }]
      },
      options: {
        plugins: {
          legend: { display: false } // We show custom legend
        }
      }
    });
  }
  
  // Utility to generate random pastel colors
  function getRandomColor() {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 70%, 70%)`;
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
    const performanceData = [];
  
    for (let h = 6; h >= 0; h--) {
      const hour = new Date();
      hour.setHours(hour.getHours() - h);
  
      labels.push(`${hour.getHours()}:00`);
  
      let totalInvested = 0;
      let totalCurrentValue = 0;
  
      holdings.forEach(stock => {
        const quantity = stock.quantity;
        const avgBuy = stock.avg_buy_price;
  
        // Simulate price at that hour (±2% fluctuation)
        const fluctuation = 1 + ((Math.random() - 0.5) * 0.04); // ±2%
        const simulatedPrice = stock.current_price * fluctuation;
  
        totalInvested += quantity * avgBuy;
        totalCurrentValue += quantity * simulatedPrice;
      });
  
      const plPercent = ((totalCurrentValue - totalInvested) / totalInvested) * 100;
      performanceData.push(plPercent.toFixed(2));
    }
  
    // Render chart
    const ctx = document.getElementById('lineChart').getContext('2d');
    if (window.lineChartInstance) window.lineChartInstance.destroy();
  
    window.lineChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Portfolio P/L (%)',
          data: performanceData,
          borderColor: '#2ecc71',
          fill: false,
          tension: 0.3
        }]
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
            title: { display: true, text: 'Net P/L (%)' },
            beginAtZero: false
          },
          x: {
            title: { display: true, text: 'Hour of Day' }
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
  
    const canvas = document.getElementById('sectorBarChart');

  
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
  
    const canvas = document.getElementById('typeBarChart');

  
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
  
  // ================== NET WORTH TREND EVERY 7 HOURS ==================
  async function fetchHourlyNetTrend() {
    const res = await fetch('/api/stocks/transactions');
    const transactions = await res.json();
  
    if (!transactions.length) return;
  
    const now = new Date();
    const hours = [];
  
    for (let i = 6; i >= 0; i--) {
      const start = new Date(now);
      start.setHours(start.getHours() - i);
      start.setMinutes(0, 0, 0); // align to start of hour
      const label = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      hours.push({ time: start, label, net: 0 });
    }
  
    let holdings = {};
    let realizedProfit = 0;
    let spent = 0;
  
    transactions.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  
    let hourIndex = 0;
  
    for (const tx of transactions) {
      const txTime = new Date(tx.timestamp);
  
      while (
        hourIndex < hours.length - 1 &&
        txTime > hours[hourIndex + 1].time
      ) {
        hours[hourIndex].net = calcNetWorth(holdings, realizedProfit, spent);
        hourIndex++;
      }
  
      const qty = tx.quantity;
      const price = tx.price;
  
      if (tx.type === 'BUY') {
        spent += qty * price;
        holdings[tx.symbol] = (holdings[tx.symbol] || 0) + qty;
      } else if (tx.type === 'SELL') {
        const avgBuy = tx.avg_price || price;
        realizedProfit += (price - avgBuy) * qty;
        holdings[tx.symbol] = (holdings[tx.symbol] || 0) - qty;
      }
    }
  
    // For remaining hours
    for (; hourIndex < hours.length; hourIndex++) {
      hours[hourIndex].net = calcNetWorth(holdings, realizedProfit, spent);
    }
  
    renderHourlyChart(hours);
  }
  
  function calcNetWorth(holdings, profit, spent) {
    let value = 0;
    for (const symbol in holdings) {
      const qty = holdings[symbol];
      const currentPrice = getCurrentPrice(symbol); // Replace if needed
      value += qty * currentPrice;
    }
    return (value + profit - spent).toFixed(2);
  }
  
  function getCurrentPrice(symbol) {
    // Replace with real-time data or backend if available
    return 100 + Math.random() * 100;
  }
  
  function renderHourlyChart(dataPoints) {
    const canvas = document.getElementById('netWorthChart');
    if (window.hourChartInstance) window.hourChartInstance.destroy();
  
    const ctx = canvas.getContext('2d');
    window.hourChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: dataPoints.map(p => p.label),
        datasets: [{
          label: 'Net Worth (Hourly)',
          data: dataPoints.map(p => p.net),
          borderColor: '#1abc9c',
          backgroundColor: 'rgba(26, 188, 156, 0.1)',
          tension: 0.3,
          fill: true
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            title: { display: true, text: '₹ Net Worth' },
            beginAtZero: false
          },
          x: {
            title: { display: true, text: 'Last 7 Hours' }
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
  fetchHourlyNetTrend();

  
  