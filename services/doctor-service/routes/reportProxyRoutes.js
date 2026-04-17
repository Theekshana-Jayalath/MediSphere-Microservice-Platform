import express from "express";
import { getDoctorReports } from "../controllers/reportProxyController.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get(
  "/me",
  protect,
  authorizeRoles("doctor", "admin", "ADMIN"),
  getDoctorReports
);

export default router;
