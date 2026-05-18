import { Schema, model, models } from "mongoose";

const supportQuerySchema = new Schema(
  {
    traineeId: { type: String, default: "guest" },
    traineeName: { type: String, default: "" },
    question: { type: String, required: true },
    aiAnswer: { type: String, required: true },
    escalated: { type: Boolean, required: true }
  },
  {
    timestamps: true
  }
);

export const SupportQuery =
  models.SupportQuery || model("SupportQuery", supportQuerySchema, "supportQueries");
