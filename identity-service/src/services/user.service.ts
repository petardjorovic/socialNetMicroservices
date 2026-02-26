import { hashPassword, validatePassword } from "../utils/crypto.js";
import logger from "../utils/logger.js";
import { LoginInput, RegistrationInput } from "../utils/validationSchemas.js";
import { BadRequestError, UnauthorizedError } from "../utils/AppError.js";
import { generateTokens } from "../utils/generateToken.js";
import {
  createUser,
  findUserByEmail,
  findUserByEmailOrUsername,
  findUserById,
} from "../repositories/user.repository.js";
import {
  deleteOneToken,
  findOneTokenAndDelete,
} from "../repositories/refresh-token.repository.js";

export const registerUser = async (data: RegistrationInput) => {
  const existing = await findUserByEmailOrUsername(data);
  if (existing) {
    logger.warn("User already exists");
    throw new BadRequestError("User already exists");
  }

  const hashedPassword = await hashPassword(data.password);

  const user = await createUser({ ...data, password: hashedPassword });
  logger.info("User saved successfully", user._id);

  //* generate tokens
  const tokens = await generateTokens(user);

  return tokens;
};

export const loginUser = async (data: LoginInput) => {
  //* check whether user exists in DB
  const user = await findUserByEmail(data.email);
  if (!user) {
    logger.warn("User not found");
    throw new UnauthorizedError("Invalid credentials");
  }

  //* check whether user password is valid
  const isValid = await validatePassword(data.password, user.password);
  if (!isValid) {
    logger.warn("Wrong user password");
    throw new UnauthorizedError("Invalid credentials");
  }

  //* generate tokens
  const tokens = await generateTokens(user);

  return tokens;
};

export const refreshToken = async (token: string) => {
  //* check whether token exists/valid in db and delete it
  const storedToken = await findOneTokenAndDelete(token);
  if (!storedToken) {
    logger.warn("Invalid or expired refresh token");
    throw new UnauthorizedError("Invalid or expired refresh token");
  }

  //* check whether user exist in db
  const user = await findUserById(storedToken.user);
  if (!user) {
    logger.warn("User for this not found");
    throw new UnauthorizedError("Invalid or expired refresh token");
  }

  //* generate new tokens
  const { accessToken, refreshToken } = await generateTokens(user);

  return { newAccessToken: accessToken, newRefreshToken: refreshToken };
};

export const logoutUser = async (token: string) => {
  await deleteOneToken(token);
  logger.info("Refresh token deleted for logout");
};
