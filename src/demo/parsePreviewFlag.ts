export const DEFAULT_PREVIEW_ENABLED = false;

export const parsePreviewFlag = (rawFlag: string): boolean => {
  const normalized = rawFlag.trim().toLowerCase();

  if (normalized === "true") return true;
  if (normalized === "false") return false;

  throw new Error(`invalid preview flag: "${rawFlag}"`);
};
