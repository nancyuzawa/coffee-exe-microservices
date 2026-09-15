const express = require("express");
const cors = require("cors");
const itemRoutes = require("./routes/itemRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/cardapio", itemRoutes);

app.get("/", (req, res) => {
  res.json({ servico: "ms-cardapio", status: "online" });
});

module.exports = app;
