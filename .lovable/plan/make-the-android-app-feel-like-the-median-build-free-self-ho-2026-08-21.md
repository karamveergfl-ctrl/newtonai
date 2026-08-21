# Make the Android app feel like the Median build (free, self-hosted)

Median wraps your website in a polished native shell. We already have the same wrapper technology (Capacitor) building your APK for free in GitHub Actions — it is just missing the polish. This plan adds the Median-style features one by one.

## What you get

- Loads `https://newtonai.site` (your real site, not the preview link)
- Branded splash screen and proper app icon — no default Capacitor logo
- Native status bar coloured to match the app, no browser chrome, no text zoom
- Friendly "You're offline" screen with a Retry button, plus swipe-down pull-to-refresh
- Android back button navigates back in the app, and exits only from the home screen
- Camera, photo/PDF uploads and file downloads work natively (permissions granted)
- External links (YouTube, payment pages) open correctly instead of getting stuck
- Push notifications via Firebase (free tier)

## Steps

1. **Point the app at the live site**
   Update `capacitor.config.ts` to load `https://newtonai.site`, set the app name to "NewtonAI", and configure splash screen, status bar and keyboard behaviour.

2. **Icon and splash screen**
   Generate the NewtonAI icon and splash assets from the existing logo and wire them in with `@capacitor/assets` during the GitHub build, so every APK gets branded launch visuals.

3. **Native plugins**
   Add `@capacitor/splash-screen`, `@capacitor/status-bar`, `@capacitor/app`, `@capacitor/network`, `@capacitor/browser`, `@capacitor/filesystem`, `@capacitor/share`. Initialise them from a single `src/lib/nativeShell.ts` module that is a no-op on the web, so nothing changes for browser users.

4. **Offline screen + pull to refresh**
   A native-only overlay that appears when the device loses connectivity, with a Retry button, and a swipe-down-to-reload gesture at the top of pages (reusing the existing `usePullToRefresh` hook).

5. **Back button and external links**
   Hardware back goes back through app history; on the home screen it asks before exiting. Links to other domains open in the system browser sheet instead of trapping the WebView.

6. **Camera, uploads and downloads**
   Add the Android permissions (camera, storage, internet) and the WebView settings needed for `<input type="file">`, `capture=environment` photo capture, and saving generated PDFs/audio to the device.

7. **Push notifications (Firebase)**
   Add `@capacitor/push-notifications`, a `device_push_tokens` table in the backend to store each device's token, and an edge function to send notifications. This step needs one free Firebase project from you (a `google-services.json` file) — I'll give exact click-by-click instructions when we reach it.

8. **Build workflow update**
   Update `.github/workflows/android-apk.yml` to run the asset generation and keep producing a downloadable APK, plus add an optional signed release APK output for Play Store submission later.

## Technical notes

- Capacitor stays in "remote URL" mode (`server.url`), matching how Median works, so the app always shows your latest published site without rebuilding the APK.
- All native code paths are guarded by `Capacitor.isNativePlatform()`; the web app and Lovable preview are unaffected.
- No service worker or PWA changes are involved.
- Push notifications are the only part requiring an external free account (Firebase); everything else is fully automated.
