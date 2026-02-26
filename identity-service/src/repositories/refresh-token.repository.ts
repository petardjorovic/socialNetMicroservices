import mongoose from "mongoose";
import { RefreshTokenModel } from "../models/refresh-token.model.js";

export const deleteOneToken = async (token: string) => {
  return RefreshTokenModel.deleteOne({ token });
};

export const findOneTokenAndDelete = async (token: string) => {
  const storedToken = await RefreshTokenModel.findOneAndDelete({
    token,
    expiresAt: { $gt: new Date() },
  }).lean();
  return storedToken;
};

export const createToken = async (
  token: string,
  userId: mongoose.Types.ObjectId,
  expiresAt: Date,
) => {
  return RefreshTokenModel.create({ token, user: userId, expiresAt });
};
