import mongoose from "mongoose";
import { RegistrationInput } from "../utils/validationSchemas.js";
import { UserModel } from "../models/user.model.js";

export const createUser = async (data: RegistrationInput) => {
  return await UserModel.create(data);
};

export const findUserById = async (id: mongoose.Types.ObjectId) => {
  const user = await UserModel.findById(id).lean();
  return user;
};

export const findUserByEmail = async (email: string) => {
  const user = await UserModel.findOne({ email }).lean();
  return user;
};

export const findUserByEmailOrUsername = async (data: RegistrationInput) => {
  const user = await UserModel.findOne({
    $or: [{ email: data.email }, { username: data.username }],
  }).lean();
  return user;
};
