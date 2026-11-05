import { getBorrowsCollection, getBooksCollection } from "./collections.js";

export async function ensureIndexes() {
  await getBooksCollection().createIndexes([
    { key: { createdAt: -1 }, name: "books_createdAt_desc" },
    { key: { ownerId: 1, createdAt: -1 }, name: "books_ownerId_createdAt" },
    { key: { ownerEmail: 1 }, name: "books_ownerEmail" },
    { key: { category: 1 }, name: "books_category" },
  ]);

  await getBorrowsCollection().createIndexes([
    { key: { userEmail: 1, createdAt: -1 }, name: "borrows_userEmail_createdAt" },
    { key: { bookId: 1, userEmail: 1 }, name: "borrows_bookId_userEmail" },
  ]);

  console.log("MongoDB indexes are ready");
}
