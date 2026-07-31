"use client";

import { useEffect } from "react";

/**
 * Registers the service worker once on mount. Rendered from the root layout
 * so it runs on every page. Renders nothing.
 */
export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .catch(() => {
          // A failed registration costs the user nothing — the site works
          // exactly as before. Not worth surfacing.
        });
    };

    // Wait for load so registration never competes with first paint.
    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register);
      return () => window.removeEventListener("load", register);
    }
  }, []);

  return null;
}
