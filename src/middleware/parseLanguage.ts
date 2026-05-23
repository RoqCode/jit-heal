import express from "express";
import { LANGUAGE_CONFIG } from "./languageConfig";
import { setActiveLanguage } from "../utils/setActiveLanguage";
import { withJITFix } from "../utils/withJITFix";

export const parseLanguage: express.RequestHandler = async (req, res, next) => {
  try {
    const langHeader = req.get("accept-language") ?? null;

    if (!langHeader) {
      res.locals.language = LANGUAGE_CONFIG.default;
      return next();
    }

    const { value } = await withJITFix(
      "parseLanguage",
      () => setActiveLanguage(langHeader),
      {
        langHeader,
        config: LANGUAGE_CONFIG,
        source: setActiveLanguage.toString(),
      },
    );

    res.locals.language = value;
    next();
  } catch (error) {
    next(error);
  }
};
