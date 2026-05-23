import { LANGUAGE_CONFIG } from "../middleware/languageConfig";

export const setActiveLanguage = (langHeader: string): string => {
  const entries = langHeader.split(",");

  const parsed = entries.map((entry) => {
    const [rawTag, rawQuality] = entry.split(";");
    const tag = rawTag.trim().toLowerCase().split("-")[0];

    let quality = 1.0;
    if (rawQuality) {
      const qValue = rawQuality.split("=")[1];
      quality = parseFloat(qValue);
    }

    if (tag.length !== 2) {
      throw new Error(`invalid lang tag: "${tag}"`);
    }

    return { tag, quality };
  });

  parsed.sort((a, b) => {
    if (Number.isNaN(a.quality) || Number.isNaN(b.quality)) {
      throw new Error(`invaled q-value in header: "${langHeader}"`);
    }
    return b.quality - a.quality;
  });

  for (const { tag } of parsed) {
    if (LANGUAGE_CONFIG.available.includes(tag)) {
      return tag;
    }
  }

  return LANGUAGE_CONFIG.default;
};
