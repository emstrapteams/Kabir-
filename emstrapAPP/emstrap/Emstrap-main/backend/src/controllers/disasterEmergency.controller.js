import EmergencyRequest from "../models/emergencyRequest.model.js";
import cloudinary from "../config/cloudinary.js";

const DISASTER_TYPES = [
    "FLOOD",
    "LANDSLIDE",
    "EARTHQUAKE",
    "CYCLONE_STORM",
    "FIRE",
    "BUILDING_COLLAPSE",
    "ACCIDENT",
    "MEDICAL_EMERGENCY",
    "OTHER",
];

export const createDisasterEmergency = async (req, res) => {
    try {
        const {
            latitude,
            longitude,
            disasterType,
            description,
            voiceTranscript,
            affectedPeople,
            immediateDanger,
            requiredResponse,
            imageUrl,
        } = req.body;

        if (
            latitude === undefined ||
            longitude === undefined ||
            Number.isNaN(Number(latitude)) ||
            Number.isNaN(Number(longitude))
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid latitude and longitude are required.",
            });
        }

        if (!disasterType || !DISASTER_TYPES.includes(disasterType)) {
            return res.status(400).json({
                success: false,
                message: "A valid disasterType is required.",
                allowedTypes: DISASTER_TYPES,
            });
        }

        let secureImageUrl = "";

        if (imageUrl) {
            if (imageUrl.startsWith("https://res.cloudinary.com")) {
                secureImageUrl = imageUrl;
            } else {
                try {
                    const uploadResponse =
                        await cloudinary.uploader.upload(imageUrl, {
                            folder: "disaster-emergencies",
                        });

                    secureImageUrl = uploadResponse.secure_url;
                } catch (uploadError) {
                    console.error(
                        "Disaster emergency image upload failed:",
                        uploadError.message
                    );

                    return res.status(500).json({
                        success: false,
                        message: "Image upload failed.",
                    });
                }
            }
        }

        const emergency = await EmergencyRequest.create({
            user: req.user?._id || undefined,

            imageUrl: secureImageUrl,

            location: {
                latitude: Number(latitude),
                longitude: Number(longitude),
            },

            disasterType,

            description: description || "",

            voiceTranscript: voiceTranscript || "",

            affectedPeople:
                affectedPeople !== undefined
                    ? Math.max(0, Number(affectedPeople) || 0)
                    : 0,

            immediateDanger: Boolean(immediateDanger),

            requiredResponse: Array.isArray(requiredResponse)
                ? requiredResponse
                : [],

            status: "EMERGENCY_SENT",
        });

        return res.status(201).json({
            success: true,
            message: "Disaster emergency sent successfully.",
            data: emergency,
        });
    } catch (error) {
        console.error(
            "Create disaster emergency error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const getDisasterEmergency = async (req, res) => {
    try {
        const emergency =
            await EmergencyRequest.findById(req.params.id)
                .populate(
                    "user",
                    "name mobile email address city"
                );

        if (!emergency) {
            return res.status(404).json({
                success: false,
                message: "Disaster emergency not found.",
            });
        }

        return res.status(200).json({
            success: true,
            data: emergency,
        });
    } catch (error) {
        console.error(
            "Get disaster emergency error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const getUserDisasterEmergencies = async (
    req,
    res
) => {
    try {
        const emergencies = await EmergencyRequest.find({
            user: req.user._id,
        }).sort({
            createdAt: -1,
        });

        return res.status(200).json({
            success: true,
            data: emergencies,
        });
    } catch (error) {
        console.error(
            "Get user disaster emergencies error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const uploadDisasterEvidence = async (
    req,
    res
) => {
    try {
        const { imageUrl } = req.body;

        if (!imageUrl) {
            return res.status(400).json({
                success: false,
                message: "Image is required.",
            });
        }

        const emergency =
            await EmergencyRequest.findById(req.params.id);

        if (!emergency) {
            return res.status(404).json({
                success: false,
                message: "Disaster emergency not found.",
            });
        }

        let secureImageUrl = "";

        if (
            imageUrl.startsWith(
                "https://res.cloudinary.com"
            )
        ) {
            secureImageUrl = imageUrl;
        } else {
            const uploadResponse =
                await cloudinary.uploader.upload(imageUrl, {
                    folder: "disaster-emergencies/evidence",
                });

            secureImageUrl = uploadResponse.secure_url;
        }

        emergency.evidence.push({
            imageUrl: secureImageUrl,
            uploadedAt: new Date(),
        });

        await emergency.save();

        return res.status(200).json({
            success: true,
            message: "Evidence uploaded successfully.",
            evidence: emergency.evidence,
        });
    } catch (error) {
        console.error(
            "Upload disaster evidence error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};