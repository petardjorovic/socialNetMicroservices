import { Router } from "express";
import {
  userLogin,
  userRefreshToken,
  userRegistration,
} from "../controllers/identity.controller.js";

const router = Router();

router.post("/register", userRegistration);
router.post("/login", userLogin);
router.post("/refresh", userRefreshToken);

export default router;
