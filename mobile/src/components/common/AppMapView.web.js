import React, { forwardRef } from "react";
import { View, Text, StyleSheet } from "react-native";

export const Marker = ({ children, style }) => <View style={style}>{children}</View>;
export const Polyline = () => null;
export const UrlTile = () => null;
export const Callout = ({ children, style }) => <View style={style}>{children}</View>;
export const Circle = () => null;
export const Polygon = () => null;
export const PROVIDER_GOOGLE = "google";
export const PROVIDER_DEFAULT = "default";

const AppMapView = forwardRef(function AppMapView(
    { children, style, ...rest },
    ref
) {
    return (
        <View ref={ref} style={[styles.container, style]} {...rest}>
            <View style={styles.webFallback}>
                <Text style={styles.text}>
                    Interactive map is active on mobile devices
                </Text>
            </View>
            {children}
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        backgroundColor: "#e5e7eb",
        position: "relative",
        overflow: "hidden",
    },
    webFallback: {
        position: "absolute",
        top: 12,
        left: 12,
        backgroundColor: "rgba(17, 24, 39, 0.75)",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        zIndex: 999,
    },
    text: {
        color: "#fff",
        fontSize: 12,
        fontWeight: "500",
    },
});

export default AppMapView;
export { AppMapView };
