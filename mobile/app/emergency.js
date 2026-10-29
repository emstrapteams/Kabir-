import { Alert } from "react-native";
import { useRouter } from "expo-router";
import CameraCapture from "../src/components/emergency/CameraCapture";
import { useEmergency } from "../src/context/EmergencyContext";
import { getCurrentLocation } from "../src/utils/user/locationPermission";
import {
    precheckEmergency,
    createEmergency,
} from "../src/services/api";

export default function EmergencyScreen() {
    const router = useRouter();

    const {
        setLocation,
        setPhoto,
    } = useEmergency();

    const submitEmergency = async (location, imageUrl) => {
        try {
            console.log("Creating emergency...");

            const response = await createEmergency({
                latitude: location.lat,
                longitude: location.lng,
                imageUrl,
            });

            console.log("Emergency created:", response);

            const requestId =
                response.data?._id ||
                response.data?.data?._id ||
                response._id;

            if (requestId) {
                router.push({
                    pathname: "/tracking",
                    params: { requestId },
                });
            } else {
                Alert.alert("Success", "Emergency created successfully.");
            }

        } catch (err) {
            console.log("Create Emergency Error:", err.response?.data || err.message);
            Alert.alert("Emergency Error", err.response?.data?.message || err.message || "Failed to create emergency.");
        }
    };

    const handleCapture = async (photo) => {
        try {
            const coords = await getCurrentLocation();

            const location = {
                lat: coords.latitude,
                lng: coords.longitude,
            };

            setLocation(location);
            setPhoto(photo);

            console.log("Running AI precheck...");

            const result = await precheckEmergency({
                latitude: location.lat,
                longitude: location.lng,
                imageUrl: `data:image/jpeg;base64,${photo.base64}`,
            });

            console.log("AI Response:", result);

            if (result.warningRequired) {
                Alert.alert(
                    "AI Warning",
                    `Prediction: ${result.aiAnalysis?.predictedClass}\nSeverity: ${result.aiAnalysis?.severity}\n\nDo you want to continue?`,
                    [
                        {
                            text: "Cancel",
                            style: "cancel",
                        },
                        {
                            text: "Continue",
                            onPress: async () => {
                                await submitEmergency(location, result.secureImageUrl);
                            },
                        },
                    ]
                );

                return;
            }

            await submitEmergency(location, result.secureImageUrl);

        } catch (err) {
            console.log("ERROR RESPONSE:", err.response?.data);
            console.log("ERROR STATUS:", err.response?.status);
            console.log("ERROR MESSAGE:", err.message);

            Alert.alert(
                "Emergency Error",
                err.response?.data?.message || err.message || "Unable to proceed with emergency request. Please try again."
            );
        }
    };

    return (
        <CameraCapture
            onCancel={() => router.back()}
            onCapture={handleCapture}
        />
    );
}
