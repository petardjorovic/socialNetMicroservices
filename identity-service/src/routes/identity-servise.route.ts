import { Router } from "express";
import {
  userLogin,
  userLogout,
  userRefreshToken,
  userRegistration,
} from "../controllers/identity.controller.js";

const router = Router();

router.post("/register", userRegistration);
router.post("/login", userLogin);
router.post("/refresh", userRefreshToken);
router.post("/logout", userLogout);

export default router;
