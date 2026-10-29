import express from "express";

import optionalAuth from "../middlewares/optionalAuth.middleware.js";
import authMiddleware from "../middlewares/auth.middleware.js";

import {
  createDisasterEmergency,
  getDisasterEmergency,
  getUserDisasterEmergencies,
  uploadDisasterEvidence,
} from "../controllers/disasterEmergency.controller.js";

const router = express.Router();

// Citizen: create emergency
router.post(
  "/",
  optionalAuth,
  createDisasterEmergency
);

// Logged-in citizen: emergency history
router.get(
  "/user",
  authMiddleware,
  getUserDisasterEmergencies
);

// Get a specific emergency
router.get(
  "/:id",
  optionalAuth,
  getDisasterEmergency
);

// Upload additional evidence
router.post(
  "/:id/evidence",
  optionalAuth,
  uploadDisasterEvidence
);

export default router;