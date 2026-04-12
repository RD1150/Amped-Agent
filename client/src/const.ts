export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Points to our own /login page which supports email/password, Google OAuth, and Manus OAuth.
export const getLoginUrl = () => "/login";

// For users who specifically want Manus OAuth (kept for backward compat)
export const getManusLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};
