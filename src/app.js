import express from "express";
import cors from "cors";
import { getDatabase } from "./config/db.js";
import booksRouter from "./routes/books.routes.js";

const app = express();

const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));

app.get("/", (request, response) => {
  response.json({
    name: "BookNook API",
    version: "1.0.0",
    status: "ok",
    message: "Add a book, borrow a book, return a book.",
  });
});

app.get("/health", async (request, response) => {
  await getDatabase().command({ ping: 1 });

  response.json({
    status: "ok",
    database: "connected",
    timestamp: new Date().toISOString(),
  });
});

app.use("/books", booksRouter);

app.use((request, response) => {
  response.status(404).json({
    message: `Route ${request.method} ${request.originalUrl} was not found.`,
  });
});

app.use((error, request, response, next) => {
  console.error(error);

  response.status(error.status || 500).json({
    message: error.message || "Something went wrong on the server.",
  });
});

export default app;
