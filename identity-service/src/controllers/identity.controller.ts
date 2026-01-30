import { Request, Response } from "express";
import logger from "../utils/logger.js";
import { loginSchema, registrationSchema } from "../utils/validationSchemas.js";
import UserModel from "../models/user.model.js";
import generateTokens from "../utils/generateToken.js";

// USER REGISTRATION
export const userRegistration = async (req: Request, res: Response) => {
  logger.info("User Registration endpoint hit...");
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
      success: true,
      message: "User registered successfully",
      accessToken,
      refreshToken,
    });
  } catch (error) {
    logger.error("User registration error occured", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// USER LOGIN
export const userLogin = async (req: Request, res: Response) => {
  //* logging
  logger.info("User Login endpoint hit...");

  try {
    //* validate request
    const result = await loginSchema.safeParseAsync(req.body);

    if (!result.success) {
      logger.warn("Validation error", result.error.message);

      const errors = result.error.issues.map((i) => ({
        field: i.path.join("."),
        error: i.message,
      }));

      return res.status(400).json({ success: false, message: errors });
    }

    const { email, password } = result.data;

    //* check whether user exists in DB
    const user = await UserModel.findOne({ email });

    if (!user) {
      logger.warn("User not found");
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }

    //* check whether password is valid
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      logger.warn("Wrong user password");
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }

    //* generate tokens
    const { accessToken, refreshToken } = await generateTokens(user);

    //* send response
    res.status(200).json({
      success: true,
      message: "User logged in successfully",
      accessToken,
      refreshToken,
    });
  } catch (error) {
    logger.error("User login error occured", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// refresh token

// logout
