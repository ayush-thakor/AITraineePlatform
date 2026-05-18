import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Missing MONGODB_URI environment variable.");
}

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cached = global.mongooseCache ?? { conn: null, promise: null };
let unavailableUntil = 0;

global.mongooseCache = cached;

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI as string, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 1500
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export async function tryConnectToDatabase() {
  if (Date.now() < unavailableUntil) {
    return null;
  }

  try {
    return await connectToDatabase();
  } catch {
    cached.conn = null;
    cached.promise = null;
    unavailableUntil = Date.now() + 5000;
    return null;
  }
}
