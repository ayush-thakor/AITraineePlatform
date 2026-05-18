import { Schema, model, models, Types } from "mongoose";

const quizQuestionSchema = new Schema(
  {
    question: { type: String, required: true },
    options: { type: [String], required: true },
    correctAnswerIndex: { type: Number, required: true },
    explanation: { type: String, required: true }
  },
  { _id: false }
);

const quizSchema = new Schema(
  {
    moduleId: { type: Types.ObjectId, required: true, ref: "TrainingModule", unique: true },
    questions: { type: [quizQuestionSchema], required: true }
  },
  {
    timestamps: true
  }
);

export const Quiz = models.Quiz || model("Quiz", quizSchema, "quizzes");
