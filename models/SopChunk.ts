import { Schema, model, models, Types } from "mongoose";

const sopChunkSchema = new Schema(
  {
    moduleId: { type: Types.ObjectId, required: true, ref: "TrainingModule", index: true },
    text: { type: String, required: true },
    embedding: { type: [Number], required: true }
  },
  {
    timestamps: false
  }
);

export const SopChunk = models.SopChunk || model("SopChunk", sopChunkSchema, "sopChunks");
