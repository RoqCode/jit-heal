import { fingerprint } from "./fingerprint";
import { fireAlarm } from "./fireAlarm";
import { LLMHeal } from "./LLMHeal";
import { verifyFix, type VerifyFixConfig } from "./verifyFix";

const isVerifyFixConfig = (value: unknown): value is VerifyFixConfig => {
  return (
    typeof value === "object" &&
    value !== null &&
    "available" in value &&
    Array.isArray(value.available) &&
    value.available.every((entry) => typeof entry === "string")
  );
};

export const withJITFix = async (
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
    const id = fingerprint(fnName, error);
    fireAlarm(fnName, error, id);

    const fix = await LLMHeal(error, {
      fnName,
      args,
      failingCall: fn.toString(),
      source: typeof args.source === "string" ? args.source : undefined,
    });

    if (!fix) {
      console.log("no valid fix recieved -- throwing original error");
      throw error;
    }

    console.log("LLM fix response:\n", fix);

    if (
      typeof args.langHeader !== "string" ||
      !isVerifyFixConfig(args.config)
    ) {
      throw error;
    }

    const verdict = verifyFix(fix, args.langHeader, args.config);
    if (!verdict.ok) {
      console.log(
        `fix was not successful (${verdict.reason}) -- throwing original error`,
      );
      throw error;
    }
    console.log(`fix was successful! language: "${verdict.value}"`);
    return { value: verdict.value, healed: true };
  }
};
