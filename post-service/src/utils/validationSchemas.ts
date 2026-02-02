import z from "zod";

export type createPost = z.infer<typeof createPostSchema>;

export const createPostSchema = z.object({
  content: z.string().min(1),
  mediaIds: z.array(z.string()).optional(),
});
