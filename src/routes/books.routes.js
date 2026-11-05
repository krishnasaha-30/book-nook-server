import { Router } from "express";
import { ObjectId } from "mongodb";
import { getBooksCollection } from "../config/collections.js";

const router = Router();

const MAX_LIMIT = 100;

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseLimit(value) {
  if (value === undefined) {
    return null;
  }

  const limit = Number(value);

  if (!Number.isFinite(limit) || limit <= 0) {
    return null;
  }

  return Math.min(Math.floor(limit), MAX_LIMIT);
}

// GET /books - public
// Supports optional search, category, sort and limit query parameters.
router.get("/", async (request, response) => {
  const { search, category, sort, limit } = request.query;
  const query = {};

  if (typeof search === "string" && search.trim()) {
    const pattern = new RegExp(escapeRegex(search.trim()), "i");
    query.$or = [{ title: pattern }, { author: pattern }];
  }

  if (
    typeof category === "string" &&
    category.trim() &&
    category.trim().toLowerCase() !== "all"
  ) {
    query.category = new RegExp(`^${escapeRegex(category.trim())}$`, "i");
  }

  let cursor = getBooksCollection()
    .find(query)
    .sort({ createdAt: sort === "oldest" ? 1 : -1 });

  const maxResults = parseLimit(limit);

  if (maxResults !== null) {
    cursor = cursor.limit(maxResults);
  }

  const books = await cursor.toArray();

  response.json(books);
});

// GET /books/:id - public
router.get("/:id", async (request, response) => {
  const { id } = request.params;

  if (!ObjectId.isValid(id)) {
    return response.status(400).json({ message: "Invalid book id." });
  }

  const book = await getBooksCollection().findOne({ _id: new ObjectId(id) });

  if (!book) {
    return response.status(404).json({ message: "Book not found." });
  }

  response.json(book);
});

export default router;
