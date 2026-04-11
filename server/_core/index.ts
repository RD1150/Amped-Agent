import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import uploadEndpoint from "../uploadEndpoint";
import { recoverStuckCinematicJobs } from "../routers/cinematicWalkthrough";
import { getDb } from "../db";
import { listingPresentations } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "100mb" }));
  app.use(express.urlencoded({ limit: "100mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // Direct upload endpoint (bypasses tRPC for large files)
  app.use("/api", uploadEndpoint);

  // ── Branded presentation interstitial: /p/:id ───────────────────────────────────────────────────
  // Shows a branded agent landing page before opening the Gamma presentation
  app.get("/p/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) { res.status(404).send("Presentation not found"); return; }
      const db = await getDb();
      if (!db) { res.status(503).send("Service unavailable"); return; }

      // Fetch presentation + persona for the agent
      const [pres] = await db
        .select({
          gammaUrl: listingPresentations.gammaUrl,
          status: listingPresentations.status,
          agentName: listingPresentations.agentName,
          agentHeadshotUrl: listingPresentations.agentHeadshotUrl,
          propertyAddress: listingPresentations.propertyAddress,
          listingPrice: listingPresentations.listingPrice,
          userId: listingPresentations.userId,
        })
        .from(listingPresentations)
        .where(eq(listingPresentations.id, id))
        .limit(1);

      if (!pres) { res.status(404).send("Presentation not found"); return; }
      if (pres.status !== "completed" || !pres.gammaUrl) {
        res.status(404).send("Presentation not ready yet"); return;
      }

      // Try to get brokerage from persona
      const { personas } = await import("../../drizzle/schema");
      const [persona] = await db
        .select({ brokerageName: personas.brokerageName, headshotUrl: personas.headshotUrl, phoneNumber: personas.phoneNumber })
        .from(personas)
        .where(eq(personas.userId, pres.userId))
        .limit(1);

      const agentName = pres.agentName || "Your Agent";
      const headshotUrl = pres.agentHeadshotUrl || persona?.headshotUrl || "";
      const brokerage = persona?.brokerageName || "";
      const phone = persona?.phoneNumber || "";
      const address = pres.propertyAddress || "";
      const price = pres.listingPrice || "";
      const gammaUrl = pres.gammaUrl;

      // Serve a beautiful branded HTML interstitial
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${agentName} — Listing Presentation${address ? " for " + address : ""}</title>
  <meta property="og:title" content="${agentName} — Listing Presentation" />
  <meta property="og:description" content="${address ? address + (price ? " · " + price : "") : "Your personalized listing presentation"}" />
  ${headshotUrl ? `<meta property="og:image" content="${headshotUrl}" />` : ""}
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { height: 100%; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0a0a0a;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 24px;
    }
    /* Subtle animated gradient background */
    body::before {
      content: '';
      position: fixed;
      inset: 0;
      background: radial-gradient(ellipse at 20% 50%, rgba(201,169,98,0.08) 0%, transparent 60%),
                  radial-gradient(ellipse at 80% 20%, rgba(201,169,98,0.05) 0%, transparent 50%);
      pointer-events: none;
    }
    .card {
      position: relative;
      background: #141414;
      border: 1px solid rgba(201,169,98,0.2);
      border-radius: 24px;
      padding: 48px 40px;
      max-width: 480px;
      width: 100%;
      text-align: center;
      box-shadow: 0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04);
      animation: fadeUp 0.5s ease both;
    }
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(201,169,98,0.12);
      border: 1px solid rgba(201,169,98,0.25);
      border-radius: 999px;
      padding: 4px 14px;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #C9A962;
      margin-bottom: 32px;
    }
    .badge::before { content: '\\2605'; font-size: 10px; }
    .headshot-wrap {
      position: relative;
      display: inline-block;
      margin-bottom: 20px;
    }
    .headshot {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      object-fit: cover;
      border: 3px solid #C9A962;
      display: block;
    }
    .headshot-placeholder {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      background: linear-gradient(135deg, #1e1e1e, #2a2a2a);
      border: 3px solid #C9A962;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 36px;
      font-weight: 700;
      color: #C9A962;
      margin: 0 auto;
    }
    .online-dot {
      position: absolute;
      bottom: 4px;
      right: 4px;
      width: 14px;
      height: 14px;
      background: #22c55e;
      border-radius: 50%;
      border: 2px solid #141414;
    }
    h1 {
      font-size: 22px;
      font-weight: 700;
      color: #fff;
      margin-bottom: 4px;
      letter-spacing: -0.02em;
    }
    .brokerage {
      font-size: 13px;
      color: rgba(255,255,255,0.45);
      margin-bottom: 28px;
    }
    .divider {
      height: 1px;
      background: rgba(255,255,255,0.07);
      margin: 0 -40px 28px;
    }
    .property-label {
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.3);
      margin-bottom: 6px;
    }
    .property-address {
      font-size: 16px;
      font-weight: 600;
      color: #fff;
      margin-bottom: 4px;
      line-height: 1.3;
    }
    .property-price {
      font-size: 13px;
      color: #C9A962;
      font-weight: 600;
      margin-bottom: 32px;
    }
    .cta-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      background: #C9A962;
      color: #0a0a0a;
      font-size: 15px;
      font-weight: 700;
      padding: 16px 36px;
      border-radius: 12px;
      border: none;
      cursor: pointer;
      text-decoration: none;
      width: 100%;
      transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
      box-shadow: 0 4px 24px rgba(201,169,98,0.3);
      letter-spacing: -0.01em;
    }
    .cta-btn:hover {
      background: #d4b574;
      transform: translateY(-1px);
      box-shadow: 0 8px 32px rgba(201,169,98,0.4);
    }
    .cta-btn:active { transform: translateY(0); }
    .cta-btn svg { flex-shrink: 0; }
    .footer {
      margin-top: 24px;
      font-size: 11px;
      color: rgba(255,255,255,0.2);
    }
    ${phone ? `.phone { font-size: 12px; color: rgba(255,255,255,0.35); margin-bottom: 28px; }` : ""}
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">Listing Presentation</div>

    <div class="headshot-wrap">
      ${headshotUrl
        ? `<img src="${headshotUrl}" alt="${agentName}" class="headshot" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" />
           <div class="headshot-placeholder" style="display:none">${agentName.charAt(0).toUpperCase()}</div>`
        : `<div class="headshot-placeholder">${agentName.charAt(0).toUpperCase()}</div>`
      }
      <div class="online-dot"></div>
    </div>

    <h1>${agentName}</h1>
    ${brokerage ? `<p class="brokerage">${brokerage}</p>` : `<p class="brokerage">Real Estate Professional</p>`}
    ${phone ? `<p class="phone">${phone}</p>` : ""}

    ${address ? `
    <div class="divider"></div>
    <p class="property-label">Prepared for</p>
    <p class="property-address">${address}</p>
    ${price ? `<p class="property-price">${price}</p>` : ""}
    ` : ""}

    <a href="${gammaUrl}" target="_blank" rel="noopener" class="cta-btn">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
      View Your Presentation
    </a>

    <p class="footer">Prepared exclusively for you by ${agentName}</p>
  </div>
</body>
</html>`);
    } catch (err) {
      console.error("[/p/:id] Error:", err);
      res.status(500).send("Server error");
    }
  });
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    // Run startup recovery after a short delay to ensure DB is ready
    setTimeout(() => {
      recoverStuckCinematicJobs().catch((err) =>
        console.error("[Startup Recovery] Unexpected error:", err)
      );
    }, 5000);
  });
}

startServer().catch(console.error);
