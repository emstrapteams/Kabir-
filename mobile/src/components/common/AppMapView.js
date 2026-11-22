import React, {
    Children,
    forwardRef,
    isValidElement,
    useImperativeHandle,
    useMemo,
    useState,
} from "react";
import { StyleSheet, View } from "react-native";
import { LeafletView } from "react-native-leaflet-view";

export const PROVIDER_GOOGLE = "google";
export const PROVIDER_DEFAULT = "default";

// Declarative placeholder components so existing screens using
// <Marker />, <Polyline />, etc. work unchanged with LeafletView.
export const Marker = () => null;
export const Polyline = () => null;
export const UrlTile = () => null;
export const Callout = () => null;
export const Circle = () => null;
export const Polygon = () => null;
export const Heatmap = () => null;

const OSM_LAYERS = [
    {
        baseLayerName: "OpenStreetMap",
        baseLayerIsChecked: true,
        baseLayer: true,
        url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
    },
];

function deltaToZoom(latitudeDelta) {
    if (!latitudeDelta || latitudeDelta <= 0) return 14;
    return Math.max(2, Math.min(18, Math.round(Math.log2(360 / latitudeDelta))));
}

function getMarkerIcon(pinColor) {
    if (pinColor === "blue" || pinColor === "#2563EB") return "🔵";
    if (pinColor === "green" || pinColor === "#16A34A") return "🟢";
    return "📍";
}

const AppMapView = forwardRef(function AppMapView(
    { children, initialRegion, region, style, onRegionChangeComplete },
    ref
) {
    const activeRegion = region || initialRegion;
    const [overrideCenter, setOverrideCenter] = useState(null);
    const [overrideZoom, setOverrideZoom] = useState(null);

    useImperativeHandle(ref, () => ({
        animateCamera: ({ center, zoom } = {}) => {
            if (center?.latitude != null && center?.longitude != null) {
                setOverrideCenter({
                    lat: center.latitude,
                    lng: center.longitude,
                });
            }
            if (typeof zoom === "number") {
                setOverrideZoom(zoom);
            }
        },
        animateToRegion: (nextRegion) => {
            if (nextRegion?.latitude != null && nextRegion?.longitude != null) {
                setOverrideCenter({
                    lat: nextRegion.latitude,
                    lng: nextRegion.longitude,
                });
                setOverrideZoom(deltaToZoom(nextRegion.latitudeDelta));
            }
        },
        fitToCoordinates: (coords = []) => {
            const valid = coords.filter(
                (c) =>
                    typeof c?.latitude === "number" &&
                    typeof c?.longitude === "number"
            );
            if (!valid.length) return;
            const lat =
                valid.reduce((sum, c) => sum + c.latitude, 0) / valid.length;
            const lng =
                valid.reduce((sum, c) => sum + c.longitude, 0) / valid.length;
            setOverrideCenter({ lat, lng });
        },
    }));

    const { mapMarkers, mapShapes } = useMemo(() => {
        const markers = [];
        const shapes = [];

        Children.forEach(children, (child, index) => {
            if (!isValidElement(child)) return;

            if (child.type === Marker && child.props?.coordinate) {
                const { latitude, longitude } = child.props.coordinate;
                if (typeof latitude === "number" && typeof longitude === "number") {
                    markers.push({
                        id: child.key || `marker-${index}`,
                        position: { lat: latitude, lng: longitude },
                        icon: getMarkerIcon(child.props.pinColor),
                        size: [28, 28],
                        title: child.props.title || "",
                    });
                }
            } else if (
                child.type === Polyline &&
                Array.isArray(child.props?.coordinates)
            ) {
                const positions = child.props.coordinates
                    .filter(
                        (c) =>
                            typeof c?.latitude === "number" &&
                            typeof c?.longitude === "number"
                    )
                    .map((c) => ({ lat: c.latitude, lng: c.longitude }));

                if (positions.length > 1) {
                    shapes.push({
                        id: child.key || `polyline-${index}`,
                        shapeType: "Polyline",
                        positions,
                        color: child.props.strokeColor || "#2563EB",
                    });
                }
            } else if (
                child.type === Heatmap &&
                Array.isArray(child.props?.points)
            ) {
                child.props.points.forEach((pt, ptIndex) => {
                    if (
                        typeof pt?.latitude === "number" &&
                        typeof pt?.longitude === "number"
                    ) {
                        shapes.push({
                            id: `${child.key || `heatmap-${index}`}-${ptIndex}`,
                            shapeType: "Circle",
                            center: { lat: pt.latitude, lng: pt.longitude },
                            radius: 250,
                            color: "#EF4444",
                        });
                    }
                });
            }
        });

        return { mapMarkers: markers, mapShapes: shapes };
    }, [children]);

    const mapCenterPosition = overrideCenter || {
        lat: activeRegion?.latitude ?? 28.6139,
        lng: activeRegion?.longitude ?? 77.209,
    };

    const zoom = overrideZoom ?? deltaToZoom(activeRegion?.latitudeDelta);

    return (
        <View style={[styles.container, style]}>
            <LeafletView
                mapLayers={OSM_LAYERS}
                mapCenterPosition={mapCenterPosition}
                zoom={zoom}
                mapMarkers={mapMarkers}
                mapShapes={mapShapes}
                onMessageReceived={(msg) => {
                    if (
                        msg?.event === "onMoveEnd" &&
                        onRegionChangeComplete &&
                        msg?.payload?.mapCenterPosition
                    ) {
                        onRegionChangeComplete({
                            latitude: msg.payload.mapCenterPosition.lat,
                            longitude: msg.payload.mapCenterPosition.lng,
                            latitudeDelta: activeRegion?.latitudeDelta ?? 0.05,
                            longitudeDelta: activeRegion?.longitudeDelta ?? 0.05,
                        });
                    }
                }}
            />
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        overflow: "hidden",
    },
});

export default AppMapView;
export { AppMapView };
