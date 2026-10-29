import { useEffect, useState } from "react";
import * as Location from "expo-location";

import socket from "../../services/socket";
import { getRoutePolyline } from "../../services/routeService";

export default function useDriverNavigation(
    emergency,
    destination = emergency?.location
) {
    const [driverLocation, setDriverLocation] = useState(null);
    const [route, setRoute] = useState([]);
    const [distance, setDistance] = useState(0);
    const [duration, setDuration] = useState(0);

    useEffect(() => {
        let subscription;
        let mounted = true;

        async function startTracking() {
            try {
                const permission =
                    await Location.requestForegroundPermissionsAsync();

                if (permission.status !== "granted" || !mounted) return;

                subscription =
                    await Location.watchPositionAsync(
                        {
                            accuracy: Location.Accuracy.High,
                            distanceInterval: 5,
                            timeInterval: 3000,
                        },
                        async (location) => {
                            if (!mounted) return;

                            try {
                                const current = {
                                    latitude: location.coords.latitude,
                                    longitude: location.coords.longitude,
                                };

                                setDriverLocation(current);

                                // Send live location through socket
                                if (socket.connected) {
                                    socket.emit("update_location", {
                                        requestId: emergency?._id,
                                        latitude: current.latitude,
                                        longitude: current.longitude,
                                    });
                                }

                                // Calculate navigation route
                                if (
                                    destination &&
                                    destination.latitude != null &&
                                    destination.longitude != null
                                ) {
                                    const result =
                                        await getRoutePolyline(
                                            current,
                                            destination
                                        );

                                    if (result && mounted) {
                                        setRoute(
                                            result.coordinates || []
                                        );

                                        setDistance(
                                            result.distanceKm ?? 0
                                        );

                                        setDuration(
                                            result.durationMin ?? 0
                                        );
                                    }
                                }
                            } catch (locErr) {
                                console.warn("Driver navigation update warning:", locErr?.message);
                            }
                        }
                    );
            } catch (err) {
                console.warn("Driver navigation tracking start warning:", err?.message);
            }
        }

        startTracking();

        return () => {
            mounted = false;
            subscription?.remove();
        };
    }, [emergency, destination]);

    return {
        driverLocation,
        route,
        distance,
        duration,
    };
}
