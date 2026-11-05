/**
 * A book belongs to the user who created it.
 * ownerId is preferred; ownerEmail is kept as a fallback for older documents.
 */
export function isBookOwner(book, user) {
  if (!book || !user) {
    return false;
  }

  const ownerIdMatches =
    book.ownerId && user.id && String(book.ownerId) === String(user.id);

  const ownerEmailMatches =
    book.ownerEmail &&
    user.email &&
    String(book.ownerEmail).toLowerCase() === String(user.email).toLowerCase();

  return Boolean(ownerIdMatches || ownerEmailMatches);
}
