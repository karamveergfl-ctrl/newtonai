/**
 * Push notification registration for the native app.
 * No-op on the web. Requires a Firebase project (google-services.json) in the
 * Android build for tokens to be issued.
 */
import { supabase } from "@/integrations/supabase/client";
import { isNativeApp } from "@/lib/nativeShell";

let registered = false;

export async function registerPushNotifications(
  onOpenPath?: (path: string) => void,
): Promise<void> {
  if (!isNativeApp() || registered) return;
  registered = true;

  try {
    const { PushNotifications } = await import("@capacitor/push-notifications");
    const { Capacitor } = await import("@capacitor/core");

    let permission = await PushNotifications.checkPermissions();
    if (permission.receive === "prompt") {
      permission = await PushNotifications.requestPermissions();
    }
    if (permission.receive !== "granted") return;

    await PushNotifications.addListener("registration", async ({ value }) => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      await supabase.from("device_push_tokens").upsert(
        {
          user_id: data.user.id,
          token: value,
          platform: Capacitor.getPlatform(),
        },
        { onConflict: "token" },
      );
    });

    await PushNotifications.addListener("registrationError", (err) => {
      console.warn("Push registration failed", err);
    });

    await PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
      const path = (action.notification.data as Record<string, string> | undefined)?.path;
      if (path && onOpenPath) onOpenPath(path);
    });

    await PushNotifications.register();
  } catch (error) {
    console.warn("Push notifications unavailable", error);
  }
}
