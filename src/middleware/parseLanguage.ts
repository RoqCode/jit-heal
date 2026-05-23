import express from "express";
import { LANGUAGE_CONFIG } from "./languageConfig";
import { setActiveLanguage } from "../utils/setActiveLanguage";

export const parseLanguage: express.RequestHandler = (req, res, next) => {
  const langHeader = req.get("accept-language") ?? null;

  if (!langHeader) {
    res.locals.language = LANGUAGE_CONFIG.default;
    return next();
  }

  res.locals.language = setActiveLanguage(langHeader);
  next();
};
