import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ServiceAccount {
  client_email: string;
  private_key: string;
  project_id: string;
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const body = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  const binary = atob(body);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

const b64url = (input: string | Uint8Array) => {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
};

/** Mint an OAuth access token for the Firebase Cloud Messaging v1 API. */
async function getAccessToken(sa: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  );

  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(sa.private_key.replace(/\\n/g, "\n")),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = new Uint8Array(
    await crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      key,
      new TextEncoder().encode(`${header}.${claim}`),
    ),
  );

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${header}.${claim}.${b64url(signature)}`,
    }),
  });
  if (!res.ok) throw new Error(`Google token error [${res.status}]: ${await res.text()}`);
  return (await res.json()).access_token as string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const raw = Deno.env.get("FIREBASE_SERVICE_ACCOUNT");
    if (!raw) {
      return new Response(
        JSON.stringify({
          error: "Push notifications are not configured yet",
          details: "Add the FIREBASE_SERVICE_ACCOUNT secret to enable sending.",
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: { user } } = await createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
    ).auth.getUser(authHeader.replace("Bearer ", ""));
    if (!user) throw new Error("Unauthorized");

    // Only platform admins may broadcast.
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });

    const body = await req.json();
    const title = String(body.title ?? "").slice(0, 120);
    const message = String(body.body ?? "").slice(0, 400);
    const path = body.path ? String(body.path).slice(0, 200) : undefined;
    const targetUserIds: string[] | undefined = Array.isArray(body.user_ids)
      ? body.user_ids
      : undefined;

    if (!title || !message) throw new Error("title and body are required");
    if (!isAdmin && (!targetUserIds || targetUserIds.some((id) => id !== user.id))) {
      throw new Error("Only admins can notify other users");
    }

    let query = supabase.from("device_push_tokens").select("token");
    if (targetUserIds?.length) query = query.in("user_id", targetUserIds);
    const { data: tokens, error: tokenError } = await query.limit(2000);
    if (tokenError) throw tokenError;
    if (!tokens?.length) {
      return new Response(JSON.stringify({ sent: 0, note: "No registered devices" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sa = JSON.parse(raw) as ServiceAccount;
    const accessToken = await getAccessToken(sa);
    const endpoint = `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`;

    let sent = 0;
    const failures: string[] = [];
    for (const { token } of tokens) {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: {
            token,
            notification: { title, body: message },
            data: path ? { path } : undefined,
            android: { priority: "HIGH" },
          },
        }),
      });
      if (res.ok) {
        sent++;
      } else {
        const detail = await res.text();
        failures.push(`${res.status}: ${detail.slice(0, 160)}`);
        // Drop tokens Firebase says are dead.
        if (res.status === 404 || res.status === 400) {
          await supabase.from("device_push_tokens").delete().eq("token", token);
        }
      }
    }

    return new Response(JSON.stringify({ sent, failed: failures.length, failures }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const messageText = error instanceof Error ? error.message : String(error);
    console.error("send-push-notification failed:", messageText);
    return new Response(JSON.stringify({ error: messageText }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
