import mongoose from "mongoose";

interface SearchPostDocument {
  postId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  content: string;
  createdAt: Date;
}

const searchPostSchema = new mongoose.Schema<SearchPostDocument>({
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    unique: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true,
  },
  content: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    required: true,
  },
});

searchPostSchema.index({ content: "text" });
searchPostSchema.index({ createdAt: -1 });

const SearchPostModel = mongoose.model<
  SearchPostDocument,
  mongoose.Model<SearchPostDocument>
>("SearchPost", searchPostSchema, "search_post");

export default SearchPostModel;
