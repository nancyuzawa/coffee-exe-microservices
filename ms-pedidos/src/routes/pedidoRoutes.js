import express from "express";
import {
  criarPedido,
  listarPedidos,
  buscarPedidoPorId,
  cancelarPedido,
} from "../controllers/pedidoController.js";

const router = express.Router();

router.post("/", criarPedido);
router.get("/", listarPedidos);
router.get("/:id", buscarPedidoPorId);
router.patch("/:id/cancelar", cancelarPedido);

export default router;
