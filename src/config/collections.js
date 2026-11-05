import { getDatabase } from "./db.js";

export function getBooksCollection() {
  return getDatabase().collection("books");
}

export function getBorrowsCollection() {
  return getDatabase().collection("borrows");
}
