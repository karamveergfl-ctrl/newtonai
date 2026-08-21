# Resolve the recurring Android APK build failure

## Verified diagnosis

- The screenshot shows the older workflow running **Build web app**, where Vite failed because Recharts could not resolve its `react-is` peer dependency.
- `react-is@18.3.1` is now present in both `package.json` and `package-lock.json`.
- The current workflow no longer runs the unnecessary Vite build; it prepares the minimal Capacitor web directory because the APK loads the deployed NewtonAI app from the configured URL.
- The latest GitHub Actions run (`32473246838`, commit `e202989c`, August 21, 2026 at 10:34 UTC) completed every step successfully, including **Build debug APK** and **Upload APK artifact**.
- GitHub currently contains the downloadable, non-expired artifact named `newtonai-debug-apk` (about 3.76 MB).

## Action

1. Make no further code changes—the exact build failure is already resolved in the current revision.
2. Open the latest successful **Build Android APK** run in GitHub Actions.
3. Download `newtonai-debug-apk` from the run’s **Artifacts** section and unzip it to obtain `app-debug.apk`.
4. For future native updates, first pull the latest project and run `npx cap sync android` before rebuilding locally.

## Technical safeguards already in place

- Valid Android package ID in `capacitor.config.ts`.
- Node 22 and Java 21 in the workflow.
- Capacitor Android platform added and synced automatically.
- APK artifact upload fails explicitly if `app-debug.apk` is absent.
