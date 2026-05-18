import { Schema, model, models } from "mongoose";

const trainingModuleSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    sopContent: { type: String, required: true }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

export const TrainingModule =
  models.TrainingModule || model("TrainingModule", trainingModuleSchema, "trainingModules");
