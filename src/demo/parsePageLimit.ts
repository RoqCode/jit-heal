export const DEFAULT_PAGE_LIMIT = 20;
export const MAX_PAGE_LIMIT = 100;

export const parsePageLimit = (rawLimit: string): number => {
  const limit = Number.parseInt(rawLimit, 10);

  if (!Number.isInteger(limit)) {
    throw new Error(`invalid page limit: "${rawLimit}"`);
  }

  if (limit < 1 || limit > MAX_PAGE_LIMIT) {
    throw new Error(`page limit out of range: "${rawLimit}"`);
  }

  return limit;
};
