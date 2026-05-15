// ─────────────────────────────────────────────────
//  XAUUSD Gold Terminal — Express Server
//  Proxies Anthropic API calls server-side so the
//  API key is never exposed to the browser.
// ─────────────────────────────────────────────────
'use strict';

require('dotenv').config();

const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');
const path       = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── SECURITY ──────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:  ["'self'"],
      scriptSrc:   ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
      styleSrc:    ["'self'", "'unsafe-inline'", "fonts.googleapis.com", "fonts.gstatic.com"],
      fontSrc:     ["'self'", "fonts.gstatic.com"],
      connectSrc:  ["'self'", "api.metals.live", "api.gold-api.com"],
      imgSrc:      ["'self'", "data:"],
    },
  },
}));

app.use(cors({ origin: process.env.NODE_ENV === 'production' ? false : '*' }));
app.use(express.json({ limit: '10kb' }));

// ── RATE LIMITING ─────────────────────────────────
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { error: 'Too many AI requests. Please wait 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const priceLimiter = rateLimit({
  windowMs: 60 * 1000,   // 1 minute
  max: 30,
  message: { error: 'Too many price requests.' },
});

// ── STATIC FILES ──────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ── HEALTH CHECK ──────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    hasKey: !!process.env.ANTHROPIC_API_KEY,
    env: process.env.NODE_ENV || 'development',
  });
});

// ── GOLD PRICE PROXY ──────────────────────────────
// Fetches live gold price server-side to avoid CORS issues
app.get('/api/price', priceLimiter, async (req, res) => {
  const sources = [
    { url: 'https://api.metals.live/v1/spot/gold', parse: d => d?.price ? +d.price : null },
    { url: 'https://api.gold-api.com/price/XAU',   parse: d => d?.price ? +d.price : null },
  ];

  for (const src of sources) {
    try {
      const r = await fetch(src.url, { signal: AbortSignal.timeout(4000) });
      if (!r.ok) continue;
      const data = await r.json();
      const price = src.parse(data);
      if (price && price > 100) {
        return res.json({ price, source: src.url, live: true, ts: Date.now() });
      }
    } catch (_) {}
  }

  // Fallback with realistic simulated price
  const base = 5155;
  const noise = (Math.random() - 0.5) * 40;
  res.json({ price: +(base + noise).toFixed(2), live: false, ts: Date.now() });
});

// ── AI ANALYSIS PROXY ─────────────────────────────
// Keeps the Anthropic API key server-side only
app.post('/api/ai', aiLimiter, async (req, res) => {
  // Key comes from env — NEVER from the client
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey || apiKey === 'sk-ant-api03-your-key-here') {
    return res.status(503).json({
      error: 'AI analysis unavailable — ANTHROPIC_API_KEY not configured on server. Add it to your .env file or Vercel environment variables.',
    });
  }

  const { prompt, model = 'claude-sonnet-4-20250514', max_tokens = 1000 } = req.body;

  if (!prompt || typeof prompt !== 'string' || prompt.length > 2000) {
    return res.status(400).json({ error: 'Invalid prompt.' });
  }

  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':    'application/json',
        'x-api-key':       apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (anthropicRes.status === 401) {
      return res.status(401).json({ error: 'Invalid Anthropic API key on server. Check ANTHROPIC_API_KEY in your environment.' });
    }
    if (!anthropicRes.ok) {
      const errBody = await anthropicRes.text();
      return res.status(anthropicRes.status).json({ error: `Anthropic API error: ${anthropicRes.status}`, detail: errBody });
    }

    const data = await anthropicRes.json();
    const text = data.content?.map(b => b.text || '').join('') || '';
    res.json({ text, model: data.model, usage: data.usage });

  } catch (err) {
    if (err.name === 'TimeoutError') {
      return res.status(504).json({ error: 'AI request timed out. Please try again.' });
    }
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// ── CATCH-ALL → index.html ────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── START ─────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`\n⚜  XAUUSD Gold Terminal running on http://localhost:${PORT}`);
    console.log(`   AI Key: ${process.env.ANTHROPIC_API_KEY ? '✓ Configured' : '✗ Missing — add ANTHROPIC_API_KEY to .env'}`);
    console.log(`   Env:    ${process.env.NODE_ENV || 'development'}\n`);
  });
}

module.exports = app;
