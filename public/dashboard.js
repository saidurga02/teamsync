let holdings = JSON.parse(localStorage.getItem('holdings')) || {};
let netWorth = parseFloat(localStorage.getItem('netWorth')) || 10000;
document.getElementById('netValue').innerText = netWorth.toFixed(2);

let allStocks = [];

function fetchStocks() {
  fetch('/api/stocks')
    .then(res => res.json())
    .then(stocks => {
      allStocks = stocks;
      simulateStockPrices();
      renderFilteredStocks();
      setTimeout(fetchStocks, 1000);
    })
    .catch(err => console.error('Error fetching stocks:', err));
}

function simulateStockPrices() {
  allStocks.forEach(stock => {
    stock.current_price = parseFloat(stock.current_price) || 0;
    stock.open_price = parseFloat(stock.open_price) || 0;
    stock.prev_close_price = parseFloat(stock.prev_close_price) || 0;
    stock.day_high = parseFloat(stock.day_high) || stock.current_price;
    stock.day_low = parseFloat(stock.day_low) || stock.current_price;

    stock.current_price += (Math.random() - 0.5) * 2;
    stock.current_price = parseFloat(stock.current_price.toFixed(2));

    if (stock.current_price > stock.day_high) stock.day_high = stock.current_price;
    if (stock.current_price < stock.day_low) stock.day_low = stock.current_price;
  });
}

function renderFilteredStocks() {
  const selectedTypes = Array.from(document.querySelectorAll('.typeFilter:checked')).map(cb => cb.value);
  const selectedSectors = Array.from(document.querySelectorAll('.sectorFilter:checked')).map(cb => cb.value);

  const filtered = allStocks.filter(stock => {
    const matchType = selectedTypes.length ? selectedTypes.includes(stock.type_of_play) : true;
    const matchSector = selectedSectors.length ? selectedSectors.includes(stock.sector) : true;
    return matchType && matchSector;
  });

  document.getElementById('stocksBody').innerHTML = '';
  filtered.forEach(renderStock);
}

function getCompanyLogo(symbol) {
  return `https://logo.clearbit.com/${symbol.toLowerCase()}.com`;
}

function renderStock(stock) {
  const row = document.createElement('tr');
  const { color, value } = getProfitLossDisplay(stock.symbol, stock.current_price);

  row.innerHTML = `
    <td>
      <img src="${getCompanyLogo(stock.symbol)}" onerror="this.style.display='none'" width="20" style="vertical-align:middle; margin-right:6px;">
      ${stock.symbol}
    </td>
    <td>${stock.name}</td>
    <td>₹${stock.current_price}</td>
    <td>₹${stock.open_price}</td>
    <td>₹${stock.prev_close_price}</td>
    <td>₹${stock.day_high}</td>
    <td>₹${stock.day_low}</td>
    <td>${stock.volume}</td>
    <td style="color:${color}">${value}</td>
  `;
  document.getElementById('stocksBody').appendChild(row);
}

function getProfitLossDisplay(symbol, currentPrice) {
  if (!holdings[symbol] || holdings[symbol].quantity === 0) {
    return { value: '—', color: 'gray' };
  }

  const { quantity, avgPrice } = holdings[symbol];
  const diff = currentPrice - avgPrice;
  const totalChange = (diff * quantity).toFixed(2);
  const percentChange = ((diff / avgPrice) * 100).toFixed(2);

  const color = diff >= 0 ? 'lightgreen' : 'red';
  const sign = diff >= 0 ? '+' : '';
  const value = `₹${sign}${totalChange} (${sign}${percentChange}%)`;

  return { value, color };
}

function buyStock() {
  const symbol = document.getElementById('symbol').value.toUpperCase();
  const quantity = parseInt(document.getElementById('quantity').value);
  const price = parseFloat(document.getElementById('price').value);
  if (!symbol || isNaN(quantity) || isNaN(price)) return alert("Invalid input");

  const stock = allStocks.find(s => s.symbol === symbol);
  if (!stock) return alert("Stock not found.");

  if (price < stock.current_price) {
    return alert(`You can only buy at or above the current price (₹${stock.current_price}).`);
  }

  const cost = quantity * price;
  if (netWorth < cost) return alert(`Insufficient funds. You need ₹${cost}, but have ₹${netWorth}.`);

  fetch('/api/stocks/buy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symbol, quantity, price })
  }).then(() => {
    if (!holdings[symbol]) holdings[symbol] = { quantity: 0, avgPrice: 0 };

    const totalQty = holdings[symbol].quantity + quantity;
    holdings[symbol].avgPrice = ((holdings[symbol].avgPrice * holdings[symbol].quantity) + (price * quantity)) / totalQty;
    holdings[symbol].quantity = totalQty;

    netWorth -= cost;
    persistData();

    document.getElementById('netValue').innerText = netWorth.toFixed(2);
    document.getElementById('symbol').value = '';
    document.getElementById('quantity').value = '';
    document.getElementById('price').value = '';
  });
}

function sellStock() {
  const symbol = document.getElementById('symbol').value.toUpperCase();
  const quantity = parseInt(document.getElementById('quantity').value);
  const price = parseFloat(document.getElementById('price').value);
  if (!symbol || isNaN(quantity) || isNaN(price)) return alert("Invalid input");

  if (!holdings[symbol] || holdings[symbol].quantity < quantity) {
    return alert("You don't own enough shares to sell.");
  }

  const stock = allStocks.find(s => s.symbol === symbol);
  if (!stock) return alert("Stock not found.");

  if (price > stock.current_price) {
    return alert(`You can only sell at or below the current price (₹${stock.current_price}).`);
  }

  fetch('/api/stocks/sell', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symbol, quantity, price })
  }).then(() => {
    holdings[symbol].quantity -= quantity;
    if (holdings[symbol].quantity === 0) holdings[symbol].avgPrice = 0;

    netWorth += quantity * price;
    persistData();

    document.getElementById('netValue').innerText = netWorth.toFixed(2);
    document.getElementById('symbol').value = '';
    document.getElementById('quantity').value = '';
    document.getElementById('price').value = '';
  });
}


function persistData() {
  localStorage.setItem('holdings', JSON.stringify(holdings));
  localStorage.setItem('netWorth', netWorth.toFixed(2));
}

// Attach checkbox change listeners
document.querySelectorAll('.typeFilter, .sectorFilter').forEach(cb => {
  cb.addEventListener('change', renderFilteredStocks);
});

fetchStocks();
