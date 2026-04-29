import { useEffect, useState } from "react";
import { useLocation } from "wouter";

/**
 * DemoAccess — hidden page at /demo-access
 * Calls /api/auth/demo which issues a session cookie for the demo account,
 * then redirects to /dashboard. Not linked from the login page.
 */
export default function DemoAccess() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    // The server endpoint issues the cookie and redirects to /dashboard.
    // We follow it via a full page navigation so the cookie is set correctly.
    window.location.href = "/api/auth/demo";
  }, []);

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center space-y-4 max-w-sm">
          <h1 className="text-xl font-semibold text-gray-900">Demo Access Failed</h1>
          <p className="text-gray-500 text-sm">{errorMsg || "Something went wrong. Please try again."}</p>
          <button
            onClick={() => setLocation("/login")}
            className="text-sm text-blue-600 hover:underline"
          >
            Back to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center space-y-4">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin mx-auto" />
        <p className="text-gray-500 text-sm">Loading demo experience…</p>
      </div>
    </div>
  );
}
