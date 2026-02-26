import jwt from "jsonwebtoken";
import crypto from "crypto";
import { UserDocument } from "../models/user.model.js";
import { JWT_SECRET } from "./env.js";
import { createToken } from "../repositories/refresh-token.repository.js";

export const generateTokens = async (user: UserDocument) => {
  const accessToken = jwt.sign(
    {
      userId: user._id,
      username: user.username,
    },
    JWT_SECRET,
    { expiresIn: "60m" }, // ne bi trebalo vise od 15min
  );

  const refreshToken = crypto.randomBytes(40).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // refresh token expires in 7 days

  await createToken(refreshToken, user._id, expiresAt);

  return { accessToken, refreshToken };
};
