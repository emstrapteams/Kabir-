import React, {
    Children,
    Fragment,
    forwardRef,
    isValidElement,
    useCallback,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
} from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

export const PROVIDER_GOOGLE = "google";
export const PROVIDER_DEFAULT = "default";

// Declarative placeholder components so existing screens using
// <Marker />, <Polyline />, etc. work unchanged with WebView + Leaflet.
export const Marker = () => null;
export const Polyline = () => null;
export const UrlTile = () => null;
export const Callout = () => null;
export const Circle = () => null;
export const Polygon = () => null;
export const Heatmap = () => null;

const PIN_COLOR_MAP = {
    red: "#DC2626",
    blue: "#2563EB",
    green: "#16A34A",
    orange: "#EA580C",
    purple: "#9333EA",
    yellow: "#CA8A04",
    teal: "#0D9488",
    navy: "#1E3A8A",
    indigo: "#4F46E5",
    pink: "#DB2777",
};

function resolvePinColor(pinColor) {
    if (!pinColor || typeof pinColor !== "string") return "#DC2626";
    const normalized = pinColor.trim().toLowerCase();
    return PIN_COLOR_MAP[normalized] || pinColor;
}

function deltaToZoom(latitudeDelta) {
    if (!latitudeDelta || latitudeDelta <= 0) return 14;
    return Math.max(2, Math.min(18, Math.round(Math.log2(360 / latitudeDelta))));
}

function isValidCoord(coord) {
    return (
        coord != null &&
        typeof coord.latitude === "number" &&
        typeof coord.longitude === "number" &&
        !Number.isNaN(coord.latitude) &&
        !Number.isNaN(coord.longitude)
    );
}

function extractMapData(children) {
    const markers = [];
    const polylines = [];
    const circles = [];
    const polygons = [];
    const heatPoints = [];
    const markerPressHandlers = new Map();

    const walk = (nodes) => {
        Children.forEach(nodes, (child) => {
            if (!isValidElement(child)) return;

            if (child.type === Fragment) {
                walk(child.props?.children);
                return;
            }

            if (child.type === Marker && isValidCoord(child.props?.coordinate)) {
                const { latitude, longitude } = child.props.coordinate;
                const id = `marker-${markers.length}`;
                if (typeof child.props.onPress === "function") {
                    markerPressHandlers.set(id, child.props.onPress);
                }
                markers.push({
                    id,
                    lat: latitude,
                    lng: longitude,
                    color: resolvePinColor(child.props.pinColor),
                    title: child.props.title || "",
                    description: child.props.description || "",
                });
            } else if (
                child.type === Polyline &&
                Array.isArray(child.props?.coordinates)
            ) {
                const positions = child.props.coordinates
                    .filter(isValidCoord)
                    .map((c) => [c.latitude, c.longitude]);

                if (positions.length > 1) {
                    polylines.push({
                        positions,
                        color: child.props.strokeColor || "#2563EB",
                        weight: child.props.strokeWidth || 4,
                    });
                }
            } else if (child.type === Circle && isValidCoord(child.props?.center)) {
                circles.push({
                    lat: child.props.center.latitude,
                    lng: child.props.center.longitude,
                    radius: child.props.radius || 200,
                    color: child.props.strokeColor || "#2563EB",
                    fillColor:
                        child.props.fillColor ||
                        child.props.strokeColor ||
                        "#2563EB",
                });
            } else if (
                child.type === Polygon &&
                Array.isArray(child.props?.coordinates)
            ) {
                const positions = child.props.coordinates
                    .filter(isValidCoord)
                    .map((c) => [c.latitude, c.longitude]);

                if (positions.length > 2) {
                    polygons.push({
                        positions,
                        color: child.props.strokeColor || "#2563EB",
                        fillColor:
                            child.props.fillColor ||
                            child.props.strokeColor ||
                            "#2563EB",
                    });
                }
            } else if (
                child.type === Heatmap &&
                Array.isArray(child.props?.points)
            ) {
                child.props.points.forEach((pt) => {
                    if (isValidCoord(pt)) {
                        heatPoints.push({
                            lat: pt.latitude,
                            lng: pt.longitude,
                        });
                    }
                });
            }
        });
    };

    walk(children);

    return {
        mapData: { markers, polylines, circles, polygons, heatPoints },
        markerPressHandlers,
    };
}

const LEAFLET_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background: #e5e7eb;
    }
    .emstrap-pin {
      width: 20px;
      height: 20px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 2.5px solid #ffffff;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
      box-sizing: border-box;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    (function () {
      function post(payload) {
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(JSON.stringify(payload));
        }
      }

      function escapeHtml(str) {
        return String(str || "")
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#39;");
      }

      var map = L.map("map", {
        center: [28.6139, 77.209],
        zoom: 13,
        zoomControl: true,
        attributionControl: true
      });

      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors"
      }).addTo(map);

      var dataLayer = L.layerGroup().addTo(map);

      window.__updateMapData = function (data) {
        if (!data || !dataLayer) return;
        dataLayer.clearLayers();

        if (Array.isArray(data.heatPoints)) {
          data.heatPoints.forEach(function (pt) {
            L.circle([pt.lat, pt.lng], {
              radius: 250,
              color: "#EF4444",
              fillColor: "#EF4444",
              fillOpacity: 0.35,
              weight: 1
            }).addTo(dataLayer);
          });
        }

        if (Array.isArray(data.polygons)) {
          data.polygons.forEach(function (poly) {
            L.polygon(poly.positions, {
              color: poly.color || "#2563EB",
              fillColor: poly.fillColor || "#2563EB",
              fillOpacity: 0.25,
              weight: 2
            }).addTo(dataLayer);
          });
        }

        if (Array.isArray(data.circles)) {
          data.circles.forEach(function (c) {
            L.circle([c.lat, c.lng], {
              radius: c.radius || 200,
              color: c.color || "#2563EB",
              fillColor: c.fillColor || "#2563EB",
              fillOpacity: 0.25,
              weight: 2
            }).addTo(dataLayer);
          });
        }

        if (Array.isArray(data.polylines)) {
          data.polylines.forEach(function (line) {
            L.polyline(line.positions, {
              color: line.color || "#2563EB",
              weight: line.weight || 4,
              opacity: 0.9
            }).addTo(dataLayer);
          });
        }

        if (Array.isArray(data.markers)) {
          data.markers.forEach(function (m) {
            var icon = L.divIcon({
              className: "",
              html: '<div class="emstrap-pin" style="background:' + escapeHtml(m.color || "#DC2626") + ';"></div>',
              iconSize: [20, 20],
              iconAnchor: [10, 20],
              popupAnchor: [0, -20]
            });

            var marker = L.marker([m.lat, m.lng], { icon: icon }).addTo(dataLayer);
            if (m.title || m.description) {
              var html = "";
              if (m.title) {
                html += "<strong>" + escapeHtml(m.title) + "</strong>";
              }
              if (m.description) {
                html += (m.title ? "<br/>" : "") + "<span>" + escapeHtml(m.description) + "</span>";
              }
              marker.bindPopup(html);
            }
            if (m.id) {
              marker.on("click", function () {
                post({ event: "onMarkerPress", id: m.id });
              });
            }
          });
        }
      };

      window.__setView = function (lat, lng, zoom) {
        if (typeof lat !== "number" || typeof lng !== "number") return;
        var nextZoom = typeof zoom === "number" ? zoom : map.getZoom();
        map.setView([lat, lng], nextZoom, { animate: true });
      };

      window.__fitBounds = function (coords, padding) {
        if (!Array.isArray(coords) || coords.length === 0) return;
        if (coords.length === 1) {
          map.setView(coords[0], 15, { animate: true });
          return;
        }
        var pad = Array.isArray(padding) && padding.length === 2 ? padding : [50, 50];
        map.fitBounds(L.latLngBounds(coords), {
          padding: pad,
          maxZoom: 17,
          animate: true
        });
      };

      map.on("moveend", function () {
        var center = map.getCenter();
        post({
          event: "onMoveEnd",
          center: { lat: center.lat, lng: center.lng },
          zoom: map.getZoom()
        });
      });

      post({ event: "MAP_READY" });
    })();
  </script>
</body>
</html>`;

const WEBVIEW_SOURCE = { html: LEAFLET_HTML };

const AppMapView = forwardRef(function AppMapView(
    { children, initialRegion, region, style, onRegionChangeComplete },
    ref
) {
    const webViewRef = useRef(null);
    const isReadyRef = useRef(false);
    const hasSetInitialRegionRef = useRef(false);
    const pendingCameraScriptRef = useRef(null);

    const activeRegion = region || initialRegion;

    const { mapData, markerPressHandlers } = useMemo(
        () => extractMapData(children),
        [children]
    );

    const mapDataRef = useRef(mapData);
    mapDataRef.current = mapData;

    const markerPressHandlersRef = useRef(markerPressHandlers);
    markerPressHandlersRef.current = markerPressHandlers;

    const runScript = useCallback((script, queueAsCamera = false) => {
        if (!isReadyRef.current || !webViewRef.current) {
            if (queueAsCamera) {
                pendingCameraScriptRef.current = script;
            }
            return;
        }
        webViewRef.current.injectJavaScript(`${script}; true;`);
    }, []);

    useImperativeHandle(
        ref,
        () => ({
            animateCamera: ({ center, zoom } = {}) => {
                if (!isValidCoord(center)) return;
                const zoomArg = typeof zoom === "number" ? zoom : "null";
                runScript(
                    `window.__setView && window.__setView(${center.latitude}, ${center.longitude}, ${zoomArg})`,
                    true
                );
            },
            animateToRegion: (nextRegion) => {
                if (!isValidCoord(nextRegion)) return;
                const zoom = deltaToZoom(nextRegion.latitudeDelta);
                runScript(
                    `window.__setView && window.__setView(${nextRegion.latitude}, ${nextRegion.longitude}, ${zoom})`,
                    true
                );
            },
            fitToCoordinates: (coords = [], options = {}) => {
                const valid = coords
                    .filter(isValidCoord)
                    .map((c) => [c.latitude, c.longitude]);
                if (!valid.length) return;
                const ep = options?.edgePadding || {};
                const padY = Math.round(
                    Math.min(140, ((ep.top || 40) + (ep.bottom || 40)) / 2)
                );
                const padX = Math.round(
                    Math.min(140, ((ep.left || 40) + (ep.right || 40)) / 2)
                );
                runScript(
                    `window.__fitBounds && window.__fitBounds(${JSON.stringify(valid)}, [${padY}, ${padX}])`,
                    true
                );
            },
        }),
        [runScript]
    );

    useEffect(() => {
        if (!isReadyRef.current || !webViewRef.current) return;
        webViewRef.current.injectJavaScript(
            `window.__updateMapData && window.__updateMapData(${JSON.stringify(mapData)}); true;`
        );
    }, [mapData]);

    const regionLat = region?.latitude;
    const regionLng = region?.longitude;
    const regionDelta = region?.latitudeDelta;

    useEffect(() => {
        if (
            typeof regionLat === "number" &&
            typeof regionLng === "number"
        ) {
            const zoom = deltaToZoom(regionDelta);
            runScript(
                `window.__setView && window.__setView(${regionLat}, ${regionLng}, ${zoom})`,
                true
            );
        }
    }, [regionLat, regionLng, regionDelta, runScript]);

    const handleMessage = useCallback(
        (event) => {
            let msg;
            try {
                msg = JSON.parse(event?.nativeEvent?.data || "{}");
            } catch {
                return;
            }

            if (msg?.event === "MAP_READY") {
                isReadyRef.current = true;
                if (
                    !hasSetInitialRegionRef.current &&
                    !pendingCameraScriptRef.current &&
                    isValidCoord(activeRegion)
                ) {
                    hasSetInitialRegionRef.current = true;
                    const initZoom = deltaToZoom(activeRegion.latitudeDelta);
                    webViewRef.current?.injectJavaScript(
                        `window.__setView && window.__setView(${activeRegion.latitude}, ${activeRegion.longitude}, ${initZoom}); true;`
                    );
                }
                if (pendingCameraScriptRef.current) {
                    webViewRef.current?.injectJavaScript(
                        `${pendingCameraScriptRef.current}; true;`
                    );
                    pendingCameraScriptRef.current = null;
                }
                webViewRef.current?.injectJavaScript(
                    `window.__updateMapData && window.__updateMapData(${JSON.stringify(mapDataRef.current)}); true;`
                );
                return;
            }

            if (msg?.event === "onMarkerPress" && msg?.id) {
                const handler = markerPressHandlersRef.current.get(msg.id);
                handler?.();
                return;
            }

            if (
                msg?.event === "onMoveEnd" &&
                onRegionChangeComplete &&
                msg?.center
            ) {
                onRegionChangeComplete({
                    latitude: msg.center.lat,
                    longitude: msg.center.lng,
                    latitudeDelta: activeRegion?.latitudeDelta ?? 0.05,
                    longitudeDelta: activeRegion?.longitudeDelta ?? 0.05,
                });
            }
        },
        [activeRegion, onRegionChangeComplete]
    );

    return (
        <View style={[styles.container, style]}>
            <WebView
                ref={webViewRef}
                source={WEBVIEW_SOURCE}
                originWhitelist={["*"]}
                javaScriptEnabled
                domStorageEnabled
                mixedContentMode="compatibility"
                nestedScrollEnabled
                scrollEnabled={false}
                style={styles.webview}
                onMessage={handleMessage}
            />
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        overflow: "hidden",
    },
    webview: {
        flex: 1,
        backgroundColor: "transparent",
    },
});

export default AppMapView;
export { AppMapView };
