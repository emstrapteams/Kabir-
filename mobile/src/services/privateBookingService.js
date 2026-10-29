import API from "./api";

/* ----------------------------- */
/* AVAILABLE BOOKINGS            */
/* ----------------------------- */

export async function getAvailableBookings() {
    try {
        const res = await API.get(
            "/api/bookings/available"
        );
        return res.data?.data ?? (Array.isArray(res.data) ? res.data : []);
    } catch (err) {
        console.warn("getAvailableBookings error:", err?.message);
        return [];
    }
}

/* ----------------------------- */
/* ACCEPT                        */
/* ----------------------------- */

export async function acceptBooking(id) {
    try {
        const res = await API.put(
            `/api/bookings/${id}/accept`
        );
        return res.data?.data ?? res.data;
    } catch (err) {
        console.warn("acceptBooking error:", err?.message);
        throw err;
    }
}

/* ----------------------------- */
/* DECLINE                       */
/* ----------------------------- */

export async function declineBooking(id) {
    try {
        const res = await API.put(
            `/api/bookings/${id}/decline`
        );
        return res.data?.data ?? res.data;
    } catch (err) {
        console.warn("declineBooking error:", err?.message);
        throw err;
    }
}

/* ----------------------------- */
/* ARRIVED                       */
/* ----------------------------- */

export async function arriveBooking(id) {
    try {
        const res = await API.put(
            `/api/bookings/${id}/arrive`
        );
        return res.data?.data ?? res.data;
    } catch (err) {
        console.warn("arriveBooking error:", err?.message);
        throw err;
    }
}

/* ----------------------------- */
/* START TRIP                    */
/* ----------------------------- */

export async function startBookingTrip(id) {
    try {
        const res = await API.put(
            `/api/bookings/${id}/start`
        );
        return res.data?.data ?? res.data;
    } catch (err) {
        console.warn("startBookingTrip error:", err?.message);
        throw err;
    }
}

/* ----------------------------- */
/* COMPLETE                      */
/* ----------------------------- */

export async function completeBooking(id) {
    try {
        const res = await API.put(
            `/api/bookings/${id}/complete`
        );
        return res.data?.data ?? res.data;
    } catch (err) {
        console.warn("completeBooking error:", err?.message);
        throw err;
    }
}

export async function getBookingHistory() {
    try {
        const res = await API.get(
            "/api/bookings/history"
        );
        return res.data?.data ?? (Array.isArray(res.data) ? res.data : []);
    } catch (err) {
        console.warn("getBookingHistory error:", err?.message);
        return [];
    }
}
