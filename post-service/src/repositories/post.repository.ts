import PostModel, { PostDocument } from "../models/post.model.js";

export const createNewPost = async (
  userId: string,
  content: string,
  mediaIds: string[] = [],
): Promise<PostDocument> => {
  const newlyCreatedPost = await PostModel.create({
    user: userId,
    content,
    mediaIds,
  });

  return newlyCreatedPost;
};

export const getPostsAndPostsCount = async (
  skip: number,
  limitPerPage: number,
): Promise<{ posts: PostDocument[]; totalPosts: number }> => {
  const [posts, totalPosts] = await Promise.all([
    PostModel.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitPerPage)
      .lean(),
    PostModel.countDocuments(),
  ]);

  return { posts, totalPosts };
};

export const findPostById = async (
  postId: string,
): Promise<PostDocument | null> => {
  const post = await PostModel.findById(postId);
  return post;
};

export const updatePost = async (
  postId: string,
  userId: string,
  updateData: Partial<Pick<PostDocument, "content" | "mediaIds">>,
) => {
  const updatedPost = await PostModel.findOneAndUpdate(
    { _id: postId, user: userId },
    updateData,
    { new: true },
  ).lean();

  return updatedPost;
};

export const findPostAndDelete = async (postId: string, userId: string) => {
  return PostModel.findOneAndDelete({
    _id: postId,
    user: userId,
  });
};
