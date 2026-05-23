import express from "express";

const app = express();
const port = 3001;

app.use(express.json());

app.post("/alarms", (req, res) => {
  console.log("Alarm received", req.body);
  res.sendStatus(204);
});

app.listen(port, () => {
  console.log(`Mock alarm server listening on http://localhost:${port}`);
});
