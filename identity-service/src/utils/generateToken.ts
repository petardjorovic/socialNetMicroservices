import jwt from "jsonwebtoken";
import crypto from "crypto";
import { UserDocument } from "../models/user.model.js";
import { JWT_SECRET } from "./env.js";
import RefreshTokenModel from "../models/refresh-token.model.js";

const generateTokens = async (user: UserDocument) => {
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

  await RefreshTokenModel.create({
    token: refreshToken,
    user: user._id,
    expiresAt,
  });

  return { accessToken, refreshToken };
};

export default generateTokens;
