import mongoose from "mongoose";

export interface RefreshTokenDocument {
  token: string;
  user: mongoose.Types.ObjectId;
  expiresAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const refreshTokenSchema = new mongoose.Schema<RefreshTokenDocument>(
  {
    token: {
      type: String,
      required: true,
      unique: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const RefreshTokenModel = mongoose.model<
  RefreshTokenDocument,
  mongoose.Model<RefreshTokenDocument>
>("RefreshToken", refreshTokenSchema);

export default RefreshTokenModel;
