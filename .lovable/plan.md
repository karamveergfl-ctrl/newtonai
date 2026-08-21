# Resolve the recurring Android APK build failure

## Verified diagnosis

- The uploaded screenshot file is new, but the GitHub log displayed inside it is from an older workflow revision: it contains a **Build web app** step that does not exist on the current `main` branch. That older Vite step failed because Recharts could not resolve its `react-is` peer dependency.
- `react-is@18.3.1` is now present in both `package.json` and `package-lock.json`.
- The current workflow no longer runs the unnecessary Vite build; it prepares the minimal Capacitor web directory because the APK loads the deployed NewtonAI app from the configured URL.
- Two current GitHub Actions runs (`32472463208` and `32473246838`) completed successfully, including **Build debug APK** and **Upload APK artifact**.
- A newer run (`32473891223`, commit `f6167726`) is currently executing **Build debug APK**. Its completed steps include **Prepare Capacitor web directory**, proving it is using the corrected workflow—not the **Build web app** step shown in the screenshot.
- GitHub already contains a downloadable, non-expired artifact named `newtonai-debug-apk` (about 3.76 MB) from the latest completed successful run.

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
