# Make NewtonAI PWABuilder-ready (free APK + Play Store AAB)

PWABuilder wraps a properly configured PWA into an Android app (Trusted Web Activity). Right now `newtonai.site` has **no web app manifest and no app icons or theme-color tags** in `index.html`, so PWABuilder would score it as not installable and the packaged app would fail or look unbranded.

This plan adds exactly what PWABuilder needs — nothing more.

## What gets added

1. **Web app manifest** (`public/manifest.webmanifest`)
   - Name "NewtonAI", short name "NewtonAI", `start_url: "/"`, `scope: "/"`, `display: "standalone"`, `id: "/"`
   - Brand dark background and theme color, `orientation: "portrait"`, language and categories
   - Two app shortcuts (Dashboard, Homework Help) so the Android long-press menu feels native

2. **App icons**
   - 192px and 512px PNG icons plus a 512px maskable icon (rounded-safe padding) generated from the existing NewtonAI logo
   - Apple touch icon for iPhone home screens

3. **Head tags in `index.html`**
   - `<link rel="manifest">`, `<meta name="theme-color">`, `apple-touch-icon`, and `apple-mobile-web-app-*` tags
   - Existing SEO title/description/OG tags stay untouched

4. **Digital Asset Links placeholder** (`public/.well-known/assetlinks.json`)
   - Required so the packaged Android app opens full-screen without a browser URL bar
   - Filled with the SHA-256 fingerprint that PWABuilder gives you after packaging; the plan includes the exact copy-paste step

No service worker is added. Offline support is not required for PWABuilder packaging and would risk stale-cache problems on the live site. It can be added later if you want the app to work without internet.

## What you do after the changes

1. Publish the site so the manifest is live on `https://newtonai.site`
2. Go to `pwabuilder.com`, enter `https://newtonai.site`, click Package for Stores → Android
3. Download the zip → it contains the test **APK**, the Play Store **AAB**, and a `assetlinks.json` / signing fingerprint
4. Send me the fingerprint and I'll drop it into `public/.well-known/assetlinks.json`, then you republish
5. Install the APK on your phone, or upload the AAB to Google Play

## Existing Capacitor build

The current Capacitor GitHub Actions workflow stays in place as a backup path; it is not removed. If you'd rather delete it once PWABuilder works, say so and I'll clean it up.

## Technical details

- Manifest served from `public/manifest.webmanifest` (static, no build plugin).
- Icons written to `public/icons/` at 192/512/512-maskable, generated from `public/newton-logo-clean.png` on a `#0B1020` background.
- `index.html` head additions only; no changes to routing, React code, database or edge functions.
- `assetlinks.json` uses package name `site.newtonai.twa` (chosen at PWABuilder packaging time) and a fingerprint placeholder until step 4.
