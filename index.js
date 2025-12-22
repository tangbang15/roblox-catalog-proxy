import express from "express";
import fetch from "node-fetch";

const app = express();
const SECRET_KEY = process.env.SECRET_KEY;

// --- CORS ---
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-api-key");
  next();
});

app.options("*", (req, res) => res.status(204).end());

// --- Auth แบบเดิม: ?key=... ---
app.use((req, res, next) => {
  if (req.query.key !== SECRET_KEY) {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
});

// ---- helper: pass-through แบบไม่ parse json + cache ----
async function proxyText(res, upstreamUrl, ttlSeconds) {
  try {
    const response = await fetch(upstreamUrl, {
      // กันค้าง
      timeout: 7000,
      redirect: "follow",
    });

    // ส่ง content-type ตรงจาก upstream
    const ct = response.headers.get("content-type");
    if (ct) res.setHeader("Content-Type", ct);

    // CDN cache บน Vercel
    res.setHeader(
      "Cache-Control",
      `public, max-age=0, s-maxage=${ttlSeconds}, stale-while-revalidate=86400`
    );

    // สำคัญ: เพื่อ “เหมือนเดิม” กับโค้ดเก่าคุณ
    // โค้ดเก่าจะส่ง 200 เสมอถ้า fetch สำเร็จ แม้ upstream จะ error json
    res.status(200);

    // ดึงเป็น text แล้วส่งออก (ไม่ JSON.parse / ไม่ stringify)
    const text = await response.text();
    res.send(text);
  } catch (err) {
    res.status(502).json({ error: err?.message || "Upstream error" });
  }
}

// ✅ /v1/assets/:assetId/bundles
app.get("/v1/assets/:assetId/bundles", async (req, res) => {
  const { assetId } = req.params;
  const url = `https://catalog.roblox.com/v1/assets/${assetId}/bundles`;

  // bundles เปลี่ยนไม่ถี่: cache 1 ชั่วโมง
  await proxyText(res, url, 3600);
});

// ✅ /v1/catalog/items/:assetId/details
app.get("/v1/catalog/items/:assetId/details", async (req, res) => {
  const { assetId } = req.params;
  const url = `https://catalog.roblox.com/v1/catalog/items/${assetId}/details?itemType=Asset`;

  // details เปลี่ยนไม่ถี่: cache 30 นาที (อยากลดหนักขึ้นค่อยเพิ่ม)
  await proxyText(res, url, 1800);
});

export default app;
