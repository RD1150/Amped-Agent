import type { CookieOptions, Request } from "express";

const IS_PRODUCTION = process.env.NODE_ENV === "production";
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function isIpAddress(host: string) {
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;
  return host.includes(":");
}

function isLocalRequest(req: Request): boolean {
  const host = (req.headers.host || req.hostname || "").split(":")[0];
  return LOCAL_HOSTS.has(host) || isIpAddress(host);
}

export function getSessionCookieOptions(
  req: Request
): Pick<CookieOptions, "domain" | "httpOnly" | "path" | "sameSite" | "secure"> {
  // In production, always set secure=true — the app is always served over HTTPS
  // on Render/Cloud Run. We cannot rely on req.protocol because trust proxy
  // may not be configured on all deployments.
  // In local dev, only set secure=true if actually on HTTPS (rare).
  const secure = IS_PRODUCTION ? true : !isLocalRequest(req);

  return {
    httpOnly: true,
    path: "/",
    // sameSite:"none" requires secure:true — always satisfied in production above
    sameSite: secure ? "none" : "lax",
    secure,
  };
}
