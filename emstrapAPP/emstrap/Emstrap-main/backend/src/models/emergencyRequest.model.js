import mongoose from "mongoose";

const emergencyRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },

    imageUrl: {
      type: String,
      required: false,
    },

    location: {
      latitude: {
        type: Number,
        required: true,
      },

      longitude: {
        type: Number,
        required: true,
      },
    },

    evidence: [
      {
        imageUrl: {
          type: String,
          required: true,
        },

        uploadedAt: {
          type: Date,
          default: Date.now,
        },

        aiAnalysis: {
          predictedClass: {
            type: String,
            default: "",
          },

          confidence: {
            type: Number,
            default: 0,
          },

          severity: {
            type: String,
            enum: [
              "LOW",
              "MODERATE",
              "HIGH",
              "CRITICAL",
            ],
            default: "LOW",
          },

          recommendedAmbulance: {
            type: String,
            default: "",
          },

          allProbabilities: {
            type: Object,
            default: {},
          },
        },
      },
    ],
    // AI Duplicate Detection Fields
    embedding: {
      type: [Number],
      default: [],
    },

    duplicateDetected: {
      type: Boolean,
      default: false,
    },

    duplicateOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EmergencyRequest",
      default: null,
    },

    similarityScore: {
      type: Number,
      default: 0,
    },

    aiAnalysis: {
      predictedClass: {
        type: String,
        default: "",
      },

      confidence: {
        type: Number,
        default: 0,
      },

      severity: {
        type: String,
        enum: [
          "LOW",
          "MODERATE",
          "HIGH",
          "CRITICAL",
        ],
        default: "LOW",
      },

      recommendedAmbulance: {
        type: String,
        default: "",
      },

      allProbabilities: {
        type: Object,
        default: {},
      },
    },


    status: {
  type: String,
  enum: [
    "EMERGENCY_SENT",
    "ACKNOWLEDGED",
    "RESPONSE_INITIATED",
    "RESPONDER_ASSIGNED",
    "EN_ROUTE",
    "ARRIVED",
    "RESOLVED",
    "SEARCHING_FOR_RESPONSE",
    "NO_RESOURCE_AVAILABLE",
    "ESCALATED",
    "CANCELLED",
  ],
  default: "EMERGENCY_SENT",
},
    hospitalResolved: {
      type: Boolean,
      default: false,
    },

    hospitalResolvedAt: {
      type: Date,
      default: null,
    },

    hospitalResolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      default: null,
    },

    ambulance: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ambulance",
      default: null,
    },

    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      default: null,
    },

    declinedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Ambulance",
      },
    ],

    requestType: {
      type: String,
      enum: ["EMERGENCY", "BOOKING"],
      default: "EMERGENCY",
    },
  },
  { timestamps: true }
);

const EmergencyRequest =
  mongoose.models.EmergencyRequest ||
  mongoose.model(
    "EmergencyRequest",
    emergencyRequestSchema
  );

export default EmergencyRequest;
