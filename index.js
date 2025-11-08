import express from "express";
import fetch from "node-fetch";

const app = express();
const SECRET_KEY = process.env.KEY_NAME;

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
});

app.use((req, res, next) => {
  if (req.query.key !== SECRET_KEY) {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
});

app.get("/v1/assets/:assetId/bundles", async (req, res) => {
  const { assetId } = req.params;
  const url = `https://catalog.roblox.com/v1/assets/${assetId}/bundles`;
  const data = await fetch(url).then(r => r.json());
  res.json(data);
});

app.get("/v1/catalog/items/:assetId/details", async (req, res) => {
  const { assetId } = req.params;
  const url = `https://catalog.roblox.com/v1/catalog/items/${assetId}/details?itemType=Asset`;
  const data = await fetch(url).then(r => r.json());
  res.json(data);
});

app.listen(3000);
