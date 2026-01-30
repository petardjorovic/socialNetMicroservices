import z from "zod";

export type RegistrationInput = z.infer<typeof registrationSchema>;

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
