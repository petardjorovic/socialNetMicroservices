import mongoose from "mongoose";

export interface MediaDocument {
  publicId: string;
  originalName: string;
  mimeType: string;
  url: string;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt?: Date;
}

const mediaSchema = new mongoose.Schema<MediaDocument>(
  {
    publicId: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const MediaModel = mongoose.model<MediaDocument, mongoose.Model<MediaDocument>>(
  "Media",
  mediaSchema,
);

export default MediaModel;
