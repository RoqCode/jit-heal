import express from "express";
import { withJitHeal } from "../jit/withJitHeal";
import { LANGUAGE_CONFIG } from "../language/languageConfig";
import { selectLanguage } from "../language/selectLanguage";

export const parseLanguage: express.RequestHandler = async (req, res, next) => {
  try {
    const langHeader = req.get("accept-language") ?? null;

    if (!langHeader) {
      res.locals.language = LANGUAGE_CONFIG.default;
      return next();
    }

    const { value } = await withJitHeal(
      "parseLanguage",
      () => selectLanguage(langHeader),
      {
        langHeader,
        config: LANGUAGE_CONFIG,
        source: selectLanguage.toString(),
      },
    );

    res.locals.language = value;
    next();
  } catch (error) {
    next(error);
  }
};
