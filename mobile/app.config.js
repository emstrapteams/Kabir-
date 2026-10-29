module.exports = ({ config }) => {
  const rawApiUrl =
    process.env.EXPO_PUBLIC_API_URL || "http://10.126.246.128:5000";
  const apiUrl = rawApiUrl.trim().replace(/\/+$/, "");

  const googleMapsApiKey =
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
    process.env.GOOGLE_MAPS_API_KEY ||
    "";

  return {
    ...config,
    extra: {
      ...config.extra,
      apiUrl,
      googleMapsApiKey,
      eas: {
        projectId: "804277d0-f964-40e0-a661-962663ed2a80",
        ...(config.extra?.eas || {}),
      },
    },
    android: {
      ...config.android,
      config: {
        ...config.android?.config,
        googleMaps: {
          apiKey: googleMapsApiKey,
        },
      },
    },
  };
};
