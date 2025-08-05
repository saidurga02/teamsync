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

// === Local storage data ===
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

// === Bubble chart with bigger size and filled logos ===
function createBubbleChart() {
  const width = 1200;
  const height = 700;
  const svg = d3.select("#bubbleChart").append("svg")
    .attr("width", width)
    .attr("height", height);

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

  node.append("clipPath")
    .attr("id", d => `clip-${d.data.symbol}`)
    .append("circle")
    .attr("r", d => d.r);

  node.append("circle")
    .attr("r", d => d.r)
    .style("fill", "#eee")
    .style("stroke", "#083d77")
    .style("stroke-width", 2)
    .on("click", (event, d) => openModal(d.data));

  node.append("image")
    .attr("xlink:href", d => `https://logo.clearbit.com/${d.data.symbol.toLowerCase()}.com`)
    .attr("x", d => -d.r)
    .attr("y", d => -d.r)
    .attr("width", d => d.r * 2)
    .attr("height", d => d.r * 2)
    .attr("clip-path", d => `url(#clip-${d.data.symbol})`)
    .on("click", (event, d) => openModal(d.data));
}



// === Stock modal logic ===
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
        borderColor: '#2196f3',
        backgroundColor: 'rgba(33, 150, 243, 0.1)',
        tension: 0.3
      }]
    }
  });

  modal.style.display = 'flex';
}

// === Init charts ===
createBubbleChart();

