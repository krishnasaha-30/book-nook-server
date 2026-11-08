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
copy .env.example .env
npm run dev
```

The API runs at `http://localhost:8000` by default.

Set `CLIENT_URL` to the client origin and `BETTER_AUTH_URL` to the origin
serving the Better Auth JWKS endpoint. For production, set both to their
deployed URLs in the hosting provider's environment variables.

## Deploy to Vercel

This repository includes `vercel.json` to deploy the Express app in `index.js`
as a Vercel Node.js Function.

1. Import this repository in the [Vercel dashboard](https://vercel.com/new).
   Set the project root to the repository root.
2. In **Project Settings → Environment Variables**, add:
   - `MONGODB_URI` — your MongoDB connection string.
   - `DB_NAME` — the database name (optional; defaults to `booknook`).
   - `CLIENT_URL` — the deployed frontend origin, without a trailing slash.
   - `BETTER_AUTH_URL` — the origin serving the Better Auth JWKS endpoint,
     without `/api/auth/jwks` (for example, `https://your-client.example.com`).
3. Ensure your MongoDB provider's network access settings permit connections
   from the deployed function. Prefer a supported static egress/IP allowlist
   over allowing access from all IP addresses.
4. Deploy the project. After deployment, open `https://<your-deployment>/`
   to check the API response and `https://<your-deployment>/health` to verify
   the database connection.

Keep `MONGODB_URI` private: add it only in Vercel's environment settings, not
in source control or a committed `.env` file. Redeploy after changing
environment variables.

Run the API's validation tests with:

```bash
npm test
```
