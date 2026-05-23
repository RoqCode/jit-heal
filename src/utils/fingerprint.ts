import crypto from "node:crypto";

export const fingerprint = (fnName: string, error: unknown) => {
  const name = error instanceof Error ? error.name : typeof error;
  const message = error instanceof Error ? error.message : String(error);
  const normalizedMessage = message.replace(/"[^"]*"/g, "<…>");
  const raw = `${fnName}|${name}|${normalizedMessage}`;

  return crypto.createHash("sha1").update(raw).digest("hex").slice(0, 12);
};
