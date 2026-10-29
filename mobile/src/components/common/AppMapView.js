import React, { forwardRef } from "react";
import MapView, {
    UrlTile,
    Marker,
    Polyline,
    Callout,
    Circle,
    Polygon,
    PROVIDER_GOOGLE,
    PROVIDER_DEFAULT,
} from "react-native-maps";

const GOOGLE_KEY =
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "";
const HAS_GOOGLE_KEY = Boolean(
    GOOGLE_KEY && GOOGLE_KEY.trim().length > 10
);

const AppMapView = forwardRef(function AppMapView(
    {
        children,
        mapType,
        provider,
        style,
        ...rest
    },
    ref
) {
    // When no Google Maps API Key is provided, use "none" so Google vector map does not render a blank canvas,
    // and overlay OpenStreetMap tiles via UrlTile.
    const effectiveMapType = HAS_GOOGLE_KEY
        ? mapType || "standard"
        : "none";

    const effectiveProvider = HAS_GOOGLE_KEY
        ? provider || PROVIDER_GOOGLE
        : undefined;

    return (
        <MapView
            ref={ref}
            provider={effectiveProvider}
            mapType={effectiveMapType}
            style={style}
            {...rest}
        >
            {!HAS_GOOGLE_KEY && (
                <UrlTile
                    urlTemplate="https://tile.openstreetmap.de/{z}/{x}/{y}.png"
                    maximumZ={19}
                    flipY={false}
                    zIndex={-1}
                />
            )}
            {children}
        </MapView>
    );
});

export default AppMapView;
export {
    AppMapView,
    Marker,
    Polyline,
    UrlTile,
    Callout,
    Circle,
    Polygon,
    PROVIDER_GOOGLE,
    PROVIDER_DEFAULT,
};
