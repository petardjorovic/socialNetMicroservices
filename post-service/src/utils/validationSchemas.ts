import mongoose from "mongoose";
import z from "zod";

export type CreatePost = z.infer<typeof createPostSchema>;
export type GetPosts = z.infer<typeof getPostsSchema>;
export type UpdatePost = z.infer<typeof updatePostSchema>;
export type PostId = z.infer<typeof postIdSchema>;

export const createPostSchema = z.object({
  content: z.string().min(1),
  mediaIds: z.array(z.string()).optional(),
});

export const getPostsSchema = z.object({
  page: z.string().default("1").optional(),
  limit: z.string().default("10").optional(),
});

export const postIdSchema = z.object({
  id: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    error: "Invalid post ID",
  }),
});

export const updatePostSchema = createPostSchema.partial();
