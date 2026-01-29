import { Request, Response } from "express";
import logger from "../utils/logger.js";
import { registrationSchema } from "../utils/validationSchemas.js";
import UserModel from "../models/user.model.js";
import generateTokens from "../utils/generateToken.js";

// user registration
export const userRegistration = async (req: Request, res: Response) => {
  logger.info("Registration endpoint hit...");
  try {
    const result = await registrationSchema.safeParseAsync(req.body);
    if (!result.success) {
      logger.warn("Validation error", result.error.message);

      const errors = result.error.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      }));
      return res.status(400).json({
        success: false,
        message: errors,
      });
    }
    const { email, password, username } = result.data;

    let user = await UserModel.findOne({ $or: [{ username }, { email }] });
    if (user) {
      logger.warn("User already exists");
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    user = new UserModel({ username, email, password });
    await user.save();
    logger.info("User saved successfully", user._id);

    const { accessToken, refreshToken } = await generateTokens(user);

    return res.status(201).json({
      success: true.valueOf,
      message: "User registered successfully",
      accessToken,
      refreshToken,
    });
  } catch (error) {
    logger.error("Registration error occured", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// user login

// refresh token

// logout
