import vm from "node:vm";

type VerifyHealingScriptResult<T> =
  | { ok: true; value: T }
  | { ok: false; reason: string };

type HealingScriptSandbox = {
  result: unknown;
  args: unknown[];
};

export const verifyHealingScript = <T>(
  healingScript: string,
  args: unknown[],
  isValid: (value: unknown) => value is T,
): VerifyHealingScriptResult<T> => {
  const sandbox: HealingScriptSandbox = { result: undefined, args };
  const context = vm.createContext(sandbox);

  const code = `${healingScript}; result = heal(...args);`;

  try {
    new vm.Script(code).runInContext(context, { timeout: 50 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, reason: `healing script threw exception: ${message}` };
  }

  const out = sandbox.result;
  if (!isValid(out)) {
    return {
      ok: false,
      reason: `healing script did not return valid value: ${JSON.stringify(out)}`,
    };
  }

  return { ok: true, value: out };
};
