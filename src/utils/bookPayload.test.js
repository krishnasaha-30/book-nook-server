import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseBookPayload } from "./bookPayload.js";

const validBook = {
  title: "The Left Hand of Darkness",
  author: "Ursula K. Le Guin",
  category: "Science",
  imageUrl: "https://example.com/cover.jpg",
  description: "A story about a journey across a winter planet.",
  totalCopies: 2,
};

describe("parseBookPayload", () => {
  it("accepts a complete, valid book", () => {
    const result = parseBookPayload(validBook);

    assert.deepEqual(result.errors, []);
    assert.deepEqual(result.data, validBook);
  });

  it("accepts and trims a custom category", () => {
    const result = parseBookPayload({
      ...validBook,
      category: "  Graphic Novels  ",
    });

    assert.deepEqual(result.errors, []);
    assert.equal(result.data.category, "Graphic Novels");
  });

  it("rejects an empty or overlong category", () => {
    const emptyResult = parseBookPayload({ ...validBook, category: "  " });
    const longResult = parseBookPayload({
      ...validBook,
      category: "a".repeat(61),
    });

    assert.ok(emptyResult.errors.includes("Book category is required."));
    assert.ok(
      longResult.errors.includes(
        "Book category cannot be longer than 60 characters.",
      ),
    );
  });

  it("rejects null and array payloads without throwing", () => {
    for (const payload of [null, []]) {
      const result = parseBookPayload(payload);

      assert.deepEqual(result.errors, [
        "Book details must be sent as a JSON object.",
      ]);
      assert.deepEqual(result.data, {});
    }
  });

  it("rejects a non-HTTP cover URL", () => {
    const result = parseBookPayload({
      ...validBook,
      imageUrl: "javascript:alert(1)",
    });

    assert.ok(result.errors.includes("Book image must be a valid http(s) URL."));
  });

  it("validates partial updates without requiring omitted fields", () => {
    const result = parseBookPayload(
      { title: "  A new title  " },
      { partial: true },
    );

    assert.deepEqual(result.errors, []);
    assert.deepEqual(result.data, { title: "A new title" });
  });
});
