import express from "express";

const app = express();
const port = 3001;
let productRequestCount = 0;

app.use(express.json());

app.post("/alarms", (req, res) => {
  console.log("Alarm received", req.body);
  res.sendStatus(204);
});

app.get("/products/:id", (req, res) => {
  productRequestCount += 1;

  const product = {
    id: req.params.id,
    name: "Coffee Beans",
    badge: "organic" as string | string[],
  };

  if (productRequestCount % 3 === 0) {
    product.badge = ["organic", "fair-trade"];
  }

  res.json(product);
});

app.listen(port, () => {
  console.log(`Demo dependency server listening on http://localhost:${port}`);
});
