// Simple Cal.com proxy server for local development
import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const CALCOM_API_BASE = 'https://api.cal.com/v1';

app.use(cors());
app.use(express.json());

// Helper to mask API key for logging
const maskApiKey = (key) => key ? `${key.substring(0, 4)}...${key.substring(key.length - 4)}` : 'none';

// Proxy GET /bookings?username=...&... to Cal.com
app.get('/bookings', async (req, res) => {
  try {
    const { apiKey, ...query } = req.query;
    console.log(`[PROXY] /bookings request - Username: ${query.username}, API Key: ${maskApiKey(apiKey)}`);
    console.log(`[PROXY] Query params:`, query);
    
    if (!apiKey) {
      console.log('[PROXY] Error: Missing apiKey in query params');
      return res.status(400).json({ error: 'Missing apiKey in query params' });
    }
    
    const url = new URL(CALCOM_API_BASE + '/bookings');
    Object.entries(query).forEach(([k, v]) => url.searchParams.append(k, v));
    // Add apiKey to Cal.com request
    url.searchParams.append('apiKey', apiKey);
    
    console.log(`[PROXY] Calling Cal.com API: ${url.toString()}`);
    
    const calRes = await fetch(url.toString(), {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log(`[PROXY] Cal.com response status: ${calRes.status} ${calRes.statusText}`);
    
    const data = await calRes.json();
    console.log(`[PROXY] Cal.com response body:`, JSON.stringify(data, null, 2));
    
    res.status(calRes.status).json(data);
  } catch (err) {
    console.error('[PROXY] Proxy error (bookings):', err);
    res.status(500).json({ error: 'Proxy error', details: err.message });
  }
});

// Proxy GET /event-types?username=... to Cal.com
app.get('/event-types', async (req, res) => {
  try {
    const { apiKey, ...query } = req.query;
    console.log(`[PROXY] /event-types request - Username: ${query.username}, API Key: ${maskApiKey(apiKey)}`);
    console.log(`[PROXY] Query params:`, query);
    
    if (!apiKey) {
      console.log('[PROXY] Error: Missing apiKey in query params');
      return res.status(400).json({ error: 'Missing apiKey in query params' });
    }
    
    const url = new URL(CALCOM_API_BASE + '/event-types');
    Object.entries(query).forEach(([k, v]) => url.searchParams.append(k, v));
    // Add apiKey to Cal.com request
    url.searchParams.append('apiKey', apiKey);
    
    console.log(`[PROXY] Calling Cal.com API: ${url.toString()}`);
    
    const calRes = await fetch(url.toString(), {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log(`[PROXY] Cal.com response status: ${calRes.status} ${calRes.statusText}`);
    
    const data = await calRes.json();
    console.log(`[PROXY] Cal.com response body:`, JSON.stringify(data, null, 2));
    
    res.status(calRes.status).json(data);
  } catch (err) {
    console.error('[PROXY] Proxy error (event-types):', err);
    res.status(500).json({ error: 'Proxy error', details: err.message });
  }
});

// Health check
app.get('/', (req, res) => {
  res.send('Cal.com Proxy Server is running');
});

app.listen(PORT, () => {
  console.log(`Cal.com proxy server running on http://localhost:${PORT}`);
}); 