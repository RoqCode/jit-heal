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
    err: unknown,
    _req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    if (res.headersSent) {
      return next(err);
    }

    console.error(err);
    res.sendStatus(500);
  },
);

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
