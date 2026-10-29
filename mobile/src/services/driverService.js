import API from "./api";

export const updateDriverStatus = async (status) => {
    try {
        const res = await API.put(
            "/api/ambulances/status",
            {
                driverStatus: status,
            }
        );
        return res.data;
    } catch (err) {
        console.warn("updateDriverStatus error:", err?.message);
        throw err;
    }
};

export const updateDriverLocation = async (
    latitude,
    longitude
) => {
    try {
        const res = await API.put(
            "/api/ambulances/location",
            {
                latitude,
                longitude,
            }
        );
        return res.data;
    } catch (err) {
        console.warn("updateDriverLocation error:", err?.message);
        throw err;
    }
};

export const getCurrentEmergency = async () => {
    try {
        const res = await API.get(
            "/api/ambulances/current-emergency"
        );
        return res.data;
    } catch (err) {
        console.warn("getCurrentEmergency error:", err?.message);
        throw err;
    }
};

export const getDriverHistory = async () => {
    try {
        const res = await API.get(
            "/api/ambulances/history"
        );
        return res.data?.data ?? res.data ?? [];
    } catch (err) {
        console.warn("getDriverHistory error:", err?.message);
        return [];
    }
};

export const updateProfile = async (data) => {
    try {
        const res = await API.put(
            "/api/ambulances/profile",
            data
        );
        return res.data?.driver ?? res.data?.data ?? res.data;
    } catch (err) {
        console.warn("updateProfile error:", err?.message);
        throw err;
    }
};

export const getPendingEmergencies = async () => {
    try {
        const res = await API.get(
            "/api/ambulances/pending"
        );
        return res.data?.data ?? res.data ?? [];
    } catch (err) {
        console.warn("getPendingEmergencies error:", err?.message);
        return [];
    }
};
