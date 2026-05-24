import type express from "express";

export const errorHandler: express.ErrorRequestHandler = (
  err,
  _req,
  res,
  next,
) => {
  if (res.headersSent) {
    return next(err);
  }

  console.error(err);
  res.sendStatus(500);
};
