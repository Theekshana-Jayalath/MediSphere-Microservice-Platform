import express from "express";
import { registerPatient, loginUser } from "../controllers/authController.js";

const router = express.Router();

router.post("/register", registerPatient);
router.post("/login", loginUser);

export default router;