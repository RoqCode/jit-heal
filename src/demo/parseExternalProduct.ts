export type Product = {
  id: string;
  name: string;
  badge: string;
};

export const isProduct = (value: unknown): value is Product => {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.badge === "string"
  );
};

export const parseExternalProduct = (rawProduct: unknown): Product => {
  if (!rawProduct || typeof rawProduct !== "object") {
    throw new Error("external product must be an object");
  }

  const candidate = rawProduct as Record<string, unknown>;

  if (typeof candidate.id !== "string") {
    throw new Error("external product id must be a string");
  }

  if (typeof candidate.name !== "string") {
    throw new Error("external product name must be a string");
  }

  if (typeof candidate.badge !== "string") {
    throw new Error(
      `external product badge must be a string, got ${Array.isArray(candidate.badge) ? "array" : typeof candidate.badge}`,
    );
  }

  return {
    id: candidate.id,
    name: candidate.name,
    badge: candidate.badge,
  };
};
