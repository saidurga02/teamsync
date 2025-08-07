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
        <td>
          <button class="buy-btn" onclick="quickBuy('${stock.symbol}', ${stock.current_price})">Buy</button>
          <button class="sell-btn" onclick="quickSell('${stock.symbol}', ${stock.current_price})">Sell</button>
        <button class="gtt-btn" onclick="openGTTModal('${stock.symbol}', ${stock.current_price})">GTT</button>



        </td>

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
  if (!symbol || isNaN(quantity) || quantity <= 0 || isNaN(price) || price <= 0) {
    return alert("Invalid input: Quantity and Price must be positive numbers.");
  }
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
  if (!symbol || isNaN(quantity) || quantity <= 0 || isNaN(price) || price <= 0) {
    return alert("Invalid input: Quantity and Price must be positive numbers.");
  }

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
function quickBuy(symbol, price) {
  const quantity = prompt(`Enter quantity to BUY for ${symbol}:`);
  const qty = parseInt(quantity);

  if (isNaN(qty) || qty <= 0) return alert("Invalid quantity");

  const cost = qty * price;
  if (netWorth < cost) return alert(`Insufficient funds. You need ₹${cost}, but have ₹${netWorth}.`);

  fetch('/api/stocks/buy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symbol, quantity: qty, price })
  }).then(() => {
    if (!holdings[symbol]) holdings[symbol] = { quantity: 0, avgPrice: 0 };

    const totalQty = holdings[symbol].quantity + qty;
    holdings[symbol].avgPrice = ((holdings[symbol].avgPrice * holdings[symbol].quantity) + (price * qty)) / totalQty;
    holdings[symbol].quantity = totalQty;

    netWorth -= cost;
    persistData();

    document.getElementById('netValue').innerText = netWorth.toFixed(2);
  }).catch(err => alert('Error updating backend:', err));
}


function quickSell(symbol, price) {
  const quantity = prompt(`Enter quantity to SELL for ${symbol}:`);
  const qty = parseInt(quantity);

  if (isNaN(qty) || qty <= 0) return alert("Invalid quantity");
  if (!holdings[symbol] || holdings[symbol].quantity < qty) return alert("Not enough shares to sell.");

  fetch('/api/stocks/sell', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symbol, quantity: qty, price })
  }).then(() => {
    holdings[symbol].quantity -= qty;
    if (holdings[symbol].quantity === 0) holdings[symbol].avgPrice = 0;

    netWorth += qty * price;
    persistData();

    document.getElementById('netValue').innerText = netWorth.toFixed(2);
  }).catch(err => alert('Error updating backend:', err));
}


function persistData() {
  localStorage.setItem('holdings', JSON.stringify(holdings));
  localStorage.setItem('netWorth', netWorth.toFixed(2));
}

// Attach checkbox change listeners
document.querySelectorAll('.typeFilter, .sectorFilter').forEach(cb => {
  cb.addEventListener('change', renderFilteredStocks);
});
function updatePortfolioSummary() {
  let s1 = 0; // total invested
  let s2 = 0; // current value

  for (const symbol in holdings) {
    const { quantity, avgPrice } = holdings[symbol];
    if (quantity <= 0) continue;

    const stock = allStocks.find(s => s.symbol === symbol);
    if (!stock) continue;

    const currentPrice = parseFloat(stock.current_price);
    if (isNaN(currentPrice)) continue;

    s1 += avgPrice * quantity;
    s2 += currentPrice * quantity;
  }

  const diff = s2 - s1;
  const status = diff > 0 ? 
  `<span style="color:green;">&#9650; ₹${diff.toFixed(2)}</span>` : // ▲
  diff < 0 ?
  `<span style="color:red;">&#9660; ₹${Math.abs(diff).toFixed(2)}</span>` : // ▼
  `<span style="color:gray;">No Profit, No Loss</span>`;


  document.getElementById('portfolioSummary').innerHTML = `
    Invested: ₹${s1.toFixed(2)} | Current Value: ₹${s2.toFixed(2)} | ${status}
  `;
}

// === GTT Modal Handlers ===
function openGTTModal(symbol, currentPrice) {
  document.getElementById('gttSymbol').textContent = symbol;
  document.getElementById('gttBuyPrice').value = currentPrice;
  // document.getElementById('gttSellPrice').value = currentPrice;
  document.getElementById('gttQty').value = 1;
  document.getElementById('gttModal').style.display = 'block';
}

function closeGTTModal() {
  document.getElementById('gttModal').style.display = 'none';
}

function placeGTTOrder() {
  const symbol = document.getElementById('gttSymbol').textContent;
  const qty = parseInt(document.getElementById('gttQty').value);
  const buyPrice = parseFloat(document.getElementById('gttBuyPrice').value);
  // const sellPrice = parseFloat(document.getElementById('gttSellPrice').value);

  if (isNaN(qty) || qty <= 0 || isNaN(buyPrice) ) {
    alert("Please enter valid values for quantity, buy price, and sell price.");
    return;
  }

  closeGTTModal();
  alert(`⏳ GTT Buy order placed for ${symbol} @ ₹${buyPrice}`);

  triggerBuyOrder(symbol, buyPrice, qty, () => {
    alert(`✅ Bought ${symbol} at or below ₹${buyPrice}. Watching to sell at ₹${sellPrice}`);
    // triggerSellOrder(symbol, sellPrice, qty);
  });
}

function triggerBuyOrder(symbol, targetPrice, qty = 1, onSuccess) {
  const startTime = Date.now();

  const interval = setInterval(() => {
    const currentPrice = getCurrentPrice(symbol);

    if (currentPrice <= targetPrice) {
      clearInterval(interval);
      executeBuy(symbol, currentPrice, qty);
      if (typeof onSuccess === 'function') onSuccess(); // Now triggers sell
    } else if (Date.now() - startTime >= 60000) {
      clearInterval(interval);
      alert(`❌ Buy order for ${symbol} expired. Target ₹${targetPrice} not reached.`);
    }
  }, 1000);
}


// === Trigger Sell with Fallback Execution at 59s ===
// function triggerSellOrder(symbol, targetPrice, qty = 1) {
//   const startTime = Date.now();

//   const interval = setInterval(() => {
//     const currentPrice = getCurrentPrice(symbol);

//     if (currentPrice >= targetPrice) {
//       clearInterval(interval);
//       executeSell(symbol, currentPrice, qty);
//       alert(`✅ Sold ${symbol} @ ₹${currentPrice}`);
//     } else if (Date.now() - startTime >= 59000) {
//       clearInterval(interval);
//       const fallbackPrice = getCurrentPrice(symbol);
//       executeSell(symbol, fallbackPrice, qty);
//       alert(`⚠️ Sell target ₹${targetPrice} not hit. Fallback sell at ₹${fallbackPrice}`);
//     }
//   }, 1000);
// }


// === Helpers ===
function getCurrentPrice(symbol) {
  const stock = allStocks.find(s => s.symbol === symbol);
  return stock ? parseFloat(stock.current_price) : 0;
}


// === Buy Logic ===
function executeBuy(symbol, price, qty) {
  const cost = qty * price;
  if (netWorth < cost) return alert(`❌ GTT Buy Failed: Need ₹${cost}, but only ₹${netWorth} available.`);

  fetch('/api/stocks/buy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symbol, quantity: qty, price })
  }).then(() => {
    if (!holdings[symbol]) holdings[symbol] = { quantity: 0, avgPrice: 0 };

    const totalQty = holdings[symbol].quantity + qty;
    holdings[symbol].avgPrice = ((holdings[symbol].avgPrice * holdings[symbol].quantity) + (price * qty)) / totalQty;
    holdings[symbol].quantity = totalQty;

    netWorth -= cost;
    persistData();
    document.getElementById('netValue').innerText = netWorth.toFixed(2);
    updatePortfolioSummary();
  }).catch(err => alert('GTT Buy Error: ' + err));
}

// === Sell Logic ===
// function executeSell(symbol, price, qty) {
//   if (!holdings[symbol] || holdings[symbol].quantity < qty) {
//     return alert(`❌ GTT Sell Failed: Not enough shares of ${symbol}`);
//   }

//   fetch('/api/stocks/sell', {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({ symbol, quantity: qty, price })
//   }).then(() => {
//     holdings[symbol].quantity -= qty;
//     if (holdings[symbol].quantity === 0) holdings[symbol].avgPrice = 0;

//     netWorth += qty * price;
//     persistData();
//     document.getElementById('netValue').innerText = netWorth.toFixed(2);
//     updatePortfolioSummary();
//     alert(`💰 ${symbol} sold at ₹${price}. Portfolio updated.`);
//   }).catch(err => alert('GTT Sell Error: ' + err));
// }






// 🔁 Initial trigger
fetchStocks();
