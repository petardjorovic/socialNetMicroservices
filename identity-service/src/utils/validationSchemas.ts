import z from "zod";

export type RegistrationInput = z.infer<typeof registrationSchema>;

export const registrationSchema = z
  .object({
    username: z.string().min(3).max(50),
    email: z.email(),
    password: z.string().min(6),
  })
  .strict();
