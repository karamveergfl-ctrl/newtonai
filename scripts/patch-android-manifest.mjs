/**
 * Adds the runtime permissions the NewtonAI web app needs inside the native
 * WebView (camera capture, file uploads/downloads, lecture recording, push).
 *
 * Runs in CI after `npx cap add android`, which regenerates the manifest.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const MANIFEST = "android/app/src/main/AndroidManifest.xml";

if (!existsSync(MANIFEST)) {
  console.error(`Manifest not found at ${MANIFEST}`);
  process.exit(1);
}

const PERMISSIONS = [
  '<uses-permission android:name="android.permission.INTERNET" />',
  '<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />',
  '<uses-permission android:name="android.permission.CAMERA" />',
  '<uses-permission android:name="android.permission.RECORD_AUDIO" />',
  '<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />',
  '<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />',
  '<uses-permission android:name="android.permission.VIBRATE" />',
  '<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />',
  '<uses-permission android:name="android.permission.READ_MEDIA_VIDEO" />',
  '<uses-permission android:name="android.permission.READ_MEDIA_AUDIO" />',
  '<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />',
  '<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="28" />',
];

const FEATURES = [
  '<uses-feature android:name="android.hardware.camera" android:required="false" />',
  '<uses-feature android:name="android.hardware.microphone" android:required="false" />',
];

let xml = readFileSync(MANIFEST, "utf8");

const missing = [...PERMISSIONS, ...FEATURES].filter((line) => {
  const nameMatch = line.match(/android:name="([^"]+)"/);
  return nameMatch ? !xml.includes(`android:name="${nameMatch[1]}"`) : true;
});

if (missing.length) {
  xml = xml.replace("</manifest>", `    ${missing.join("\n    ")}\n</manifest>`);
}

// Hardware acceleration keeps video/animation playback smooth in the WebView.
if (!xml.includes("android:hardwareAccelerated")) {
  xml = xml.replace("<application", '<application android:hardwareAccelerated="true"');
}

writeFileSync(MANIFEST, xml);
console.log(`Patched AndroidManifest.xml (${missing.length} entries added).`);
