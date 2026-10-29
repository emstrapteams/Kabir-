const { withAndroidManifest, withStringsXml, withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

function withCleartextTraffic(config) {
  // 1. AndroidManifest modifications
  config = withAndroidManifest(config, (modConfig) => {
    const androidManifest = modConfig.modResults.manifest;
    const application = androidManifest.application?.[0];
    if (application) {
      application.$["android:usesCleartextTraffic"] = "true";
      application.$["android:networkSecurityConfig"] = "@xml/network_security_config";

      // Ensure Google Maps API key meta-data exists for react-native-maps in standalone APK
      application["meta-data"] = application["meta-data"] || [];
      const hasMapsKey = application["meta-data"].some(
        (m) => m.$["android:name"] === "com.google.android.geo.API_KEY"
      );
      if (!hasMapsKey) {
        const mapsApiKey =
          process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
          process.env.GOOGLE_MAPS_API_KEY ||
          "";
        application["meta-data"].push({
          $: {
            "android:name": "com.google.android.geo.API_KEY",
            "android:value": mapsApiKey || "@string/google_maps_api_key",
          },
        });
      }
    }
    return modConfig;
  });

  // 2. Strings.xml modifications
  config = withStringsXml(config, (modConfig) => {
    const strings = modConfig.modResults.resources.string || [];
    const hasKey = strings.some((s) => s.$.name === "google_maps_api_key");
    if (!hasKey) {
      const mapsApiKey =
        process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
        process.env.GOOGLE_MAPS_API_KEY ||
        "";
      strings.push({
        $: { name: "google_maps_api_key", translatable: "false" },
        _: mapsApiKey,
      });
      modConfig.modResults.resources.string = strings;
    }
    return modConfig;
  });

  // 3. Write network_security_config.xml
  config = withDangerousMod(config, [
    "android",
    async (modConfig) => {
      const xmlDir = path.join(
        modConfig.modRequest.platformProjectRoot,
        "app/src/main/res/xml"
      );
      if (!fs.existsSync(xmlDir)) {
        fs.mkdirSync(xmlDir, { recursive: true });
      }
      const xmlPath = path.join(xmlDir, "network_security_config.xml");
      const xmlContent = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="system" />
            <certificates src="user" />
        </trust-anchors>
    </base-config>
</network-security-config>\n`;
      fs.writeFileSync(xmlPath, xmlContent, "utf8");
      return modConfig;
    },
  ]);

  return config;
}

module.exports = withCleartextTraffic;
