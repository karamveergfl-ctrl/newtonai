/**
 * Single, guarded service-worker registration point for NewtonAI.
 *
 * The SW is only allowed in the real production site (newtonai.site / the
 * published Lovable app). It never registers in dev, in the Lovable editor
 * preview, inside an iframe, or when `?sw=off` is present — and in those
 * contexts it actively unregisters any stale /sw.js registration.
 */

const SW_URL = "/sw.js";

function isBlockedContext(): boolean {
  if (!import.meta.env.PROD) return true;

  try {
    if (window.self !== window.top) return true;
  } catch {
    return true; // cross-origin frame access -> we are in an iframe
  }

  const host = window.location.hostname;
  if (host.startsWith("id-preview--") || host.startsWith("preview--")) return true;
  if (host === "lovableproject.com" || host.endsWith(".lovableproject.com")) return true;
  if (host === "lovableproject-dev.com" || host.endsWith(".lovableproject-dev.com")) return true;
  if (host === "beta.lovable.dev" || host.endsWith(".beta.lovable.dev")) return true;

  if (new URLSearchParams(window.location.search).has("sw")) {
    if (new URLSearchParams(window.location.search).get("sw") === "off") return true;
  }

  return false;
}

async function unregisterAppServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.allSettled(
      registrations
        .filter((r) => {
          const scriptURL =
            r.active?.scriptURL || r.waiting?.scriptURL || r.installing?.scriptURL || "";
          // Only our own app shell worker — leave messaging workers (FCM etc.) alone.
          return scriptURL.endsWith(SW_URL);
        })
        .map((r) => r.unregister()),
    );
  } catch {
    /* no-op */
  }
}

export function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  if (isBlockedContext()) {
    void unregisterAppServiceWorker();
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register(SW_URL, { scope: "/" }).catch(() => {
      /* registration failures must never break the app */
    });
  });
}
