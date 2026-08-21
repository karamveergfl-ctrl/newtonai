# Fix the black-screen APK (make it behave like Median)

The installed app opens to a black screen. The build succeeds, so the problem is in how the native shell starts up and loads the site, not in the compile step.

## Most likely cause

The current native config sets the splash screen to **never auto-hide** (`launchAutoHide: false`). It is hidden only by JavaScript that runs inside the loaded website. If the published site at `https://newtonai.site` does not yet contain that new code, or the page load fails/stalls (slow network, redirect to `www`, cold start), nothing ever hides the splash and the user sees a permanent dark/black screen with no way out.

There is also no fallback page: when the remote URL fails to load, the WebView shows blank instead of an error screen.

This diagnosis is based on reading `capacitor.config.ts`, `src/components/native/NativeAppShell.tsx` and the build workflow; the first implementation step is to confirm it by enabling WebView debugging in a test build.

## What will be changed

1. **Splash can never trap the user**
   - Auto-hide the splash after a fixed short duration, keep the JS hide as an extra, and add a hard safety timeout so the WebView is always revealed.

2. **Real fallback instead of a blank screen**
   - Ship a small offline/error page inside the APK (instead of the current empty placeholder HTML) with the NewtonAI logo, a message and a Retry button, shown when the live site cannot be reached.

3. **Reliable remote loading**
   - Allow navigation to `newtonai.site`, `www.newtonai.site`, the Lovable domains and required third parties (auth, payments, video) so redirects don't dead-end.
   - Keep the WebView background brand-dark instead of black so any load gap looks intentional.

4. **Diagnosable builds**
   - Turn on WebView debugging for the debug APK so the exact failure can be read over USB if anything still goes wrong.

5. **Median-style polish kept intact**
   - Branded icon and splash, dark status bar, back-button handling, pull-to-refresh, external links in the system browser, camera/mic/file permissions — all stay as they are today.

6. **Rebuild**
   - Same free GitHub Actions workflow; you re-run "Build Android APK" and download the artifact.

## Technical details

- `capacitor.config.ts`: `launchAutoHide: true`, `launchShowDuration: 2000`, add `backgroundColor` for the Android WebView, add `server.allowNavigation` list, set `webContentsDebuggingEnabled: true` for the debug build.
- `src/lib/nativeShell.ts`: hide splash on `DOMContentLoaded`/first paint and via a `setTimeout` guard, wrapped in try/catch so a plugin error can't block it.
- New `native/fallback/index.html` (bundled as `webDir` content) with inline CSS, logo and a reload button; workflow step replaces the current empty `dist/index.html` placeholder with it.
- `.github/workflows/android-apk.yml`: copy the fallback page into `dist` before `npx cap add android`; no other pipeline changes.
- No changes to the web app's business logic, database or published site behaviour.
