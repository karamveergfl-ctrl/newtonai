import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";

/**
 * Known-good origins for this project. If the app boots on an origin that is
 * not in this list, Google OAuth will almost certainly fail with
 * `redirect_uri_mismatch` unless that origin has been added to the Google
 * Cloud Console's "Authorized JavaScript origins".
 */
const ALLOWED_ORIGIN_PATTERNS: RegExp[] = [
  /^https?:\/\/(www\.)?newtonai\.site$/i,
  /^https?:\/\/newtonai\.lovable\.app$/i,
  /^https?:\/\/.*\.lovable\.app$/i, // preview subdomains
  /^https?:\/\/localhost(:\d+)?$/i,
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/i,
];

const SUPABASE_PROJECT_REF = (import.meta.env.VITE_SUPABASE_PROJECT_ID as string) || "";
const EXPECTED_CALLBACK = SUPABASE_PROJECT_REF
  ? `https://${SUPABASE_PROJECT_REF}.supabase.co/auth/v1/callback`
  : "";

interface Diagnostic {
  title: string;
  reason: string;
  origin: string;
  redirectUri: string;
  callback: string;
}

function readOAuthError(): { code: string; description: string } | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const code = params.get("error") || hash.get("error");
  const desc =
    params.get("error_description") ||
    hash.get("error_description") ||
    params.get("error_code") ||
    hash.get("error_code") ||
    "";
  if (!code) return null;
  return { code, description: decodeURIComponent(desc) };
}

export function OAuthDiagnostics() {
  const [diag, setDiag] = useState<Diagnostic | null>(null);

  useEffect(() => {
    const origin = window.location.origin;
    const redirectUri = `${origin}/auth`;

    // 1) Check if current origin is in the allowlist
    const isAllowed = ALLOWED_ORIGIN_PATTERNS.some((p) => p.test(origin));

    // 2) Check if we landed back with an OAuth error in the URL
    const oauthErr = readOAuthError();
    const isRedirectMismatch =
      !!oauthErr &&
      /redirect_uri_mismatch|invalid.+request|access.+blocked/i.test(
        `${oauthErr.code} ${oauthErr.description}`
      );

    if (!EXPECTED_CALLBACK) {
      console.warn(
        "[OAuthDiagnostics] VITE_SUPABASE_PROJECT_ID is not configured. " +
          "Cannot validate Google OAuth callback URL."
      );
    }

    if (oauthErr && isRedirectMismatch) {
      setDiag({
        title: "Google sign-in blocked: redirect URI mismatch",
        reason:
          oauthErr.description ||
          "Google rejected the sign-in request because the redirect URI is not authorized in your Google Cloud OAuth client.",
        origin,
        redirectUri,
        callback: EXPECTED_CALLBACK,
      });
      return;
    }

    if (!isAllowed) {
      console.warn(
        `[OAuthDiagnostics] App is running on "${origin}" which is not in ` +
          "the known allowlist. Google sign-in may fail with redirect_uri_mismatch."
      );
    }
  }, []);

  if (!diag) return null;

  const copy = (value: string, label: string) => {
    navigator.clipboard.writeText(value).then(
      () => toast.success(`${label} copied`),
      () => toast.error("Copy failed")
    );
  };

  const clearAndClose = () => {
    // Strip the error params so the dialog doesn't reappear on reload
    const url = new URL(window.location.href);
    ["error", "error_code", "error_description"].forEach((k) =>
      url.searchParams.delete(k)
    );
    url.hash = "";
    window.history.replaceState({}, "", url.toString());
    setDiag(null);
  };

  return (
    <Dialog open onOpenChange={(o) => !o && clearAndClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <DialogTitle>{diag.title}</DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground">
            {diag.reason}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div>
            <p className="font-medium text-foreground mb-1">
              Fix in Google Cloud Console
            </p>
            <ol className="list-decimal pl-5 space-y-1 text-muted-foreground">
              <li>
                Open{" "}
                <a
                  href="https://console.cloud.google.com/apis/credentials"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline inline-flex items-center gap-1"
                >
                  Google Cloud → Credentials
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>Open your OAuth 2.0 Client ID</li>
              <li>
                Add the callback below to <b>Authorized redirect URIs</b>
              </li>
              <li>
                Add this app's origin to <b>Authorized JavaScript origins</b>
              </li>
              <li>Save and wait 1–5 minutes for Google to propagate</li>
            </ol>
          </div>

          <DiagRow
            label="Authorized redirect URI (callback)"
            value={diag.callback || "(VITE_SUPABASE_PROJECT_ID missing)"}
            onCopy={() => copy(diag.callback, "Callback URL")}
            disabled={!diag.callback}
          />
          <DiagRow
            label="Authorized JavaScript origin"
            value={diag.origin}
            onCopy={() => copy(diag.origin, "Origin")}
          />
          <DiagRow
            label="App redirect_uri sent to Google"
            value={diag.redirectUri}
            onCopy={() => copy(diag.redirectUri, "redirect_uri")}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={clearAndClose}>
            Dismiss
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DiagRow({
  label,
  value,
  onCopy,
  disabled,
}: {
  label: string;
  value: string;
  onCopy: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="rounded-md border border-border bg-muted/40 p-3">
      <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <code className="flex-1 text-xs break-all text-foreground">{value}</code>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2"
          onClick={onCopy}
          disabled={disabled}
        >
          <Copy className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}