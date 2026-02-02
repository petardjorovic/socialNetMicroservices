import z from "zod";

export type RegistrationInput = z.infer<typeof registrationSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

export const loginSchema = z
  .object({
    email: z.email(),
    password: z.string().min(6),
  })
  .strict();

export const registrationSchema = loginSchema
  .extend({
    username: z.string().min(3).max(50),
  })
  .strict();

export const refreshTokenSchema = z
  .object({
    refreshToken: z.string().min(80),
  })
  .strict();

export const logoutSchema = z
  .object({
    refreshToken: z.string().min(80),
  })
  .strict();
