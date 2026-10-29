import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Constants from "expo-constants";

const rawApiUrl =
    process.env.EXPO_PUBLIC_API_URL ||
    Constants.expoConfig?.extra?.apiUrl ||
    "http://10.126.246.128:5000";

const API_URL = rawApiUrl.trim().replace(/\/+$/, "");

const API = axios.create({
    baseURL: API_URL,
    timeout: 15000,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

// Automatically attach JWT
API.interceptors.request.use(async (config) => {
    try {
        const token = await AsyncStorage.getItem("authToken");

        if (token) {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${token}`;
        }
    } catch (e) {
        console.warn("Error reading authToken:", e?.message);
    }

    return config;
});

// Robust error logging and handling for standalone builds
API.interceptors.response.use(
    (response) => response,
    (error) => {
        console.log("════════════════════");
        console.log("❌ API CONFIG ERROR");
        console.log("METHOD:", error.config?.method?.toUpperCase());
        console.log("URL:", error.config?.url);
        console.log("STATUS:", error.response?.status);
        console.log("MESSAGE:", error.message);
        console.log("════════════════════");

        return Promise.reject(error);
    }
);

export const getErrorMessage = (
    error,
    fallback = "Something went wrong"
) => {
    if (error?.code === "ECONNABORTED" || error?.message?.includes("timeout")) {
        return "Connection timed out. Please check your network and server.";
    }
    if (error?.message === "Network Error" || !error?.response) {
        return "Unable to connect to server. Please check your internet connection.";
    }
    return (
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        fallback
    );
};

export default API;
export { API_URL };
