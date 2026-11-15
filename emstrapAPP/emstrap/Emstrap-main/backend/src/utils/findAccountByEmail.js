import User from "../models/user.model.js";
import Admin from "../models/admin.model.js";
import Hospital from "../models/hospital.model.js";
import Police from "../models/police.model.js";
import Ambulance from "../models/ambulance.model.js";
import { getBookingConnection } from "../config/bookingDb.js";
import { getBookingDriverModel } from "../models/bookingDriver.model.js";

const escapeRegex = (string = "") =>
    string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const findAccountByEmail = async (email) => {
    if (!email) return null;
    const regex = new RegExp(`^${escapeRegex(email)}$`, "i");
    const query = { email: { $regex: regex } };

    let account = await User.findOne(query);
    if (account) return account;

    account = await Admin.findOne(query);
    if (account) return account;

    account = await Hospital.findOne(query);
    if (account) return account;

    account = await Police.findOne(query);
    if (account) return account;

    account = await Ambulance.findOne(query);
    if (account) return account;

    const bookingConnection = getBookingConnection();
    const BookingDriver = getBookingDriverModel(bookingConnection);

    account = await BookingDriver.findOne(query);
    if (account) return account;

    // Fallback: If not found by email, allow matching by username/name
    const nameQuery = { name: { $regex: regex } };
    account = await User.findOne(nameQuery);
    if (account) return account;

    account = await Admin.findOne(nameQuery);
    if (account) return account;

    account = await Hospital.findOne(nameQuery);
    if (account) return account;

    account = await Police.findOne(nameQuery);
    if (account) return account;

    account = await Ambulance.findOne(nameQuery);
    if (account) return account;

    account = await BookingDriver.findOne(nameQuery);
    if (account) return account;

    return null;
};

export default findAccountByEmail;
