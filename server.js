// server.js — Railway proxy for Dust API
const express = require("express");
const app = express();

app.use(express.json());

// CORS headers for all requests
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Dust-Api-Key");
  if (req.method === "OPTIONS") return res.status(200).end();
  next();
});

// Proxy route — forwards any path to Dust
app.all("/api/dust", async (req, res) => {
  const { path } = req.query;
  if (!path) return res.status(400).json({ error: "Missing path parameter" });

  // Accept key from Authorization header OR from X-Dust-Api-Key header
  let apiKey = req.headers["x-dust-api-key"];
  if (!apiKey) {
    const authHeader = req.headers["authorization"] ?? "";
    apiKey = authHeader.replace(/^Bearer\s+/i, "").trim();
  }
  if (!apiKey) return res.status(401).json({ error: "Missing Dust API key" });

  const dustUrl = `https://dust.tt/api/v1${decodeURIComponent(path)}`;

  try {
    const dustRes = await fetch(dustUrl, {
      method: req.method === "OPTIONS" ? "GET" : req.method,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: req.method !== "GET" ? JSON.stringify(req.body) : undefined,
    });

    const data = await dustRes.json();
    return res.status(dustRes.status).json(data);
  } catch (e) {
    return res.status(500).json({ error: `Proxy error: ${e.message}` });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Dust proxy running on port ${PORT}`));
