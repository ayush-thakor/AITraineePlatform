import { Schema, model, models } from "mongoose";

const traineeScoreSchema = new Schema(
  {
    moduleId: { type: String, required: true },
    score: { type: Number, required: true },
    passed: { type: Boolean, required: true },
    attemptedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const traineeSchema = new Schema(
  {
    userId: { type: String, index: true },
    name: { type: String, required: true, trim: true },
    completedModules: { type: [String], default: [] },
    scores: { type: [traineeScoreSchema], default: [] }
  },
  {
    timestamps: true
  }
);

export const Trainee = models.Trainee || model("Trainee", traineeSchema, "trainees");
