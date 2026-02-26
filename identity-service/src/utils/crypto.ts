import bcrypt from "bcrypt";

export const validatePassword = async (
  plain: string,
  hashed: string,
): Promise<boolean> => {
  return bcrypt.compare(plain, hashed);
};

export const hashPassword = async (
  plain: string,
  saltRounds = 10,
): Promise<string> => {
  return bcrypt.hash(plain, saltRounds);
};
