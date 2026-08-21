/**
 * Native (Capacitor) shell helpers.
 *
 * Every export here is a safe no-op in the browser and in the Lovable preview —
 * the native plugins are only imported lazily when running inside the APK.
 */
import { Capacitor } from "@capacitor/core";

export const isNativeApp = (): boolean => {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
};

/** Brand colour used for the status bar / splash background. */
const BRAND_DARK = "#0B1020";

/** Hosts that should stay inside the app WebView. */
const INTERNAL_HOSTS = [
  "newtonai.site",
  "www.newtonai.site",
  "newtonai.lovable.app",
  "lovableproject.com",
];

const isInternalUrl = (rawUrl: string): boolean => {
  try {
    const url = new URL(rawUrl, window.location.href);
    if (url.protocol !== "http:" && url.protocol !== "https:") return true;
    return INTERNAL_HOSTS.some(
      (host) => url.hostname === host || url.hostname.endsWith(`.${host}`),
    );
  } catch {
    return true;
  }
};

/** Open a URL in the system browser sheet (native) or a new tab (web). */
export const openExternal = async (url: string): Promise<void> => {
  if (!isNativeApp()) {
    window.open(url, "_blank", "noopener,noreferrer");
    return;
  }
  const { Browser } = await import("@capacitor/browser");
  await Browser.open({ url, presentationStyle: "popover" });
};

/** Status bar theming + splash screen dismissal. */
const initChrome = async () => {
  const [{ StatusBar, Style }, { SplashScreen }] = await Promise.all([
    import("@capacitor/status-bar"),
    import("@capacitor/splash-screen"),
  ]);

  try {
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: BRAND_DARK });
    await StatusBar.setOverlaysWebView({ overlay: false });
  } catch {
    /* iOS / unsupported – ignore */
  }

  // Give the WebView a moment to paint the remote site before revealing it.
  window.setTimeout(() => {
    SplashScreen.hide().catch(() => undefined);
  }, 600);
};

/**
 * Route cross-domain link taps (YouTube, payment pages, docs) to the system
 * browser so they never trap the WebView on a page with no way back.
 */
const initExternalLinks = () => {
  const handler = async (event: MouseEvent) => {
    const anchor = (event.target as HTMLElement | null)?.closest?.("a");
    if (!anchor) return;
    const href = anchor.getAttribute("href");
    if (!href || href.startsWith("#")) return;
    if (isInternalUrl(href)) return;

    event.preventDefault();
    await openExternal(anchor.href);
  };

  document.addEventListener("click", handler, true);
  return () => document.removeEventListener("click", handler, true);
};

let disposed = false;
let cleanups: Array<() => void> = [];

/** Call once on app start. Safe to call in the browser (does nothing). */
export const initNativeShell = (): void => {
  if (!isNativeApp() || disposed) return;
  disposed = true;

  initChrome().catch(() => undefined);
  cleanups.push(initExternalLinks());

  // Disable text-zoom double-tap wobble typical of plain WebViews.
  document.documentElement.style.setProperty("-webkit-text-size-adjust", "100%");
  document.body.classList.add("native-app");
};

export const teardownNativeShell = (): void => {
  cleanups.forEach((fn) => fn());
  cleanups = [];
};
