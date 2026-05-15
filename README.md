# ⚜ XAUUSD Gold Terminal — Node.js + Vercel

Professional XAUUSD dashboard with **candlestick charts**, live gold price, technical indicators, and **Claude AI weekly analysis** — built on Node.js/Express with a secure server-side API proxy. Deploy to Vercel in one command.

---

## ✨ Features

| Feature | Detail |
|---------|--------|
| 📈 Candlestick chart | Canvas-drawn, gradient bodies, wicks, crosshair tooltip |
| ⏱ 5 timeframes | 1H · 4H · 1D · 1W · 1M |
| 📊 Chart modes | Candle / Line toggle |
| 📉 Volume bars | Color-coded by candle direction |
| 🔢 OHLC bar | Live Open / High / Low / Close / Change / Volume |
| 📡 Live gold price | Fetched server-side via `/api/price` (no CORS issues) |
| 🤖 AI analysis | Claude-powered weekly outlook via secure `/api/ai` proxy |
| 🔒 Secure key | `ANTHROPIC_API_KEY` lives only in server env — never in browser |
| 🛡 Rate limiting | 20 AI requests / 15 min · 30 price requests / min |
| 🚀 Vercel ready | `vercel.json` pre-configured, deploy with one command |

---

## 📁 Project Structure

```
xauusd-gold-terminal/
├── server.js          ← Express server + API proxy routes
├── package.json       ← Dependencies & scripts
├── vercel.json        ← Vercel deployment config
├── .env.example       ← Environment variable template
├── .gitignore         ← Excludes .env and node_modules
├── README.md
└── public/
    └── index.html     ← Full dashboard (candlestick chart + AI)
```

---

## 🚀 Quick Start — Local Development

### 1. Clone & install
```bash
git clone https://github.com/YOUR_USERNAME/xauusd-gold-terminal.git
cd xauusd-gold-terminal
npm install
```

### 2. Set up environment variables
```bash
cp .env.example .env
```
Open `.env` and add your Anthropic API key:
```
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
PORT=3000
NODE_ENV=development
```
Get your key at [console.anthropic.com](https://console.anthropic.com)

### 3. Run the server
```bash
# Development (auto-restart on file changes)
npm run dev

# Production
npm start
```

### 4. Open in browser
```
http://localhost:3000
```

The header badge will show **● AI READY** when your API key is configured correctly.

---

## ☁️ Deploy to Vercel

### Option A — Vercel CLI (fastest)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy (follow prompts)
vercel

# Set your API key as a secret environment variable
vercel env add ANTHROPIC_API_KEY
# Paste your key when prompted

# Deploy to production
vercel --prod
```

### Option B — GitHub + Vercel Dashboard
1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **New Project** → Import your repo
3. In **Environment Variables**, add:
   - Key: `ANTHROPIC_API_KEY`
   - Value: `sk-ant-api03-your-key-here`
4. Click **Deploy**

Your app will be live at `https://your-project.vercel.app`

---

## 🔒 Security Architecture

```
Browser                    Node.js Server              External APIs
  │                              │                           │
  │── GET /api/price ──────────► │── fetch metals.live ─────►│
  │◄─ { price, live } ──────────│◄─ { price } ──────────────│
  │                              │                           │
  │── POST /api/ai ─────────────►│                           │
  │   { prompt }                 │── fetch api.anthropic.com ►│
  │                              │   Authorization: ANTHROPIC_API_KEY (server only)
  │◄─ { text } ─────────────────│◄─ { content } ────────────│
  │                              │                           │
```

**The Anthropic API key is never sent to or stored in the browser.** It lives only in the server's environment variables (`.env` locally, Vercel env vars in production).

---

## 🛣 API Routes

| Method | Route | Description | Rate Limit |
|--------|-------|-------------|------------|
| `GET` | `/api/health` | Server status + key check | None |
| `GET` | `/api/price` | Live gold spot price | 30 req/min |
| `POST` | `/api/ai` | Claude AI analysis proxy | 20 req/15min |
| `GET` | `/*` | Serves `public/index.html` | None |

### `/api/health` response
```json
{
  "status": "ok",
  "timestamp": "2026-03-11T12:00:00.000Z",
  "hasKey": true,
  "env": "production"
}
```

### `/api/ai` request body
```json
{
  "prompt": "Your analysis prompt here (max 2000 chars)"
}
```

### `/api/ai` response
```json
{
  "text": "Claude's analysis...",
  "model": "claude-sonnet-4-20250514",
  "usage": { "input_tokens": 150, "output_tokens": 320 }
}
```

---

## 📦 Dependencies

| Package | Purpose |
|---------|---------|
| `express` | Web server & routing |
| `dotenv` | Load `.env` file |
| `cors` | Cross-origin headers |
| `helmet` | Security HTTP headers |
| `express-rate-limit` | Protect API endpoints |
| `nodemon` (dev) | Auto-restart on file changes |

> **Note:** `node-fetch` is not needed — Node.js 18+ has native `fetch()` built in.

---

## 🖥 Dashboard Features

### Candlestick Chart
- **5 timeframes:** 1H, 4H, 1D, 1W, 1M — each generates its own candle data
- **Candle / Line** mode toggle
- Gradient-filled bodies (green = bullish, red = bearish)
- Upper and lower wicks
- Hover **crosshair** + floating tooltip (O/H/L/C/Change)
- **Current price** dashed reference line with live price label
- **Volume bars** below chart, color-coded by direction
- **OHLC bar** with live values above chart

### Technical Indicators
- RSI (14), MACD, Stochastic, CCI (20), ATR (14), Momentum
- Moving Averages: EMA 9, MA 20/50/100/200

### Analysis Grid
- Resistance levels: R1, R2, R3, Pivot
- Support levels: S1, S2, S3, Demand Zone
- Market sentiment gauge + signal (STRONG BUY → CAUTION)

### AI Weekly Outlook
- Powered by `claude-sonnet-4-20250514`
- Sends live price + last 5 candles as context
- Structured 3-section report: Technical / Fundamental / Trading Scenarios
- API key **never exposed** — all calls via server proxy

---

## ⚙️ Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes (for AI) | Your Claude API key |
| `PORT` | No | Server port (default: 3000) |
| `NODE_ENV` | No | `development` or `production` |

---

## ⚠️ Disclaimer

For informational and educational purposes only. Not financial advice. Always do your own research before trading.
