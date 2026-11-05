# BookNook API

Express + MongoDB REST API for **BookNook**, a small online library where users can add books, borrow them for a few days, and return them.

## Endpoints

| Method | Route          | Access  | Description                  |
| ------ | -------------- | ------- | ---------------------------- |
| GET    | `/books`       | Public  | Get all books                |
| GET    | `/books/:id`   | Public  | Get a single book            |
| POST   | `/books`       | Private | Add a book                   |
| PATCH  | `/books/:id`   | Private | Update your own book         |
| DELETE | `/books/:id`   | Private | Delete your own book         |
| POST   | `/borrows`     | Private | Borrow a book                |
| GET    | `/borrows`     | Private | Get the logged in user's borrows |
| DELETE | `/borrows/:id` | Private | Return a book                |

## Getting started

```bash
npm install
cp .env.example .env
npm run dev
```

The API runs at `http://localhost:8000` by default.
