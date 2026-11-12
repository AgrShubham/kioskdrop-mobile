const { withAndroidManifest } = require("expo/config-plugins");

/**
 * Enables cleartext HTTP traffic in Android Release builds so users can pair
 * the standalone APK with local emulator (http://10.0.2.2:3000) or LAN
 * Next.js dev servers (http://<LAN-IP>:3000) alongside HTTPS deployments.
 */
module.exports = function withCleartextTraffic(config) {
  return withAndroidManifest(config, (mod) => {
    const application = mod.modResults.manifest.application?.[0];
    if (application && application.$) {
      application.$["android:usesCleartextTraffic"] = "true";
    }
    return mod;
  });
};

