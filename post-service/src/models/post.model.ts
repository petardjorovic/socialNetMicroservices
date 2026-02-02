import mongoose from "mongoose";

export interface PostDocument {
  user: mongoose.Types.ObjectId;
  content: string;
  mediaIds: string[];
  createdAt: Date;
  updatedAt?: Date;
}

const postSchema = new mongoose.Schema<PostDocument>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    mediaIds: {
      type: [
        {
          type: String,
          trim: true,
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

// there is no need for this index, because we will have separate search service
// postSchema.index({ content: "text" });

const PostModel = mongoose.model<PostDocument, mongoose.Model<PostDocument>>(
  "Post",
  postSchema,
);

export default PostModel;
