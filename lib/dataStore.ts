import { randomUUID } from "crypto";
import { tryConnectToDatabase } from "@/lib/mongodb";
import type { AuthUser } from "@/lib/users";
import { Quiz } from "@/models/Quiz";
import { SopChunk } from "@/models/SopChunk";
import { SupportQuery } from "@/models/SupportQuery";
import { Trainee } from "@/models/Trainee";
import { TrainingModule } from "@/models/TrainingModule";

export type ModuleRecord = {
  _id: string;
  title: string;
  description?: string;
  sopContent: string;
  createdAt: string | Date;
};

export type QuizQuestionRecord = {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
};

export type QuizRecord = {
  moduleId: string;
  questions: QuizQuestionRecord[];
};

export type ScoreRecord = {
  moduleId: string;
  score: number;
  passed: boolean;
  attemptedAt?: string | Date;
};

export type TraineeRecord = {
  _id?: string;
  id?: string;
  userId?: string;
  name: string;
  completedModules?: string[];
  scores?: ScoreRecord[];
};

export type SopChunkRecord = {
  moduleId: string;
  text: string;
  embedding: number[];
};

type MemoryStore = {
  modules: ModuleRecord[];
  quizzes: QuizRecord[];
  trainees: TraineeRecord[];
  chunks: SopChunkRecord[];
  supportQueries: Array<{
    traineeId: string;
    traineeName: string;
    question: string;
    aiAnswer: string;
    escalated: boolean;
    createdAt: Date;
  }>;
};

declare global {
  var aiTraineeMemoryStore: MemoryStore | undefined;
}

const sampleModule: ModuleRecord = {
  _id: "demo-customer-onboarding",
  title: "Customer Onboarding Basics",
  description: "A sample SOP module available when MongoDB is not running.",
  sopContent: `Customer onboarding SOP

1. Confirm the customer's name, account number, and onboarding goal.
2. Review the plan, start date, and primary success metric.
3. Share the setup checklist and assign each item an owner.
4. If the customer asks about unsupported features, note the request and escalate it to the manager.
5. Close the session by confirming next steps and the follow-up date.`,
  createdAt: new Date("2026-05-18T00:00:00.000Z")
};

const sampleQuiz: QuizRecord = {
  moduleId: sampleModule._id,
  questions: [
    {
      question: "What should be confirmed first during onboarding?",
      options: [
        "The customer's name, account number, and goal",
        "The invoice tax category only",
        "A social media announcement",
        "The support agent's weekly schedule"
      ],
      correctAnswerIndex: 0,
      explanation: "The SOP starts by confirming customer identity and onboarding intent."
    },
    {
      question: "What should happen when a customer asks about unsupported features?",
      options: [
        "Promise immediate delivery",
        "Ignore the request",
        "Note the request and escalate it to the manager",
        "Delete the onboarding checklist"
      ],
      correctAnswerIndex: 2,
      explanation: "Unsupported feature requests should be captured and escalated."
    }
  ]
};

const store =
  global.aiTraineeMemoryStore ??
  {
    modules: [sampleModule],
    quizzes: [sampleQuiz],
    trainees: [],
    chunks: [
      {
        moduleId: sampleModule._id,
        text: sampleModule.sopContent,
        embedding: []
      }
    ],
    supportQueries: []
  };

global.aiTraineeMemoryStore = store;

function serializeModule(module: ModuleRecord): ModuleRecord {
  return {
    ...module,
    _id: String(module._id),
    createdAt: module.createdAt instanceof Date ? module.createdAt.toISOString() : module.createdAt
  };
}

function isMongoObjectId(value: string) {
  return /^[a-f\d]{24}$/i.test(value);
}

export async function listModules() {
  if (await tryConnectToDatabase()) {
    const modules = await TrainingModule.find({}, { title: 1, description: 1, createdAt: 1 })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return JSON.parse(JSON.stringify(modules)) as ModuleRecord[];
  }

  return [...store.modules]
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .map(serializeModule);
}

export async function getModuleById(id: string) {
  if ((await tryConnectToDatabase()) && isMongoObjectId(id)) {
    const module = await TrainingModule.findById(id).lean().exec();

    return module ? (JSON.parse(JSON.stringify(module)) as ModuleRecord) : null;
  }

  const module = store.modules.find((item) => item._id === id);
  return module ? serializeModule(module) : null;
}

export async function createTrainingModule(input: {
  title: string;
  description?: string;
  sopContent: string;
}) {
  if (await tryConnectToDatabase()) {
    const module = await TrainingModule.create(input);
    return JSON.parse(JSON.stringify(module)) as ModuleRecord;
  }

  const module: ModuleRecord = {
    _id: randomUUID(),
    title: input.title.trim(),
    description: input.description?.trim() ?? "",
    sopContent: input.sopContent,
    createdAt: new Date()
  };

  store.modules.unshift(module);
  return serializeModule(module);
}

export async function replaceModuleChunks(moduleId: string, chunks: SopChunkRecord[]) {
  if ((await tryConnectToDatabase()) && isMongoObjectId(moduleId)) {
    await SopChunk.deleteMany({ moduleId });

    if (chunks.length > 0) {
      await SopChunk.insertMany(chunks);
    }

    return;
  }

  store.chunks = store.chunks.filter((chunk) => chunk.moduleId !== moduleId);
  store.chunks.push(...chunks);
}

export async function listModuleChunks(moduleId: string) {
  if ((await tryConnectToDatabase()) && isMongoObjectId(moduleId)) {
    return (await SopChunk.find({ moduleId }).lean().exec()) as unknown as SopChunkRecord[];
  }

  return store.chunks.filter((chunk) => chunk.moduleId === moduleId);
}

export async function getQuizByModule(moduleId: string) {
  if ((await tryConnectToDatabase()) && isMongoObjectId(moduleId)) {
    const quiz = await Quiz.findOne({ moduleId }).lean().exec();

    return quiz ? (JSON.parse(JSON.stringify(quiz)) as QuizRecord) : null;
  }

  return store.quizzes.find((quiz) => quiz.moduleId === moduleId) ?? null;
}

export async function upsertQuiz(moduleId: string, questions: QuizQuestionRecord[]) {
  if ((await tryConnectToDatabase()) && isMongoObjectId(moduleId)) {
    const quiz = await Quiz.findOneAndUpdate(
      { moduleId },
      { moduleId, questions },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    )
      .lean()
      .exec();

    return JSON.parse(JSON.stringify(quiz)) as QuizRecord;
  }

  const existingIndex = store.quizzes.findIndex((quiz) => quiz.moduleId === moduleId);
  const quiz = { moduleId, questions };

  if (existingIndex >= 0) {
    store.quizzes[existingIndex] = quiz;
  } else {
    store.quizzes.push(quiz);
  }

  return quiz;
}

export async function getTraineeForUser(user: AuthUser) {
  if (await tryConnectToDatabase()) {
    const trainee = await Trainee.findOne({ $or: [{ userId: user.id }, { name: user.name }] })
      .lean()
      .exec();

    return trainee ? (JSON.parse(JSON.stringify(trainee)) as TraineeRecord) : null;
  }

  return store.trainees.find((trainee) => trainee.userId === user.id || trainee.name === user.name) ?? null;
}

export async function listTrainees() {
  if (await tryConnectToDatabase()) {
    const trainees = await Trainee.find({}, { name: 1, completedModules: 1, scores: 1 })
      .sort({ name: 1 })
      .lean()
      .exec();

    return JSON.parse(JSON.stringify(trainees)) as TraineeRecord[];
  }

  return [...store.trainees].sort((left, right) => left.name.localeCompare(right.name));
}

export async function recordQuizAttempt(user: AuthUser, moduleId: string, score: number, passed: boolean) {
  const attemptedAt = new Date();

  if (await tryConnectToDatabase()) {
    const trainee = await Trainee.findOneAndUpdate(
      { $or: [{ userId: user.id }, { name: user.name }] },
      {
        $set: { userId: user.id, name: user.name },
        $addToSet: { completedModules: moduleId },
        $push: {
          scores: {
            moduleId,
            score,
            passed,
            attemptedAt
          }
        }
      },
      { upsert: true, new: true }
    );

    return trainee.id as string;
  }

  let trainee = store.trainees.find((item) => item.userId === user.id || item.name === user.name);

  if (!trainee) {
    trainee = {
      _id: randomUUID(),
      id: randomUUID(),
      userId: user.id,
      name: user.name,
      completedModules: [],
      scores: []
    };
    store.trainees.push(trainee);
  }

  trainee.userId = user.id;
  trainee.name = user.name;
  trainee.completedModules = Array.from(new Set([...(trainee.completedModules ?? []), moduleId]));
  trainee.scores = [
    ...(trainee.scores ?? []),
    {
      moduleId,
      score,
      passed,
      attemptedAt
    }
  ];

  return trainee.id ?? trainee._id ?? user.id;
}

export async function createSupportQuery(input: {
  traineeId: string;
  traineeName: string;
  question: string;
  aiAnswer: string;
  escalated: boolean;
}) {
  if (await tryConnectToDatabase()) {
    await SupportQuery.create(input);
    return;
  }

  store.supportQueries.push({
    ...input,
    createdAt: new Date()
  });
}
