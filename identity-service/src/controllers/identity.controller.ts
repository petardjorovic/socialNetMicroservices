import { Request, Response } from "express";
import logger from "../utils/logger.js";
import {
  loginUser,
  logoutUser,
  refreshToken,
  registerUser,
} from "../services/user.service.js";

// USER REGISTRATION
export const userRegistration = async (req: Request, res: Response) => {
  //* logging
  logger.info("User Registration endpoint hit...");

  //* call service
  const { accessToken, refreshToken } = await registerUser(req.body);

  //* return response
  return res.status(201).json({
    success: true,
    message: "User registered successfully",
    accessToken,
    refreshToken,
  });
};

// USER LOGIN
export const userLogin = async (req: Request, res: Response) => {
  //* logging
  logger.info("User Login endpoint hit...");

  //* call service
  const { accessToken, refreshToken } = await loginUser(req.body);

  //* return response
  return res.status(200).json({
    success: true,
    message: "User logged in successfully",
    accessToken,
    refreshToken,
  });
};

// USER REFRESH TOKEN
export const userRefreshToken = async (req: Request, res: Response) => {
  //* logging
  logger.info("User refresh token endpoint hit...");

  //* call service
  const { newAccessToken, newRefreshToken } = await refreshToken(
    req.body.refreshToken,
  );

  //* return response
  return res.status(200).json({
    success: true,
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  });
};

// LOGOUT
export const userLogout = async (req: Request, res: Response) => {
  //* logging
  logger.info("User logout endpoint hit...");

  //* call service
  await logoutUser(req.body.refreshToken);

  //* return response
  return res
    .status(200)
    .json({ success: true, message: "User logged out successfully" });
};
