import mongoose from "mongoose";

let bookingConnection;

export const connectBookingDB = async () => {
    if (bookingConnection) {
        return bookingConnection;
    }

    const bookingUri = process.env.MONGO_URI_BOOKING || process.env.MONGO_URI;

    if (!bookingUri) {
        throw new Error("Neither MONGO_URI_BOOKING nor MONGO_URI is configured");
    }

    bookingConnection = await mongoose
        .createConnection(bookingUri, {
            serverSelectionTimeoutMS: 10000,
        })
        .asPromise();

    console.log("✅ Booking DB connected");

    return bookingConnection;
};

export const getBookingConnection = () => {
    if (!bookingConnection) {
        throw new Error(
            "Booking DB not initialized. Call connectBookingDB() first."
        );
    }

    return bookingConnection;
};
