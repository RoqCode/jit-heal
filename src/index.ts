import "dotenv/config";
import express from "express";
import { errorHandler } from "./middleware/errorHandler";
import { parseLanguage } from "./middleware/parseLanguage";
import { getEntry } from "./routes/entryRoute";
import { getItems } from "./routes/itemsRoute";
import { getPreview } from "./routes/previewRoute";

const app = express();
const port = Number(process.env.PORT) || 3000;

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/entry", parseLanguage, getEntry);
app.get("/items", getItems);
app.get("/preview", getPreview);

app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
