import express from "express";

const app = express();
const SECRET_KEY = process.env.SECRET_KEY;

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-api-key");
  next();
});

app.options("*", (req, res) => {
  res.status(204).end();
});

app.use((req, res, next) => {
  if (req.query.key !== SECRET_KEY) {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
});

async function proxyPassThrough(res, upstreamUrl, ttlSeconds) {

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 7000);

  try {
    const upstream = await fetch(upstreamUrl, { signal: ctrl.signal, redirect: "follow" });


    res.setHeader(
      "Cache-Control",
      `public, max-age=0, s-maxage=${ttlSeconds}, stale-while-revalidate=86400`
    );

    const ct = upstream.headers.get("content-type");
    if (ct) res.setHeader("Content-Type", ct);

    res.status(200);

    if (upstream.body) {

      upstream.body.pipe(res);
      return;
    }

    const text = await upstream.text();
    res.send(text);
  } catch (err) {
    res.status(502).json({ error: err?.message || "Upstream error" });
  } finally {
    clearTimeout(t);
  }
}

// ✅ /v1/assets/:assetId/bundles
app.get("/v1/assets/:assetId/bundles", async (req, res) => {
  const { assetId } = req.params;
  const url = `https://catalog.roblox.com/v1/assets/${assetId}/bundles`;

  await proxyPassThrough(res, url, 3600);
});

// ✅ /v1/catalog/items/:assetId/details
app.get("/v1/catalog/items/:assetId/details", async (req, res) => {
  const { assetId } = req.params;
  const url = `https://catalog.roblox.com/v1/catalog/items/${assetId}/details?itemType=Asset`;

  await proxyPassThrough(res, url, 1800);
});

export default app;

if (!process.env.VERCEL) {
  app.listen(3000, () => console.log("Proxy running on port 3000"));
}
