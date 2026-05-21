import { Schema, model, models } from "mongoose";

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },
    salt: { type: String, required: true }
  },
  {
    timestamps: true
  }
);

export const User = models.User || model("User", userSchema, "users");
