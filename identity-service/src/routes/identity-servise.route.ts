import { Router } from "express";
import { userRegistration } from "../controllers/identity.controller.js";

const router = Router();

router.post("/register", userRegistration);

export default router;
