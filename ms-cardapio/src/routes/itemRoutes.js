import express from "express";
import {
  criarItem,
  listarItens,
  buscarItemPorId,
  atualizarItem,
  removerItem,
  ajustarEstoque,
} from "../controllers/itemController.js";

const router = express.Router();

router.post("/", criarItem);
router.get("/", listarItens);
router.get("/:id", buscarItemPorId);
router.put("/:id", atualizarItem);
router.delete("/:id", removerItem);
router.patch("/:id/estoque", ajustarEstoque);

export default router;
