import polyline from "@mapbox/polyline";

const ORS_API_KEY =
    process.env.EXPO_PUBLIC_ORS_API_KEY ||
    "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjkxNDFiYjVjNDUzNTQyNDhhOWZkOGM3MjE4MjYyNTY1IiwiaCI6Im11cm11cjY0In0=";

export const getRoute = async (pickup, dropoff) => {
    if (
        !pickup ||
        !dropoff ||
        pickup.latitude == null ||
        pickup.longitude == null ||
        dropoff.latitude == null ||
        dropoff.longitude == null
    ) {
        return null;
    }

    // 1. Try OpenRouteService if API key is present
    if (ORS_API_KEY) {
        try {
            const url =
                `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${ORS_API_KEY}&start=${pickup.longitude},${pickup.latitude}&end=${dropoff.longitude},${dropoff.latitude}`;
            const response = await fetch(url);
            const data = await response.json();
            if (data.features?.length) {
                const summary = data.features[0].properties.summary;
                return {
                    distanceKm: Number((summary.distance / 1000).toFixed(1)),
                    durationMin: Math.ceil(summary.duration / 60),
                };
            }
        } catch (orsErr) {
            console.warn("ORS route calculation failed, trying OSRM fallback:", orsErr?.message);
        }
    }

    // 2. Fallback to OSRM
    try {
        const url =
            `https://router.project-osrm.org/route/v1/driving/` +
            `${pickup.longitude},${pickup.latitude};` +
            `${dropoff.longitude},${dropoff.latitude}` +
            `?overview=false`;

        const response = await fetch(url);

        const data = await response.json();

        if (!data.routes?.length) return null;

        return {
            distanceKm: Number((data.routes[0].distance / 1000).toFixed(1)),
            durationMin: Math.ceil(data.routes[0].duration / 60),
        };
    } catch (err) {
        console.log(err);
        return null;
    }
};

export const getRoutePolyline = async (
    origin,
    destination
) => {
    if (
        !origin ||
        !destination ||
        origin.latitude == null ||
        origin.longitude == null ||
        destination.latitude == null ||
        destination.longitude == null
    ) {
        return null;
    }

    // 1. Try OpenRouteService if API key is present
    if (ORS_API_KEY) {
        try {
            const url =
                `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${ORS_API_KEY}&start=${origin.longitude},${origin.latitude}&end=${destination.longitude},${destination.latitude}`;
            const response = await fetch(url);
            const data = await response.json();
            if (data.features?.length) {
                const coords = data.features[0].geometry.coordinates; // [lng, lat]
                const summary = data.features[0].properties.summary;
                return {
                    coordinates: coords.map(([longitude, latitude]) => ({
                        latitude,
                        longitude,
                    })),
                    distanceKm: Number((summary.distance / 1000).toFixed(1)),
                    durationMin: Math.ceil(summary.duration / 60),
                };
            }
        } catch (orsErr) {
            console.warn("ORS polyline calculation failed, trying OSRM fallback:", orsErr?.message);
        }
    }

    // 2. Fallback to OSRM
    try {
        const url =
            `https://router.project-osrm.org/route/v1/driving/` +
            `${origin.longitude},${origin.latitude};` +
            `${destination.longitude},${destination.latitude}` +
            `?overview=full&geometries=polyline`;

        const response = await fetch(url);

        const data = await response.json();

        if (!data.routes?.length) return null;

        const route = data.routes[0];

        return {
            coordinates: polyline
                .decode(route.geometry)
                .map(([latitude, longitude]) => ({
                    latitude,
                    longitude,
                })),
            distanceKm: Number(
                (route.distance / 1000).toFixed(1)
            ),
            durationMin: Math.ceil(
                route.duration / 60
            ),
        };
    } catch (err) {
        console.log(err);
        return null;
    }
};
