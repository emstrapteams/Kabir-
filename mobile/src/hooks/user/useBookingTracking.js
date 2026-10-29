import { useCallback, useEffect, useState } from "react";
import socket from "../../services/socket";
import { getBookingDetails } from "../../services/bookingService";

export default function useBookingTracking(bookingId) {

    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    const fetchBooking = useCallback(async () => {

        if (!bookingId) return;

        try {

            setError(null);

            const res = await getBookingDetails(bookingId);

            console.log(
                "Booking Response:",
                JSON.stringify(res.data, null, 2)
            );

            if (res.success) {
                setBooking(res.data);
            } else {
                setError("Unable to load booking.");
            }
        } catch (err) {

            console.log(err);

            setError(
                err?.response?.data?.message ||
                "Failed to load booking."
            );

        } finally {

            setLoading(false);
            setRefreshing(false);

        }

    }, [bookingId]);

    useEffect(() => {
        fetchBooking();
    }, [fetchBooking]);

    useEffect(() => {

        if (!bookingId) return;

        const emitTrackRequest = () => {
            socket.emit("track_request", {
                requestId: bookingId,
            });
        };

        if (socket.connected) {
            emitTrackRequest();
        } else {
            socket.connect();
        }

        const onConnect = () => {
            emitTrackRequest();
        };

        socket.on("connect", onConnect);

        // Booking accepted
        socket.on("ambulance_assigned", () => {
            fetchBooking();
        });

        // Driver arrived / trip started / trip completed
        socket.on("booking_updated", () => {
            fetchBooking();
        });

        // Booking cancelled
        socket.on("booking_cancelled", () => {
            fetchBooking();
        });

        // Trip completed
        socket.on("trip_completed", () => {
            fetchBooking();
        });

        return () => {
            socket.off("connect", onConnect);
            socket.off("ambulance_assigned");
            socket.off("booking_updated");
            socket.off("booking_cancelled");
            socket.off("trip_completed");
        };

    }, [bookingId, fetchBooking]);

    const refresh = async () => {

        setRefreshing(true);

        await fetchBooking();

    };

    return {

        booking,

        loading,

        refreshing,

        error,

        refresh,

        fetchBooking,

    };

}
