import API from "./api";

export const updateDriverStatus = async (
    status
) => {
    try {
        const res = await API.put(
            "/api/private-drivers/status",
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
            "/api/private-drivers/location",
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

export const getCurrentBooking = async () => {
    try {
        const res = await API.get(
            "/api/private-drivers/current-booking"
        );
        return res.data;
    } catch (err) {
        console.warn("getCurrentBooking error:", err?.message);
        throw err;
    }
};

export const updateProfile = async (data) => {
    try {
        const res = await API.put(
            "/api/private-drivers/profile",
            data
        );
        return res.data?.driver ?? res.data?.data ?? res.data;
    } catch (err) {
        console.warn("updateProfile error:", err?.message);
        throw err;
    }
};

export const getPendingBookings = async () => {
    try {
        const res = await API.get(
            "/api/private-drivers/pending"
        );
        return res.data?.data ?? (Array.isArray(res.data) ? res.data : []);
    } catch (err) {
        console.warn("getPendingBookings error:", err?.message);
        return [];
    }
};
