import express from "express";
import bodyParser from "body-parser";

const app = express();
app.use(bodyParser.json());

app.post("/echo", (req, res) => {
  res.json(req.body);
});

app.post("/helloworld", (_, res) => {
  res.json({
    status: "OK",
  });
});

app.listen(9999);
