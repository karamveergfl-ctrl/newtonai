import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Loader2, RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { initNativeShell, isNativeApp } from "@/lib/nativeShell";
import { registerPushNotifications } from "@/lib/pushNotifications";

const HOME_PATHS = ["/", "/dashboard", "/student", "/teacher"];

/**
 * Median-style native shell behaviour for the Android/iOS build:
 * splash + status bar, offline screen, pull-to-refresh and hardware back.
 * Renders nothing at all in the browser.
 */
export function NativeAppShell() {
  const native = isNativeApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [online, setOnline] = useState(true);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const locationRef = useRef(location.pathname);
  locationRef.current = location.pathname;

  // ---- boot -------------------------------------------------------------
  useEffect(() => {
    if (!native) return;
    initNativeShell();
    registerPushNotifications((path) => navigate(path));
  }, [native, navigate]);

  // ---- connectivity -----------------------------------------------------
  useEffect(() => {
    if (!native) return;
    let remove: (() => void) | undefined;

    (async () => {
      const { Network } = await import("@capacitor/network");
      const status = await Network.getStatus();
      setOnline(status.connected);
      const handle = await Network.addListener("networkStatusChange", (s) =>
        setOnline(s.connected),
      );
      remove = () => handle.remove();
    })().catch(() => undefined);

    return () => remove?.();
  }, [native]);

  // ---- hardware back button --------------------------------------------
  useEffect(() => {
    if (!native) return;
    let remove: (() => void) | undefined;

    (async () => {
      const { App } = await import("@capacitor/app");
      const handle = await App.addListener("backButton", ({ canGoBack }) => {
        if (canGoBack && !HOME_PATHS.includes(locationRef.current)) {
          window.history.back();
        } else {
          App.exitApp();
        }
      });
      remove = () => handle.remove();
    })().catch(() => undefined);

    return () => remove?.();
  }, [native]);

  // ---- pull to refresh --------------------------------------------------
  const doRefresh = useCallback(async () => {
    setRefreshing(true);
    window.location.reload();
  }, []);

  useEffect(() => {
    if (!native) return;

    const onStart = (e: TouchEvent) => {
      startY.current = window.scrollY <= 0 ? e.touches[0].clientY : null;
    };
    const onMove = (e: TouchEvent) => {
      if (startY.current === null || refreshing) return;
      const diff = e.touches[0].clientY - startY.current;
      if (diff > 0) setPull(Math.min(diff * 0.5, 110));
    };
    const onEnd = () => {
      if (pull >= 70) void doRefresh();
      startY.current = null;
      setPull(0);
    };

    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchmove", onMove, { passive: true });
    document.addEventListener("touchend", onEnd);
    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onEnd);
    };
  }, [native, pull, refreshing, doRefresh]);

  if (!native) return null;

  return (
    <>
      {/* Pull-to-refresh indicator */}
      {(pull > 0 || refreshing) && (
        <div
          className="fixed left-0 right-0 top-0 z-[70] flex justify-center pointer-events-none"
          style={{ transform: `translateY(${refreshing ? 24 : pull * 0.5}px)` }}
          aria-hidden="true"
        >
          <div className="rounded-full bg-card/95 border border-border p-2 shadow-lg">
            {refreshing ? (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            ) : (
              <RefreshCw
                className="h-5 w-5 text-primary transition-transform"
                style={{ transform: `rotate(${pull * 3}deg)` }}
              />
            )}
          </div>
        </div>
      )}

      {/* Offline screen */}
      {!online && (
        <div
          role="alertdialog"
          aria-label="No internet connection"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-background px-8 text-center"
        >
          <div className="rounded-full bg-muted p-5">
            <WifiOff className="h-9 w-9 text-muted-foreground" aria-hidden="true" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">You're offline</h2>
          <p className="max-w-xs text-sm text-muted-foreground">
            NewtonAI needs an internet connection. Check your Wi-Fi or mobile data
            and try again.
          </p>
          <Button onClick={doRefresh} className="mt-2 gap-2">
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Retry
          </Button>
        </div>
      )}
    </>
  );
}

export default NativeAppShell;
