import type express from "express";
import {
  DEFAULT_PAGE_LIMIT,
  MAX_PAGE_LIMIT,
  parsePageLimit,
} from "../demo/parsePageLimit";
import { verifyHealingScript } from "../jit/verifyHealingScript";
import { withJitHeal } from "../jit/withJitHeal";

export const getItems: express.RequestHandler = async (req, res, next) => {
  try {
    const rawLimit = String(req.query.limit ?? DEFAULT_PAGE_LIMIT);
    const { value: limit, healed } = await withJitHeal(
      "parsePageLimit",
      () => parsePageLimit(rawLimit),
      {
        context: {
          signature: "function heal(rawLimit, defaults)",
          returnContract:
            "Return an integer between 1 and defaults.max. Use defaults.defaultLimit when rawLimit is invalid.",
          rawLimit,
          defaults: {
            defaultLimit: DEFAULT_PAGE_LIMIT,
            max: MAX_PAGE_LIMIT,
          },
          source: parsePageLimit.toString(),
        },
        verify: (healingScript) =>
          verifyHealingScript<number>(
            healingScript,
            [
              rawLimit,
              {
                defaultLimit: DEFAULT_PAGE_LIMIT,
                max: MAX_PAGE_LIMIT,
              },
            ],
            (value): value is number =>
              typeof value === "number" &&
              Number.isInteger(value) &&
              value >= 1 &&
              value <= MAX_PAGE_LIMIT,
          ),
      },
    );

    res.json({ limit, healed });
  } catch (error) {
    next(error);
  }
};
