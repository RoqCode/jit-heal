import { sendAlarm } from "../integrations/alarmClient";
import { openGitHubIssue } from "../integrations/githubIssues";
import { fingerprintFailure } from "./fingerprintFailure";
import { requestHealingScript } from "./requestHealingScript";

const healingScriptCache = new Map<string, string>();

type JitHealOptions<T> = {
  context: Record<string, unknown>;
  verify: (
    healingScript: string,
  ) => { ok: true; value: T } | { ok: false; reason: string };
};

export const withJitHeal = async <T>(
  fnName: string,
  fn: () => T,
  options: JitHealOptions<T>,
): Promise<{
  value: T;
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
        ...options.context,
        failingCall: fn.toString(),
      });
    }

    if (!healingScript) {
      console.log(
        "no valid healing script received -- throwing original error",
      );
      throw error;
    }

    console.log("LLM healing script response:\n", healingScript);

    const verdict = options.verify(healingScript);
    if (!verdict.ok) {
      console.log(
        `healing script was not successful (${verdict.reason}) -- throwing original error`,
      );
      throw error;
    }

    if (!fromCache) {
      healingScriptCache.set(id, healingScript);
      openGitHubIssue(fnName, id, healingScript, error);
    } else {
      console.log(
        "cache hit -- using known healing script instead of calling LLM",
      );
    }

    console.log(`JIT Heal was successful! language: "${verdict.value}"`);
    return { value: verdict.value, healed: true };
  }
};
