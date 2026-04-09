import express from "express";
import { getDashboardStats } from "../controllers/adminDashboardController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(authMiddleware, adminOnly);

router.get("/", getDashboardStats);

export default router;