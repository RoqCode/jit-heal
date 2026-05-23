import express from "express";
import { parseLanguage } from "./middleware/parseLanguage";

const app = express();
const port = Number(process.env.PORT) || 3000;

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/entry", parseLanguage, (_req, res) => {
  res.json({ message: "hello world", lang: res.locals.language });
});

app.use(
  (
    _err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    res.sendStatus(500);
  },
);

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
