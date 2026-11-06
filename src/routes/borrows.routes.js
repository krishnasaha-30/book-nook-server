import { Router } from "express";
import { ObjectId } from "mongodb";
import {
  getBooksCollection,
  getBorrowsCollection,
} from "../config/collections.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = Router();

const BORROW_DURATION_DAYS = 7;

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function getUserEmail(user) {
  return typeof user?.email === "string" ? user.email.toLowerCase() : "";
}

// POST /borrows - private
router.post("/", verifyToken, async (request, response) => {
  const { bookId } = request.body ?? {};
  const userEmail = getUserEmail(request.user);

  if (!userEmail) {
    return response.status(401).json({ message: "Authentication required." });
  }

  if (!bookId || !ObjectId.isValid(bookId)) {
    return response.status(400).json({ message: "A valid book id is required." });
  }

  const books = getBooksCollection();
  const borrows = getBorrowsCollection();

  const book = await books.findOne({ _id: new ObjectId(bookId) });

  if (!book) {
    return response.status(404).json({ message: "Book not found." });
  }

  // No double borrow: one active borrow per user per book.
  const existingBorrow = await borrows.findOne({
    bookId: book._id,
    userEmail,
    status: "active",
  });

  if (existingBorrow) {
    return response.status(409).json({
      message: "You already borrowed this book. Return it before borrowing again.",
    });
  }

  // Atomic copy decrement: only succeeds while a copy is available.
  const updatedBook = await books.findOneAndUpdate(
    { _id: book._id, availableCopies: { $gt: 0 } },
    { $inc: { availableCopies: -1 }, $set: { updatedAt: new Date() } },
    { returnDocument: "after" },
  );

  if (!updatedBook) {
    return response.status(409).json({
      message: "No copies of this book are available right now.",
    });
  }

  const borrowDate = new Date();

  const borrow = {
    bookId: book._id,
    bookTitle: book.title,
    bookImage: book.imageUrl,
    userId: request.user.id,
    userName: request.user.name || "",
    userEmail,
    borrowDate,
    returnDate: addDays(borrowDate, BORROW_DURATION_DAYS),
    status: "active",
    createdAt: borrowDate,
  };

  try {
    const result = await borrows.insertOne(borrow);

    response.status(201).json({ _id: result.insertedId, ...borrow });
  } catch (error) {
    // Roll the copy back if the borrow record could not be saved.
    await books.updateOne(
      { _id: book._id },
      { $inc: { availableCopies: 1 }, $set: { updatedAt: new Date() } },
    );

    if (error.code === 11000) {
      return response.status(409).json({
        message: "You already borrowed this book. Return it before borrowing again.",
      });
    }

    throw error;
  }
});

// GET /borrows - private (only the logged in user's borrows)
router.get("/", verifyToken, async (request, response) => {
  const userEmail = getUserEmail(request.user);

  if (!userEmail) {
    return response.status(401).json({ message: "Authentication required." });
  }

  const borrows = await getBorrowsCollection()
    .find({ userEmail, status: "active" })
    .sort({ borrowDate: -1 })
    .toArray();

  response.json(borrows);
});

// DELETE /borrows/:id - private (return a book)
router.delete("/:id", verifyToken, async (request, response) => {
  const { id } = request.params;
  const userEmail = getUserEmail(request.user);

  if (!ObjectId.isValid(id)) {
    return response.status(400).json({ message: "Invalid borrow id." });
  }

  const borrows = getBorrowsCollection();
  const borrow = await borrows.findOne({ _id: new ObjectId(id) });

  if (!borrow) {
    return response.status(404).json({ message: "Borrow record not found." });
  }

  const ownsBorrow =
    (borrow.userEmail &&
      String(borrow.userEmail).toLowerCase() === userEmail) ||
    (borrow.userId &&
      request.user?.id &&
      String(borrow.userId) === String(request.user.id));

  if (!ownsBorrow) {
    return response
      .status(403)
      .json({ message: "You can only return books you borrowed." });
  }

  const deletion = await borrows.deleteOne({ _id: borrow._id });

  if (deletion.deletedCount !== 1) {
    return response
      .status(409)
      .json({ message: "This borrow has already been returned." });
  }

  // Increase the available copies back, but never above the total.
  await getBooksCollection().updateOne(
    {
      _id: borrow.bookId,
      $expr: { $lt: ["$availableCopies", "$totalCopies"] },
    },
    { $inc: { availableCopies: 1 }, $set: { updatedAt: new Date() } },
  );

  response.json({
    message: "Book returned successfully.",
    returnedBorrowId: id,
  });
});

export default router;
