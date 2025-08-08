const sampleHoldings = [
  { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Tech', type_of_play: 'Long-Term', volume: 1800000, market_cap: 1800000000000 },
  { symbol: 'AMZN', name: 'Amazon.com', sector: 'Retail', type_of_play: 'Swing', volume: 2100000, market_cap: 1700000000000 },
  { symbol: 'MSFT', name: 'Microsoft', sector: 'Tech', type_of_play: 'Intraday', volume: 23000000, market_cap: 2500000000000 },
  { symbol: 'IBM', name: 'IBM', sector: 'Tech', type_of_play: 'Long-Term', volume: 4800000, market_cap: 125000000000 },
  { symbol: 'INTC', name: 'Intel', sector: 'Tech', type_of_play: 'Swing', volume: 8700000, market_cap: 150000000000 },
  { symbol: 'NVDA', name: 'NVIDIA', sector: 'Tech', type_of_play: 'Intraday', volume: 20000000, market_cap: 2150000000000 },
  { symbol: 'META', name: 'Meta Platforms', sector: 'Tech', type_of_play: 'Swing', volume: 19000000, market_cap: 900000000000 },
  { symbol: 'PYPL', name: 'PayPal', sector: 'Finance', type_of_play: 'Intraday', volume: 5600000, market_cap: 82000000000 },
  { symbol: 'CRM', name: 'Salesforce', sector: 'Tech', type_of_play: 'Long-Term', volume: 4800000, market_cap: 245000000000 },
  { symbol: 'KO', name: 'Coca-Cola', sector: 'Consumer', type_of_play: 'Swing', volume: 6400000, market_cap: 260000000000 },
  { symbol: 'VZ', name: 'Verizon', sector: 'Telecom', type_of_play: 'Intraday', volume: 6200000, market_cap: 135000000000 },
  { symbol: 'WMT', name: 'Walmart', sector: 'Retail', type_of_play: 'Long-Term', volume: 5800000, market_cap: 430000000000 },
  { symbol: 'JPM', name: 'JPMorgan', sector: 'Finance', type_of_play: 'Swing', volume: 7500000, market_cap: 560000000000 },
  { symbol: 'HSBC', name: 'HSBC Holdings plc', sector: 'Banking', type_of_play: 'Long-Term', volume: 800000, market_cap: 160000000000 },
  { symbol: 'JSWSTEEL', name: 'JSW Steel Ltd.', sector: 'Metals', type_of_play: 'Swing', volume: 950000, market_cap: 20000000000 },
  { symbol: 'TCS', name: 'Tata Consultancy Services', sector: 'IT', type_of_play: 'Long-Term', volume: 1100000, market_cap: 150000000000 },
  { symbol: 'INFY', name: 'Infosys Ltd.', sector: 'IT', type_of_play: 'Swing', volume: 1000000, market_cap: 90000000000 },
  { symbol: 'RELIANCE', name: 'Reliance Industries', sector: 'Energy', type_of_play: 'Long-Term', volume: 1800000, market_cap: 230000000000 }
];

// Local storage
let holdings = JSON.parse(localStorage.getItem('holdings')) || {};
let netWorth = parseFloat(localStorage.getItem('netWorth')) || 100000;
document.getElementById('netValue').innerText = netWorth.toFixed(2);

function persistData() {
  localStorage.setItem('holdings', JSON.stringify(holdings));
  localStorage.setItem('netWorth', netWorth.toFixed(2));
}

function formatBigNumber(num) {
  if (num >= 1e12) return (num / 1e12).toFixed(1) + 'T';
  if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
  return num.toLocaleString();
}

function genHistory() {
  const data = [];
  let price = 100;
  for (let year = 2005; year <= 2025; year++) {
    const change = (Math.random() - 0.5) * 0.2;
    price = Math.max(10, price * (1 + change));
    data.push({ year, price: parseFloat(price.toFixed(2)) });
  }
  return data;
}

// === Bubble Chart with Aqua Tooltip ===
function createBubbleChart() {
  const width = 1200;
  const height = 700;

  const svg = d3.select("#bubbleChart").append("svg")
    .attr("width", width)
    .attr("height", height)
    .style("overflow", "visible");

  // Tooltip creation
  const tooltip = d3.select("body").append("div")
    .attr("id", "bubbleTooltip")
    .style("position", "absolute")
    .style("background", "rgba(0,198,255,0.95)")
    .style("color", "#fff")
    .style("padding", "8px 12px")
    .style("border-radius", "8px")
    .style("box-shadow", "0 4px 12px rgba(0,0,0,0.3)")
    .style("pointer-events", "none")
    .style("font-size", "14px")
    .style("font-weight", "500")
    .style("opacity", 0);

  // Gradient definitions
  const defs = svg.append("defs");
  const gradients = [
    ["#B5FFFC", "#A9F5FF"],
    ["#D7FFFE", "#E3FDFD"],
    ["#BEE3F8", "#C3DAFE"],
    ["#CFFAFE", "#E0F2FE"],
    ["#D6EFFF", "#BEE9FF"],
    ["#E0F7FA", "#B2EBF2"]
  ];

  sampleHoldings.forEach((d, i) => {
    const grad = defs.append("linearGradient")
      .attr("id", `grad-${d.symbol}`)
      .attr("x1", "0%").attr("y1", "0%")
      .attr("x2", "100%").attr("y2", "100%");
    grad.append("stop").attr("offset", "0%").attr("stop-color", gradients[i % gradients.length][0]);
    grad.append("stop").attr("offset", "100%").attr("stop-color", gradients[i % gradients.length][1]);
  });

  const pack = d3.pack()
    .size([width, height])
    .padding(15);

  const root = d3.hierarchy({ children: sampleHoldings })
    .sum(d => d.market_cap);

  const nodes = pack(root).leaves();

  const node = svg.selectAll("g")
    .data(nodes)
    .enter().append("g")
    .attr("transform", d => `translate(${d.x},${d.y})`);

  // Circles
  node.append("circle")
    .attr("r", 0)
    .style("fill", d => `url(#grad-${d.data.symbol})`)
    .style("stroke", "#fff")
    .style("stroke-width", 2)
    .style("filter", "drop-shadow(0 4px 10px rgba(0,0,0,0.3))")
    .transition()
    .duration(800)
    .attr("r", d => d.r);

  // Logos
  node.append("image")
    .attr("xlink:href", d => `https://logo.clearbit.com/${d.data.symbol.toLowerCase()}.com`)
    .attr("x", d => -d.r / 2)
    .attr("y", d => -d.r / 2)
    .attr("width", d => d.r)
    .attr("height", d => d.r)
    .style("clip-path", d => `circle(${d.r / 2}px)`)
    .style("opacity", 0.85);

  // Hover effect with tooltip
  node.on("mouseover", function (event, d) {
    d3.select(this).select("circle")
      .transition().duration(200)
      .attr("r", d.r * 1.05)
      .style("filter", "drop-shadow(0 0 15px rgba(0,198,255,0.9))");

    tooltip
      .style("opacity", 1)
      .html(`<b>${d.data.name}</b><br><span style="opacity:0.9">${d.data.symbol}</span>`);
  })
  .on("mousemove", function (event) {
    tooltip
      .style("left", (event.pageX + 15) + "px")
      .style("top", (event.pageY - 30) + "px");
  })
  .on("mouseout", function (event, d) {
    d3.select(this).select("circle")
      .transition().duration(200)
      .attr("r", d.r)
      .style("filter", "drop-shadow(0 4px 10px rgba(0,0,0,0.3))");

    tooltip.style("opacity", 0);
  });

  // Click event
  node.on("click", (event, d) => openModal(d.data));
}

// === Modal Logic ===
const modal = document.getElementById('stockModal');
const spanClose = modal.querySelector('.close');
let modalChartInstance = null;
let selectedStock = null;

spanClose.onclick = () => modal.style.display = 'none';
window.onclick = e => { if (e.target == modal) modal.style.display = 'none'; };

async function openModal(stock) {
  selectedStock = stock;
  document.getElementById('modalSymbol').innerText = `${stock.name} (${stock.symbol})`;
  document.getElementById('modalSector').innerText = stock.sector;
  document.getElementById('modalPlay').innerText = stock.type_of_play;
  document.getElementById('modalVolume').innerText = formatBigNumber(stock.volume);
  document.getElementById('modalMarketCap').innerText = '₹' + formatBigNumber(stock.market_cap);

  try {
    const res = await fetch(`/api/stocks/${stock.symbol}`);
    const stockDetails = await res.json();
    document.getElementById("modalCurrentPrice").textContent = `₹${stockDetails.current_price}`;
  } catch {
    document.getElementById("modalCurrentPrice").textContent = 'Unavailable';
  }

  const history = genHistory();
  const labels = history.map(p => p.year);
  const prices = history.map(p => p.price);
  const ctx = document.getElementById('modalChart').getContext('2d');

  if (modalChartInstance) modalChartInstance.destroy();
  modalChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: `${stock.symbol} Price (₹)`,
        data: prices,
        borderColor: '#00c6ff',
        backgroundColor: 'rgba(0,198,255,0.1)',
        tension: 0.3
      }]
    }
  });

  modal.style.display = 'flex';
}
// document.getElementById('buyBtn').onclick = function () {
//   const qty = parseInt(document.getElementById('buyQty').value);
//   const price = parseFloat(document.getElementById('buyPrice').value);
//   if (isNaN(qty) || isNaN(price)) return alert("Invalid input");

//   const cost = qty * price;
//   if (netWorth < cost) return alert(`Not enough funds. You need ₹${cost}, have ₹${netWorth}.`);

//   fetch('/api/stocks/buy', {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({ symbol: selectedStock.symbol, quantity: qty, price })
//   }).then(() => {
//     if (!holdings[selectedStock.symbol]) holdings[selectedStock.symbol] = { quantity: 0, avgPrice: 0 };

//     const current = holdings[selectedStock.symbol];
//     const totalQty = current.quantity + qty;
//     current.avgPrice = ((current.avgPrice * current.quantity) + (price * qty)) / totalQty;
//     current.quantity = totalQty;

//     netWorth -= cost;
//     persistData();
//     alert(`Bought ${qty} shares of ${selectedStock.symbol}`);
//   });
// };

// document.getElementById('sellBtn').onclick = function () {
//   const qty = parseInt(document.getElementById('sellQty').value);
//   const price = parseFloat(document.getElementById('sellPrice').value);
//   if (isNaN(qty) || isNaN(price)) return alert("Invalid input");

//   const current = holdings[selectedStock.symbol];
//   if (!current || current.quantity < qty) return alert("You don't have enough shares.");

//   fetch('/api/stocks/sell', {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({ symbol: selectedStock.symbol, quantity: qty, price })
//   }).then(() => {
//     current.quantity -= qty;
//     if (current.quantity === 0) current.avgPrice = 0;

//     netWorth += qty * price;
//     persistData();
//     alert(`Sold ${qty} shares of ${selectedStock.symbol}`);
//   });
// };

// Init chart
createBubbleChart();
