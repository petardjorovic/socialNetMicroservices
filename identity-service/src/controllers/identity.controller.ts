import { Request, Response } from "express";
import logger from "../utils/logger.js";
import {
  loginSchema,
  refreshTokenSchema,
  registrationSchema,
} from "../utils/validationSchemas.js";
import UserModel from "../models/user.model.js";
import generateTokens from "../utils/generateToken.js";
import RefreshTokenModel from "../models/refresh-token.model.js";

// USER REGISTRATION
export const userRegistration = async (req: Request, res: Response) => {
  logger.info("User Registration endpoint hit...");
  try {
    const result = await registrationSchema.safeParseAsync(req.body);
    if (!result.success) {
      logger.warn("Validation error", result.error.message);

      const errors = result.error.issues.map((i) => ({
        field: i.path.join("."),
        error: i.message,
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
    logger.error("User login error occurred", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// USER REFRESH TOKEN
export const userRefreshToken = async (req: Request, res: Response) => {
  //* logging
  logger.info("User refresh token endpoint hit...");

  try {
    //* check request
    const result = await refreshTokenSchema.safeDecodeAsync(req.body);
    if (!result.success) {
      logger.warn("Validation error", result.error.message);

      const errors = result.error.issues.map((i) => ({
        field: i.path.join("."),
        error: i.message,
      }));

      return res.status(400).json({ success: false, message: errors });
    }

    //* check whether token exists/valid in db
    const storedToken = await RefreshTokenModel.findOne({
      token: result.data.refreshToken,
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      logger.warn("Invalid or expired refresh token");

      return res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token",
      });
    }

    //* check whether user exist in db
    const user = await UserModel.findById(storedToken.user);
    if (!user) {
      logger.warn("User not found");

      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    //* generate new tokens
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
      await generateTokens(user);

    //* delete old refresh token from db
    await RefreshTokenModel.deleteOne({ _id: storedToken._id });

    //* return response
    return res.status(200).json({
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    logger.error("User refresh token error occured", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
// logout
