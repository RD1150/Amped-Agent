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

  // ── Branded presentation redirect: /p/:id → Gamma URL ──────────────────────
  // Hides the Gamma domain from agents and sellers — they only see ampedagent.app/p/123
  app.get("/p/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) { res.status(404).send("Presentation not found"); return; }
      const db = await getDb();
      if (!db) { res.status(503).send("Service unavailable"); return; }
      const [pres] = await db
        .select({ gammaUrl: listingPresentations.gammaUrl, status: listingPresentations.status })
        .from(listingPresentations)
        .where(eq(listingPresentations.id, id))
        .limit(1);
      if (!pres) { res.status(404).send("Presentation not found"); return; }
      if (pres.status !== "completed" || !pres.gammaUrl) {
        res.status(404).send("Presentation not ready yet"); return;
      }
      // 302 temporary redirect — keeps the branded URL intact for sharing
      res.redirect(302, pres.gammaUrl);
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
