import express from "express";
import { withJitHeal } from "../jit/withJitHeal";
import { verifyHealingScript } from "../jit/verifyHealingScript";
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
        context: {
          signature: "function heal(headerValue, config)",
          returnContract: "Return one of config.available.",
          langHeader,
          config: LANGUAGE_CONFIG,
          source: selectLanguage.toString(),
        },
        verify: (healingScript) =>
          verifyHealingScript<string>(
            healingScript,
            [langHeader, LANGUAGE_CONFIG],
            (value): value is string =>
              typeof value === "string" &&
              LANGUAGE_CONFIG.available.includes(value),
          ),
      },
    );

    res.locals.language = value;
    next();
  } catch (error) {
    next(error);
  }
};
