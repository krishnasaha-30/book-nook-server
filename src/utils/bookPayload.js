export const BOOK_CATEGORIES = [
  "Fiction",
  "Science",
  "History",
  "Kids",
  "Others",
];

const MAX_TITLE_LENGTH = 200;
const MAX_AUTHOR_LENGTH = 120;
const MAX_CATEGORY_LENGTH = 60;
const MAX_DESCRIPTION_LENGTH = 2000;
const MAX_COPIES = 999;

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Validates and normalises a book payload.
 * Pass { partial: true } for PATCH so only provided fields are checked.
 */
export function parseBookPayload(body = {}, { partial = false } = {}) {
  const errors = [];
  const data = {};

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return {
      errors: ["Book details must be sent as a JSON object."],
      data,
    };
  }

  const has = (key) => Object.prototype.hasOwnProperty.call(body, key);

  // Title
  if (!partial || has("title")) {
    const title = typeof body.title === "string" ? body.title.trim() : "";

    if (!title) {
      errors.push("Book title is required.");
    } else if (title.length > MAX_TITLE_LENGTH) {
      errors.push(`Book title cannot be longer than ${MAX_TITLE_LENGTH} characters.`);
    } else {
      data.title = title;
    }
  }

  // Author
  if (!partial || has("author")) {
    const author = typeof body.author === "string" ? body.author.trim() : "";

    if (!author) {
      errors.push("Author name is required.");
    } else if (author.length > MAX_AUTHOR_LENGTH) {
      errors.push(`Author name cannot be longer than ${MAX_AUTHOR_LENGTH} characters.`);
    } else {
      data.author = author;
    }
  }

  // Category
  if (!partial || has("category")) {
    const category = typeof body.category === "string" ? body.category.trim() : "";
    const matchedCategory = BOOK_CATEGORIES.find(
      (item) => item.toLowerCase() === category.toLowerCase(),
    );

    if (!category) {
      errors.push("Book category is required.");
    } else if (category.length > MAX_CATEGORY_LENGTH) {
      errors.push(
        `Book category cannot be longer than ${MAX_CATEGORY_LENGTH} characters.`,
      );
    } else {
      data.category = matchedCategory ?? category;
    }
  }

  // Image URL
  if (!partial || has("imageUrl")) {
    const imageUrl = typeof body.imageUrl === "string" ? body.imageUrl.trim() : "";

    if (!imageUrl) {
      errors.push("Book image is required.");
    } else if (!isHttpUrl(imageUrl)) {
      errors.push("Book image must be a valid http(s) URL.");
    } else {
      data.imageUrl = imageUrl;
    }
  }

  // Description
  if (!partial || has("description")) {
    const description =
      typeof body.description === "string" ? body.description.trim() : "";

    if (!description) {
      errors.push("Short description is required.");
    } else if (description.length > MAX_DESCRIPTION_LENGTH) {
      errors.push(
        `Short description cannot be longer than ${MAX_DESCRIPTION_LENGTH} characters.`,
      );
    } else {
      data.description = description;
    }
  }

  // Total copies (challenge requirement)
  if (!partial || has("totalCopies")) {
    const rawCopies = body.totalCopies;

    if (rawCopies === undefined || rawCopies === null || rawCopies === "") {
      if (!partial) {
        data.totalCopies = 1;
      }
    } else {
      const totalCopies = Number(rawCopies);

      if (
        !Number.isInteger(totalCopies) ||
        totalCopies < 1 ||
        totalCopies > MAX_COPIES
      ) {
        errors.push(`Total copies must be a whole number between 1 and ${MAX_COPIES}.`);
      } else {
        data.totalCopies = totalCopies;
      }
    }
  }

  return { errors, data };
}
