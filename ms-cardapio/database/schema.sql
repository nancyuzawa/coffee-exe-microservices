-- ============================================================
-- ms-cardapio  |  banco: coffee_cardapio
-- ============================================================

CREATE DATABASE IF NOT EXISTS coffee_cardapio
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE coffee_cardapio;

CREATE TABLE IF NOT EXISTS itens_cardapio (
  id         CHAR(36)      NOT NULL,
  nome       VARCHAR(255)  NOT NULL,
  preco      DECIMAL(10,2) NOT NULL,
  descricao  VARCHAR(255)  NULL,
  estoque    INT           NOT NULL DEFAULT 0,
  createdAt  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT chk_itens_preco   CHECK (preco >= 0),
  CONSTRAINT chk_itens_estoque CHECK (estoque >= 0)
) ENGINE=InnoDB;
