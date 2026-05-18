import { Schema, model, models } from "mongoose";

const traineeScoreSchema = new Schema(
  {
    moduleId: { type: String, required: true },
    score: { type: Number, required: true },
    passed: { type: Boolean, required: true }
  },
  { _id: false }
);

const traineeSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    completedModules: { type: [String], default: [] },
    scores: { type: [traineeScoreSchema], default: [] }
  },
  {
    timestamps: true
  }
);

export const Trainee = models.Trainee || model("Trainee", traineeSchema, "trainees");
