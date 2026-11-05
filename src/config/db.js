import "dotenv/config";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error(
    "MONGODB_URI is missing. Copy .env.example to .env and add your connection string.",
  );
}

const client = new MongoClient(uri);

let database = null;

export async function connectToDatabase() {
  if (database) {
    return database;
  }

  await client.connect();
  database = client.db(process.env.DB_NAME || "booknook");
  await database.command({ ping: 1 });

  console.log(`MongoDB connected: ${database.databaseName}`);

  return database;
}

export function getDatabase() {
  if (!database) {
    throw new Error("MongoDB is not connected yet.");
  }

  return database;
}

export async function closeDatabase() {
  await client.close();
  database = null;
}

export { client };
