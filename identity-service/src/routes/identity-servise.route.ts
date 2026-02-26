import { Router } from "express";
import {
  loginSchema,
  logoutSchema,
  refreshTokenSchema,
  registrationSchema,
} from "../utils/validationSchemas.js";
import {
  userLogin,
  userLogout,
  userRefreshToken,
  userRegistration,
} from "../controllers/identity.controller.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";

const router = Router();

router.post(
  "/register",
  validateRequest(registrationSchema),
  asyncHandler(userRegistration),
);
router.post("/login", validateRequest(loginSchema), asyncHandler(userLogin));
router.post(
  "/refresh",
  validateRequest(refreshTokenSchema),
  asyncHandler(userRefreshToken),
);
router.post("/logout", validateRequest(logoutSchema), asyncHandler(userLogout));

export default router;
