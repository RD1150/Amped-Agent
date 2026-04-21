import type { CookieOptions, Request } from "express";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function isIpAddress(host: string) {
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;
  return host.includes(":");
}

function isLocalRequest(req: Request): boolean {
  const host = (req.headers.host || req.hostname || "").split(":")[0];
  return LOCAL_HOSTS.has(host) || isIpAddress(host);
}

/**
 * Detect if this is a hosted deployment (Render, Cloud Run, etc.).
 * We use the presence of APP_URL or RENDER_EXTERNAL_URL as the signal
 * rather than NODE_ENV, because NODE_ENV can be unreliable on some hosts.
 */
function isHostedDeployment(): boolean {
  return !!(process.env.APP_URL || process.env.RENDER_EXTERNAL_URL);
}

export function getSessionCookieOptions(
  req: Request
): Pick<CookieOptions, "domain" | "httpOnly" | "path" | "sameSite" | "secure"> {
  // On hosted deployments (Render / Cloud Run), always use secure=true.
  // These platforms always serve over HTTPS, and secure=false causes browsers
  // to silently drop the session cookie, breaking login.
  // On local dev (no APP_URL / RENDER_EXTERNAL_URL), use request-based detection.
  const secure = isHostedDeployment() ? true : !isLocalRequest(req);

  return {
    httpOnly: true,
    path: "/",
    // sameSite:"none" requires secure:true — guaranteed above for hosted deploys
    sameSite: secure ? "none" : "lax",
    secure,
  };
}
