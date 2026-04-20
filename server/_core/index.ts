import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import path from "path";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerAuthRoutes } from "./authRoutes";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import uploadEndpoint from "../uploadEndpoint";
import { recoverStuckCinematicJobs } from "../routers/cinematicWalkthrough";
import { registerTrialNotificationJob } from "../jobs/trialNotifications";
import { registerWeeklyDigestJob } from "../jobs/weeklyDigest";
import { registerDripProcessorJob } from "../jobs/dripProcessor";
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

async function runMigrations() {
  if (!process.env.DATABASE_URL) {
    console.warn("[Migrations] DATABASE_URL not set — skipping migrations");
    return;
  }
  try {
    const { drizzle } = await import("drizzle-orm/node-postgres");
    const { migrate } = await import("drizzle-orm/node-postgres/migrator");
    const db = drizzle(process.env.DATABASE_URL);
    const migrationsFolder = path.resolve(process.cwd(), "drizzle");
    console.log("[Migrations] Running pending migrations from", migrationsFolder);
    await migrate(db, { migrationsFolder });
    console.log("[Migrations] All migrations applied successfully");
  } catch (err) {
    console.error("[Migrations] Migration failed (non-fatal):", err);
  }
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "100mb" }));
  app.use(express.urlencoded({ limit: "100mb", extended: true }));
  // Run DB migrations before starting routes
  await runMigrations();
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  registerAuthRoutes(app);
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

      // Log this view
      try {
        const { presentationViews } = await import("../../drizzle/schema");
        await db.insert(presentationViews).values({ presentationId: id, presentationType: "listing" });
      } catch { /* non-critical */ }

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
        .select({ brokerageName: personas.brokerageName, headshotUrl: personas.headshotUrl, phoneNumber: personas.phoneNumber, bookingUrl: personas.bookingUrl })
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
      const bookingUrl = persona?.bookingUrl || "";

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
    .badge::before { content: '\u2605'; font-size: 10px; }
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
    ${bookingUrl ? `.schedule-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; background: transparent; color: #C9A962; font-size: 14px; font-weight: 600; padding: 12px 24px; border-radius: 10px; border: 1.5px solid rgba(201,169,98,0.4); cursor: pointer; text-decoration: none; width: 100%; margin-top: 10px; transition: background 0.2s, border-color 0.2s; letter-spacing: -0.01em; } .schedule-btn:hover { background: rgba(201,169,98,0.08); border-color: rgba(201,169,98,0.7); }` : ""}
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

    ${bookingUrl ? `<a href="${bookingUrl}" target="_blank" rel="noopener" class="schedule-btn">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
      Schedule a Call
    </a>` : ""}

    <p class="footer">Prepared exclusively for you by ${agentName}</p>
  </div>
</body>
</html>`);
    } catch (err) {
      console.error("[/p/:id] Error:", err);
      res.status(500).send("Server error");
    }
  });
  // ── Listing Webpage: /listing/:id ─────────────────────────────────────────────────────────────────
  // Public single-property website for active listings — shared on social, open houses, etc.
  app.get("/listing/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) { res.status(404).send("Listing not found"); return; }
      const db = await getDb();
      if (!db) { res.status(503).send("Service unavailable"); return; }

      const [pres] = await db
        .select({
          propertyAddress: listingPresentations.propertyAddress,
          listingPrice: listingPresentations.listingPrice,
          bedrooms: listingPresentations.bedrooms,
          bathrooms: listingPresentations.bathrooms,
          squareFeet: listingPresentations.squareFeet,
          yearBuilt: listingPresentations.yearBuilt,
          propertyType: listingPresentations.propertyType,
          listingDescription: listingPresentations.listingDescription,
          keyFeatures: listingPresentations.keyFeatures,
          photoUrls: listingPresentations.photoUrls,
          agentName: listingPresentations.agentName,
          agentHeadshotUrl: listingPresentations.agentHeadshotUrl,
          agentBio: listingPresentations.agentBio,
          status: listingPresentations.status,
          userId: listingPresentations.userId,
        })
        .from(listingPresentations)
        .where(eq(listingPresentations.id, id))
        .limit(1);

      if (!pres) { res.status(404).send("Listing not found"); return; }

      // Log this view
      try {
        const { presentationViews } = await import("../../drizzle/schema");
        await db.insert(presentationViews).values({ presentationId: id, presentationType: "listing_webpage" });
      } catch { /* non-critical */ }

      const { personas } = await import("../../drizzle/schema");
      const [persona] = await db
        .select({ brokerageName: personas.brokerageName, headshotUrl: personas.headshotUrl, phoneNumber: personas.phoneNumber, bookingUrl: personas.bookingUrl, emailAddress: personas.emailAddress })
        .from(personas)
        .where(eq(personas.userId, pres.userId))
        .limit(1);

      const agentName = pres.agentName || "Your Agent";
      const headshotUrl = pres.agentHeadshotUrl || persona?.headshotUrl || "";
      const brokerage = persona?.brokerageName || "Real Estate Professional";
      const phone = persona?.phoneNumber || "";
      const email = persona?.emailAddress || "";
      const bookingUrl = persona?.bookingUrl || "";
      const address = pres.propertyAddress || "Property Listing";
      const price = pres.listingPrice || "";
      const beds = pres.bedrooms || "";
      const baths = pres.bathrooms || "";
      const sqft = pres.squareFeet || "";
      const yearBuilt = pres.yearBuilt || "";
      const propType = pres.propertyType || "";
      const description = pres.listingDescription || "";
      const keyFeatures: string[] = (() => { try { return JSON.parse(pres.keyFeatures || "[]"); } catch { return []; } })();
      const photos: string[] = (() => { try { return JSON.parse(pres.photoUrls || "[]"); } catch { return []; } })();
      const firstPhoto = photos[0] || "";

      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${address}${price ? " — " + price : ""}</title>
  <meta property="og:title" content="${address}" />
  <meta property="og:description" content="${beds ? beds + " bed · " : ""}${baths ? baths + " bath · " : ""}${sqft ? sqft + " sqft · " : ""}${price}" />
  ${firstPhoto ? `<meta property="og:image" content="${firstPhoto}" />` : ""}
  <meta property="og:type" content="website" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f0f0f; color: #fff; }
    /* Hero */
    .hero { position: relative; height: 70vh; min-height: 400px; background: #1a1a1a; overflow: hidden; }
    .hero-img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .hero-overlay { position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.7) 100%); }
    .hero-content { position: absolute; bottom: 0; left: 0; right: 0; padding: 40px; }
    .hero-price { font-size: clamp(28px, 5vw, 48px); font-weight: 800; color: #fff; letter-spacing: -0.02em; margin-bottom: 8px; }
    .hero-address { font-size: clamp(14px, 2.5vw, 18px); color: rgba(255,255,255,0.75); font-weight: 400; }
    .hero-stats { display: flex; gap: 24px; margin-top: 16px; flex-wrap: wrap; }
    .hero-stat { display: flex; align-items: center; gap: 6px; font-size: 14px; color: rgba(255,255,255,0.85); font-weight: 600; }
    .hero-stat svg { color: #C9A962; }
    /* Photo strip */
    .photo-strip { display: flex; gap: 4px; height: 120px; overflow-x: auto; background: #0a0a0a; padding: 4px; scrollbar-width: none; }
    .photo-strip::-webkit-scrollbar { display: none; }
    .photo-strip img { height: 100%; width: auto; object-fit: cover; border-radius: 4px; cursor: pointer; flex-shrink: 0; transition: opacity 0.15s; }
    .photo-strip img:hover { opacity: 0.85; }
    /* Main layout */
    .main { max-width: 1100px; margin: 0 auto; padding: 48px 24px; display: grid; grid-template-columns: 1fr 360px; gap: 40px; }
    @media (max-width: 768px) { .main { grid-template-columns: 1fr; } }
    /* Details */
    .section-title { font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #C9A962; margin-bottom: 16px; }
    .description { font-size: 15px; line-height: 1.7; color: rgba(255,255,255,0.75); margin-bottom: 40px; }
    .features-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 10px; margin-bottom: 40px; }
    .feature-item { background: #1a1a1a; border: 1px solid rgba(255,255,255,0.07); border-radius: 10px; padding: 14px 16px; font-size: 13px; color: rgba(255,255,255,0.8); display: flex; align-items: center; gap: 8px; }
    .feature-item::before { content: '\u2713'; color: #C9A962; font-weight: 700; flex-shrink: 0; }
    .details-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 40px; }
    .detail-card { background: #1a1a1a; border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; padding: 16px; }
    .detail-label { font-size: 10px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: rgba(255,255,255,0.35); margin-bottom: 4px; }
    .detail-value { font-size: 16px; font-weight: 700; color: #fff; }
    /* Agent card */
    .agent-card { background: #141414; border: 1px solid rgba(201,169,98,0.2); border-radius: 20px; padding: 32px; position: sticky; top: 24px; }
    .agent-photo { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 2.5px solid #C9A962; margin-bottom: 16px; display: block; }
    .agent-photo-placeholder { width: 80px; height: 80px; border-radius: 50%; background: #2a2a2a; border: 2.5px solid #C9A962; display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 700; color: #C9A962; margin-bottom: 16px; }
    .agent-name { font-size: 18px; font-weight: 700; color: #fff; margin-bottom: 4px; }
    .agent-brokerage { font-size: 12px; color: rgba(255,255,255,0.4); margin-bottom: 20px; }
    .agent-bio { font-size: 13px; line-height: 1.6; color: rgba(255,255,255,0.6); margin-bottom: 24px; }
    .agent-contact { display: flex; flex-direction: column; gap: 8px; margin-bottom: 24px; }
    .contact-item { display: flex; align-items: center; gap: 8px; font-size: 13px; color: rgba(255,255,255,0.7); text-decoration: none; }
    .contact-item svg { color: #C9A962; flex-shrink: 0; }
    .cta-btn { display: block; background: #C9A962; color: #0a0a0a; font-size: 15px; font-weight: 700; padding: 16px 24px; border-radius: 12px; text-align: center; text-decoration: none; width: 100%; transition: background 0.2s, transform 0.15s; box-shadow: 0 4px 20px rgba(201,169,98,0.3); letter-spacing: -0.01em; }
    .cta-btn:hover { background: #d4b574; transform: translateY(-1px); }
    .cta-btn-outline { display: block; background: transparent; color: #C9A962; font-size: 14px; font-weight: 600; padding: 13px 24px; border-radius: 12px; text-align: center; text-decoration: none; width: 100%; border: 1.5px solid rgba(201,169,98,0.4); margin-top: 10px; transition: background 0.2s; }
    .cta-btn-outline:hover { background: rgba(201,169,98,0.08); }
    /* Footer */
    .footer { text-align: center; padding: 40px 24px; font-size: 11px; color: rgba(255,255,255,0.2); border-top: 1px solid rgba(255,255,255,0.05); }
    /* No hero image fallback */
    .hero-no-photo { background: linear-gradient(135deg, #141414 0%, #1e1e1e 100%); display: flex; align-items: flex-end; }
  </style>
</head>
<body>
  <!-- Hero -->
  <div class="hero${firstPhoto ? '' : ' hero-no-photo'}">
    ${firstPhoto ? `<img src="${firstPhoto}" alt="${address}" class="hero-img" />` : ''}
    <div class="hero-overlay"></div>
    <div class="hero-content">
      ${price ? `<div class="hero-price">${price}</div>` : ''}
      <div class="hero-address">${address}</div>
      <div class="hero-stats">
        ${beds ? `<div class="hero-stat"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>${beds} Beds</div>` : ''}
        ${baths ? `<div class="hero-stat"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M4 12h16M4 12a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h4"/></svg>${baths} Baths</div>` : ''}
        ${sqft ? `<div class="hero-stat"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>${sqft} sqft</div>` : ''}
        ${propType ? `<div class="hero-stat">${propType}</div>` : ''}
      </div>
    </div>
  </div>

  <!-- Photo Strip -->
  ${photos.length > 1 ? `<div class="photo-strip">${photos.map(url => `<img src="${url}" alt="Property photo" loading="lazy" />`).join('')}</div>` : ''}

  <!-- Main Content -->
  <div class="main">
    <div class="left">
      ${description ? `
      <p class="section-title">About This Property</p>
      <p class="description">${description}</p>
      ` : ''}

      ${(beds || baths || sqft || yearBuilt) ? `
      <p class="section-title">Property Details</p>
      <div class="details-grid">
        ${beds ? `<div class="detail-card"><div class="detail-label">Bedrooms</div><div class="detail-value">${beds}</div></div>` : ''}
        ${baths ? `<div class="detail-card"><div class="detail-label">Bathrooms</div><div class="detail-value">${baths}</div></div>` : ''}
        ${sqft ? `<div class="detail-card"><div class="detail-label">Square Feet</div><div class="detail-value">${sqft}</div></div>` : ''}
        ${yearBuilt ? `<div class="detail-card"><div class="detail-label">Year Built</div><div class="detail-value">${yearBuilt}</div></div>` : ''}
      </div>
      ` : ''}

      ${keyFeatures.length > 0 ? `
      <p class="section-title">Features & Highlights</p>
      <div class="features-grid">
        ${keyFeatures.map((f: string) => `<div class="feature-item">${f}</div>`).join('')}
      </div>
      ` : ''}
    </div>

    <!-- Agent Card (sticky sidebar) -->
    <div class="right">
      <div class="agent-card">
        ${headshotUrl
          ? `<img src="${headshotUrl}" alt="${agentName}" class="agent-photo" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" /><div class="agent-photo-placeholder" style="display:none">${agentName.charAt(0).toUpperCase()}</div>`
          : `<div class="agent-photo-placeholder">${agentName.charAt(0).toUpperCase()}</div>`
        }
        <div class="agent-name">${agentName}</div>
        <div class="agent-brokerage">${brokerage}</div>
        ${pres.agentBio ? `<p class="agent-bio">${pres.agentBio.substring(0, 200)}${pres.agentBio.length > 200 ? '...' : ''}</p>` : ''}
        <div class="agent-contact">
          ${phone ? `<a href="tel:${phone}" class="contact-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.1a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.77 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 17z"/></svg>${phone}</a>` : ''}
          ${email ? `<a href="mailto:${email}" class="contact-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,12 2,6"/></svg>${email}</a>` : ''}
        </div>
        ${bookingUrl ? `<a href="${bookingUrl}" target="_blank" rel="noopener" class="cta-btn">Request a Showing</a>` : `<a href="${phone ? 'tel:' + phone : '#'}" class="cta-btn">Contact Agent</a>`}
        ${phone ? `<a href="tel:${phone}" class="cta-btn-outline">Call ${agentName.split(' ')[0]}</a>` : ''}
      </div>
    </div>
  </div>

  <div class="footer">Listed by ${agentName} · ${brokerage}</div>
</body>
</html>`);
    } catch (err) {
      console.error("[/listing/:id] Error:", err);
      res.status(500).send("Server error");
    }
  });

  // Twilio SMS Webhook — handles STOP/HELP/opt-out replies
  // Must use express.urlencoded because Twilio sends form-encoded data
  app.post("/api/twilio/webhook", express.urlencoded({ extended: false }), async (req, res) => {
    try {
      const from = req.body?.From as string | undefined;
      const body = (req.body?.Body as string | undefined)?.trim().toUpperCase();

      if (from && body) {
        // Handle STOP — mark lead as opted out
        if (["STOP", "STOPALL", "UNSUBSCRIBE", "CANCEL", "END", "QUIT"].includes(body)) {
          const db = await getDb();
          if (db) {
            const { openHouseLeads } = await import("../../drizzle/schema");
            const { eq } = await import("drizzle-orm");
            await db
              .update(openHouseLeads)
              .set({ smsOptedOut: true, followUpStatus: "opted_out" })
              .where(eq(openHouseLeads.phone, from.replace(/\D/g, "").slice(-10)))
              .catch(() => {});
            console.log(`[Twilio] STOP received from ${from} — opted out`);
          }
        }
      }

      // Twilio expects a TwiML response (even if empty)
      res.set("Content-Type", "text/xml");
      res.send("<?xml version=\"1.0\" encoding=\"UTF-8\"?><Response></Response>");
    } catch (err) {
      console.error("[Twilio Webhook] Error:", err);
      res.status(500).send("Error");
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
    // Register daily trial notification cron job
    registerTrialNotificationJob();
    registerWeeklyDigestJob();
    // Register daily drip email processor
    registerDripProcessorJob();
  });
}

startServer().catch(console.error);
