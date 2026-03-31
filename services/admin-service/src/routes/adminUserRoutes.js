import express from "express";
import {
  getAllUsers,
  getUserById,
  activateUser,
  deactivateUser,
  deleteUser,
} from "../controllers/adminUserController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(authMiddleware, adminOnly);

router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.put("/:id/activate", activateUser);
router.put("/:id/deactivate", deactivateUser);
router.delete("/:id", deleteUser);

export default router;