const express = require("express");
const cors = require("cors");
const pedidoRoutes = require("./routes/pedidoRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/pedidos", pedidoRoutes);

app.get("/", (req, res) => {
  res.json({ servico: "ms-pedidos", status: "online" });
});

module.exports = app;
