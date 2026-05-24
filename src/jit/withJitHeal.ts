import { sendAlarm } from "../integrations/alarmClient";
import { openGitHubIssue } from "../integrations/githubIssues";
import { fingerprintFailure } from "./fingerprintFailure";
import { requestHealingScript } from "./requestHealingScript";
import {
  verifyHealingScript,
  type HealingConfig,
} from "./verifyHealingScript";

const healingScriptCache = new Map<string, string>();

const isHealingConfig = (value: unknown): value is HealingConfig => {
  return (
    typeof value === "object" &&
    value !== null &&
    "available" in value &&
    Array.isArray(value.available) &&
    value.available.every((entry) => typeof entry === "string")
  );
};

export const withJitHeal = async (
  fnName: string,
  fn: () => string,
  args: Record<string, unknown>,
): Promise<{
  value: string;
  healed: boolean;
}> => {
  try {
    return { value: fn(), healed: false };
  } catch (error) {
    const id = fingerprintFailure(fnName, error);
    sendAlarm(fnName, error, id);

    let healingScript = healingScriptCache.get(id);
    const fromCache = Boolean(healingScript);

    if (!fromCache) {
      healingScript = await requestHealingScript(error, {
        fnName,
        args,
        failingCall: fn.toString(),
        source: typeof args.source === "string" ? args.source : undefined,
      });
    }

    if (!healingScript) {
      console.log("no valid healing script received -- throwing original error");
      throw error;
    }

    console.log("LLM healing script response:\n", healingScript);

    if (
      typeof args.langHeader !== "string" ||
      !isHealingConfig(args.config)
    ) {
      throw error;
    }

    const verdict = verifyHealingScript(healingScript, args.langHeader, args.config);
    if (!verdict.ok) {
      console.log(
        `healing script was not successful (${verdict.reason}) -- throwing original error`,
      );
      throw error;
    }

    if (!fromCache) {
      healingScriptCache.set(id, healingScript);
      openGitHubIssue(fnName, id, healingScript);
    } else {
      console.log("cache hit -- using known healing script instead of calling LLM");
    }

    console.log(`JIT Heal was successful! language: "${verdict.value}"`);
    return { value: verdict.value, healed: true };
  }
};
