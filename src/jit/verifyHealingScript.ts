import vm from "node:vm";

export type HealingConfig = {
  available: string[];
};

type VerifyHealingScriptResult =
  | { ok: true; value: string }
  | { ok: false; reason: string };

type HealingScriptSandbox = {
  result: unknown;
  headerValue: string;
  config: HealingConfig;
};

export const verifyHealingScript = (
  healingScript: string,
  headerValue: string,
  config: HealingConfig,
): VerifyHealingScriptResult => {
  const sandbox: HealingScriptSandbox = { result: undefined, headerValue, config };
  const context = vm.createContext(sandbox);

  const code = `${healingScript}; result = heal(headerValue, config);`;

  try {
    new vm.Script(code).runInContext(context, { timeout: 50 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, reason: `healing script threw exception: ${message}` };
  }

  const out = sandbox.result;
  if (typeof out !== "string" || !config.available.includes(out)) {
    return {
      ok: false,
      reason: `healing script did not return valid value: ${JSON.stringify(out)}`,
    };
  }

  return { ok: true, value: out };
};
