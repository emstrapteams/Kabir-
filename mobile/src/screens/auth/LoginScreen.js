import { useState, useRef } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Pressable,
    Image,
    StyleSheet,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    ScrollView,
    Platform,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { login } from "../../services/auth.service";
import { getErrorMessage } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

export default function LoginScreen() {
    const router = useRouter();
    const { loginUser } = useAuth();

    const emailInputRef = useRef(null);
    const passwordInputRef = useRef(null);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [emailFocused, setEmailFocused] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);

    const handleLogin = async () => {
        if (!email.trim() || !password) {
            Alert.alert("Error", "Please enter your email or username and password");
            return;
        }

        try {
            setLoading(true);

            const data = await login(
                email.trim().toLowerCase(),
                password
            );

            await loginUser(data);

            const role = data.user?.role || data.role;

            switch (role) {

                case "admin":
                    router.replace("/admin");
                    break;

                case "hospital":
                case "hospital_admin":
                    router.replace("/hospital");
                    break;

                case "police":
                case "police_hq":
                    router.replace("/police");
                    break;

                case "ambulance_driver":
                    router.replace("/driver");
                    break;

                case "private_driver":
                    router.replace("/privateDriver");
                    break;

                case "user":
                    router.replace("/user/booking");
                    break;

                default:
                    router.replace("/");
            }
        } catch (err) {
            Alert.alert(
                "Login Failed",
                getErrorMessage(err, "Invalid credentials")
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                enabled={Platform.OS === "ios"}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="none"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Emstrap Logo */}
                    <View style={styles.logoContainer}>
                        <Image
                            source={require("../../assets/logo.png")}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                    </View>

                    <Text style={styles.title}>Welcome Back</Text>
                    <Text style={styles.subtitle}>Sign in to your EMSTRAP account</Text>

                    {/* Email or Username Field */}
                    <View style={styles.fieldContainer}>
                        <Text style={styles.fieldLabel}>Email or Username</Text>
                        <Pressable
                            style={[
                                styles.inputBox,
                                emailFocused && styles.inputBoxFocused,
                            ]}
                            onPress={() => emailInputRef.current?.focus()}
                        >
                            <Ionicons
                                name="person-outline"
                                size={20}
                                color={emailFocused ? "#dc2626" : "#9ca3af"}
                                style={styles.fieldIcon}
                            />
                            <TextInput
                                ref={emailInputRef}
                                placeholder="Enter your email or username"
                                placeholderTextColor="#9ca3af"
                                style={styles.input}
                                autoCapitalize="none"
                                autoCorrect={false}
                                value={email}
                                onChangeText={setEmail}
                                onFocus={() => setEmailFocused(true)}
                                onBlur={() => setEmailFocused(false)}
                                underlineColorAndroid="transparent"
                                returnKeyType="next"
                                onSubmitEditing={() => passwordInputRef.current?.focus()}
                            />
                        </Pressable>
                    </View>

                    {/* Password Field */}
                    <View style={styles.fieldContainer}>
                        <Text style={styles.fieldLabel}>Password</Text>
                        <Pressable
                            style={[
                                styles.inputBox,
                                passwordFocused && styles.inputBoxFocused,
                            ]}
                            onPress={() => passwordInputRef.current?.focus()}
                        >
                            <Ionicons
                                name="lock-closed-outline"
                                size={20}
                                color={passwordFocused ? "#dc2626" : "#9ca3af"}
                                style={styles.fieldIcon}
                            />
                            <TextInput
                                ref={passwordInputRef}
                                placeholder="Enter your password"
                                placeholderTextColor="#9ca3af"
                                secureTextEntry={!showPassword}
                                style={styles.input}
                                value={password}
                                onChangeText={setPassword}
                                onFocus={() => setPasswordFocused(true)}
                                onBlur={() => setPasswordFocused(false)}
                                underlineColorAndroid="transparent"
                                returnKeyType="done"
                                onSubmitEditing={handleLogin}
                            />

                            <TouchableOpacity
                                onPress={() => setShowPassword(!showPassword)}
                                style={styles.eyeButton}
                                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                            >
                                <Ionicons
                                    name={
                                        showPassword
                                            ? "eye-off-outline"
                                            : "eye-outline"
                                    }
                                    size={22}
                                    color="#888"
                                />
                            </TouchableOpacity>
                        </Pressable>
                    </View>

                    <TouchableOpacity
                        onPress={() => router.push("/forgot-password")}
                        style={styles.forgotContainer}
                    >
                        <Text style={styles.forgot}>
                            Forgot Password?
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.button}
                        onPress={handleLogin}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>
                                Login
                            </Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => router.push("/register")}
                        style={styles.registerContainer}
                    >
                        <Text style={styles.register}>
                            {"Don't have an account?"}
                            <Text style={{ color: "#dc2626", fontWeight: "700" }}>
                                {" "}
                                Register
                            </Text>
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#fff",
    },

    keyboardView: {
        flex: 1,
    },

    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 28,
        paddingTop: 36,
        paddingBottom: 40,
    },

    logoContainer: {
        alignItems: "center",
        marginBottom: 16,
    },

    logo: {
        width: 240,
        height: 110,
    },

    title: {
        fontSize: 28,
        fontWeight: "700",
        textAlign: "center",
        color: "#111827",
        marginBottom: 6,
    },

    subtitle: {
        fontSize: 14,
        color: "#6b7280",
        textAlign: "center",
        marginBottom: 28,
    },

    fieldContainer: {
        marginBottom: 16,
    },

    fieldLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: "#374151",
        marginBottom: 6,
        marginLeft: 2,
    },

    inputBox: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1.5,
        borderColor: "#e5e7eb",
        borderRadius: 14,
        paddingHorizontal: 14,
        height: 54,
        backgroundColor: "#f9fafb",
    },

    inputBoxFocused: {
        borderColor: "#dc2626",
        backgroundColor: "#ffffff",
    },

    fieldIcon: {
        marginRight: 10,
    },

    input: {
        flex: 1,
        fontSize: 15,
        color: "#111827",
        height: "100%",
        paddingVertical: 0,
    },

    eyeButton: {
        padding: 4,
    },

    forgotContainer: {
        alignSelf: "flex-end",
        marginTop: 4,
        marginBottom: 22,
    },

    forgot: {
        color: "#dc2626",
        fontSize: 14,
        fontWeight: "600",
    },

    button: {
        backgroundColor: "#dc2626",
        height: 54,
        borderRadius: 14,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#dc2626",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 3,
    },

    buttonText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 17,
    },

    registerContainer: {
        marginTop: 24,
        alignItems: "center",
    },

    register: {
        fontSize: 15,
        color: "#6b7280",
    },
});
