import express from "express";
import fetch from "node-fetch";

const app = express();

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
});

app.get("/v1/assets/:assetId/bundles", async (req, res) => {
  const { assetId } = req.params;
  const url = `https://catalog.roblox.com/v1/assets/${assetId}/bundles`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/v1/catalog/items/:assetId/details", async (req, res) => {
  const { assetId } = req.params;
  const url = `https://catalog.roblox.com/v1/catalog/items/${assetId}/details?itemType=Asset`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => console.log("Proxy ready"));
