import type express from "express";
import {
  DEFAULT_PREVIEW_ENABLED,
  parsePreviewFlag,
} from "../demo/parsePreviewFlag";
import { verifyHealingScript } from "../jit/verifyHealingScript";
import { withJitHeal } from "../jit/withJitHeal";

export const getPreview: express.RequestHandler = async (req, res, next) => {
  try {
    const rawFlag = String(req.query.enabled ?? DEFAULT_PREVIEW_ENABLED);
    const { value: enabled, healed } = await withJitHeal(
      "parsePreviewFlag",
      () => parsePreviewFlag(rawFlag),
      {
        context: {
          signature: "function heal(rawFlag, defaults)",
          returnContract:
            "Return a boolean. Use defaults.defaultEnabled when rawFlag is invalid.",
          rawFlag,
          defaults: { defaultEnabled: DEFAULT_PREVIEW_ENABLED },
          source: parsePreviewFlag.toString(),
        },
        verify: (healingScript) =>
          verifyHealingScript<boolean>(
            healingScript,
            [rawFlag, { defaultEnabled: DEFAULT_PREVIEW_ENABLED }],
            (value): value is boolean => typeof value === "boolean",
          ),
      },
    );

    res.json({ enabled, healed });
  } catch (error) {
    next(error);
  }
};
