import type express from "express";

export const getEntry: express.RequestHandler = (_req, res) => {
  res.json({ message: "hello world", lang: res.locals.language });
};
