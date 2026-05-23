import { fingerprint } from "./fingerprint";
import { fireAlarm } from "./fireAlarm";

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

    throw error;
  }
};
