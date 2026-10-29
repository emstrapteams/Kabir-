import * as Location from "expo-location";
import { Alert, Platform } from "react-native";

export async function getCurrentLocation() {
    try {
        // 1. Verify if device location services (GPS) are enabled
        const servicesEnabled = await Location.hasServicesEnabledAsync();
        if (!servicesEnabled) {
            if (Platform.OS === "android") {
                try {
                    await Location.enableNetworkProviderAsync();
                } catch (enableErr) {
                    Alert.alert(
                        "Location Services Disabled",
                        "Please enable GPS / Location services in your device settings."
                    );
                    throw new Error("Location services are disabled on your device.");
                }
            } else {
                Alert.alert(
                    "Location Services Disabled",
                    "Please enable Location services in your device settings."
                );
                throw new Error("Location services are disabled on your device.");
            }
        }

        // 2. Verify foreground location permissions
        let { status } = await Location.getForegroundPermissionsAsync();
        if (status !== "granted") {
            const permissionRes = await Location.requestForegroundPermissionsAsync();
            status = permissionRes.status;
        }

        if (status !== "granted") {
            Alert.alert(
                "Permission Required",
                "Location permission is required to detect your current position."
            );
            throw new Error("Location permission denied by user.");
        }

        // 3. Attempt balanced accuracy (Fastest & most reliable across indoor/outdoor)
        try {
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });

            if (location?.coords) {
                return {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                };
            }
        } catch (posErr) {
            console.log("Balanced accuracy failed, trying last known position:", posErr?.message);
        }

        // 4. Fallback to cached last known position
        try {
            const lastKnown = await Location.getLastKnownPositionAsync();
            if (lastKnown?.coords) {
                return {
                    latitude: lastKnown.coords.latitude,
                    longitude: lastKnown.coords.longitude,
                };
            }
        } catch (lastErr) {
            console.log("Last known position failed:", lastErr?.message);
        }

        // 5. Fallback to lowest accuracy
        const fallbackLocation = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Lowest,
        });

        if (fallbackLocation?.coords) {
            return {
                latitude: fallbackLocation.coords.latitude,
                longitude: fallbackLocation.coords.longitude,
            };
        }

        throw new Error("Unable to obtain location coordinates from device.");
    } catch (error) {
        console.error("getCurrentLocation error:", error);
        throw error;
    }
}

export async function reverseGeocodeLocation({ latitude, longitude }) {
    try {
        const reverse = await Location.reverseGeocodeAsync({
            latitude,
            longitude,
        });

        if (reverse && reverse.length > 0) {
            const place = reverse[0];
            const parts = [
                place.name || place.street,
                place.district || place.subregion,
                place.city,
            ].filter(Boolean);

            return parts.length > 0 ? parts.join(", ") : "Current Location";
        }
    } catch (e) {
        console.log("Reverse geocoding error:", e?.message);
    }
    return "Current Location";
}
