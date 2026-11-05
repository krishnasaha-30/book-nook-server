import { Router } from "express";
import { ObjectId } from "mongodb";
import { getBooksCollection } from "../config/collections.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { parseBookPayload } from "../utils/bookPayload.js";
import { isBookOwner } from "../utils/ownership.js";

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
  const { search, category, sort, limit, ownerEmail } = request.query;
  const query = {};

  if (typeof search === "string" && search.trim()) {
    const pattern = new RegExp(escapeRegex(search.trim()), "i");
    query.$or = [{ title: pattern }, { author: pattern }];
  }

  if (typeof ownerEmail === "string" && ownerEmail.trim()) {
    query.ownerEmail = new RegExp(`^${escapeRegex(ownerEmail.trim())}$`, "i");
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

// POST /books - private
router.post("/", verifyToken, async (request, response) => {
  if (!request.user?.email) {
    return response.status(401).json({ message: "Authentication required." });
  }

  const { errors, data } = parseBookPayload(request.body);

  if (errors.length > 0) {
    return response.status(400).json({
      message: errors[0],
      errors,
    });
  }

  const now = new Date();

  const book = {
    title: data.title,
    author: data.author,
    category: data.category,
    imageUrl: data.imageUrl,
    description: data.description,
    totalCopies: data.totalCopies,
    availableCopies: data.totalCopies,
    ownerId: request.user.id,
    ownerName: request.user.name || "",
    ownerEmail: request.user.email,
    createdAt: now,
    updatedAt: now,
  };

  const result = await getBooksCollection().insertOne(book);

  response.status(201).json({ _id: result.insertedId, ...book });
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

// PATCH /books/:id - private (owner only)
router.patch("/:id", verifyToken, async (request, response) => {
  const { id } = request.params;

  if (!ObjectId.isValid(id)) {
    return response.status(400).json({ message: "Invalid book id." });
  }

  const books = getBooksCollection();
  const book = await books.findOne({ _id: new ObjectId(id) });

  if (!book) {
    return response.status(404).json({ message: "Book not found." });
  }

  if (!isBookOwner(book, request.user)) {
    return response
      .status(403)
      .json({ message: "You can only edit books you added." });
  }

  const { errors, data } = parseBookPayload(request.body, { partial: true });

  if (errors.length > 0) {
    return response.status(400).json({ message: errors[0], errors });
  }

  if (Object.keys(data).length === 0) {
    return response
      .status(400)
      .json({ message: "No valid fields were provided to update." });
  }

  if (data.totalCopies !== undefined) {
    const borrowedCopies = Math.max(
      0,
      book.totalCopies - book.availableCopies,
    );

    if (data.totalCopies < borrowedCopies) {
      return response.status(400).json({
        message: `Total copies cannot be less than the ${borrowedCopies} copies currently borrowed.`,
      });
    }

    data.availableCopies = data.totalCopies - borrowedCopies;
  }

  data.updatedAt = new Date();

  const updatedBook = await books.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: data },
    { returnDocument: "after" },
  );

  response.json(updatedBook);
});

// DELETE /books/:id - private (owner only)
router.delete("/:id", verifyToken, async (request, response) => {
  const { id } = request.params;

  if (!ObjectId.isValid(id)) {
    return response.status(400).json({ message: "Invalid book id." });
  }

  const books = getBooksCollection();
  const book = await books.findOne({ _id: new ObjectId(id) });

  if (!book) {
    return response.status(404).json({ message: "Book not found." });
  }

  if (!isBookOwner(book, request.user)) {
    return response
      .status(403)
      .json({ message: "You can only delete books you added." });
  }

  await books.deleteOne({ _id: new ObjectId(id) });

  response.json({ message: "Book deleted successfully.", deletedId: id });
});

export default router;
