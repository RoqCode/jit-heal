import type express from "express";
import {
  isProduct,
  parseExternalProduct,
  type Product,
} from "../demo/parseExternalProduct";
import { verifyHealingScript } from "../jit/verifyHealingScript";
import { withJitHeal } from "../jit/withJitHeal";

const fetchExternalProduct = async (id: string): Promise<unknown> => {
  const response = await fetch(`http://localhost:3001/products/${id}`);

  if (!response.ok) {
    throw new Error(`external product API failed: ${response.status}`);
  }

  return response.json();
};

export const getProduct: express.RequestHandler = async (req, res, next) => {
  try {
    const productId = String(req.params.id);
    const rawProduct = await fetchExternalProduct(productId);
    const { value: product, healed } = await withJitHeal<Product>(
      "parseExternalProduct",
      () => parseExternalProduct(rawProduct),
      {
        context: {
          signature: "function heal(rawProduct)",
          returnContract:
            "Return a product object with string id, string name, and string badge.",
          rawProduct,
          source: parseExternalProduct.toString(),
        },
        verify: (healingScript) =>
          verifyHealingScript<Product>(healingScript, [rawProduct], isProduct),
      },
    );

    res.json({ product, healed });
  } catch (error) {
    next(error);
  }
};
