import "dotenv/config";
import app from "./src/app.js";
import { connectToDatabase } from "./src/config/db.js";
import { ensureIndexes } from "./src/config/indexes.js";

const PORT = process.env.PORT || 8000;

await connectToDatabase();
await ensureIndexes();

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`BookNook API is running at http://localhost:${PORT}`);
  });
}

export default app;
