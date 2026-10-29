import React, {
    createContext,
    useContext,
    useEffect,
    useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import API from "../config/api";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }) {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        restoreSession();
    }, []);

    const restoreSession = async () => {
        try {
            const token = await AsyncStorage.getItem("authToken");

            if (!token) {
                setLoading(false);
                return;
            }

            const res = await API.get("/auth/me");

            setUser(res.data.user || res.data);
        } catch (err) {
            await AsyncStorage.multiRemove(["authToken", "user"]);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const loginUser = async (data) => {
        if (data?.token) {
            await AsyncStorage.setItem("authToken", data.token);
        }

        const userData = data.user || data;

        await AsyncStorage.setItem(
            "user",
            JSON.stringify(userData)
        );

        setUser(userData);
    };

    const logoutUser = async () => {
        try {
            await AsyncStorage.multiRemove([
                "authToken",
                "user",
                "currentEmergency",
                "currentBooking",
            ]);
        } catch (storageErr) {
            console.error("Storage error on logout:", storageErr);
        }

        setUser(null);

        try {
            router.replace("/login");
        } catch (navErr) {
            console.log("AuthContext router replace ignored:", navErr?.message);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                loginUser,
                logoutUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}
