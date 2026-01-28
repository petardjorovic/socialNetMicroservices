import mongoose from "mongoose";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

export interface UserDocument {
  _id: mongoose.Types.ObjectId;
  username: string;
  email: string;
  password: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserMethods {
  comparePassword(value: string): Promise<boolean>;
}

const userSchema = new mongoose.Schema<UserDocument, {}, UserMethods>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
});

userSchema.methods.comparePassword = async function (val: string) {
  return bcrypt.compare(val, this.password);
};

userSchema.index({ username: "text" });

const UserModel = mongoose.model<
  UserDocument,
  mongoose.Model<UserDocument, {}, UserMethods>
>("User", userSchema);

export default UserModel;
