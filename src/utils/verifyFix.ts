import vm from "node:vm";

export type VerifyFixConfig = {
  available: string[];
};

type VerifyFixResult =
  | { ok: true; value: string }
  | { ok: false; reason: string };

type VerifyFixSandbox = {
  result: unknown;
  headerValue: string;
  config: VerifyFixConfig;
};

export const verifyFix = (
  fixSource: string,
  headerValue: string,
  config: VerifyFixConfig,
): VerifyFixResult => {
  const sandbox: VerifyFixSandbox = { result: undefined, headerValue, config };
  const context = vm.createContext(sandbox);

  const code = `${fixSource}; result = heal(headerValue, config);`;

  try {
    new vm.Script(code).runInContext(context, { timeout: 50 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, reason: `fix threw exception: ${message}` };
  }

  const out = sandbox.result;
  if (typeof out !== "string" || !config.available.includes(out)) {
    return {
      ok: false,
      reason: `fix did not return valid value: ${JSON.stringify(out)}`,
    };
  }

  return { ok: true, value: out };
};
