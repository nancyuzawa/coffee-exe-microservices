-- ============================================================
-- ms-pedidos  |  banco: coffee_pedidos
-- IMPORTANTE: não existe FOREIGN KEY de itemId para o banco do
-- cardápio. Em microsserviços cada serviço é dono do seu banco;
-- a referência é apenas lógica e validada por HTTP.
-- ============================================================

CREATE DATABASE IF NOT EXISTS coffee_pedidos
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE coffee_pedidos;

CREATE TABLE IF NOT EXISTS pedidos (
  id             CHAR(36)      NOT NULL,
  nomeCliente    VARCHAR(255)  NOT NULL,                 -- quem fez o pedido
  cpfCliente     CHAR(11)      NOT NULL,                 -- só dígitos; identifica o cliente
  itemId         CHAR(36)      NOT NULL,                 -- referência lógica ao ms-cardapio
  nomeItem       VARCHAR(255)  NOT NULL,                 -- snapshot do nome
  precoUnitario  DECIMAL(10,2) NOT NULL,                 -- snapshot do preço
  quantidade     INT           NOT NULL,
  valorTotal     DECIMAL(10,2) NOT NULL,
  dataPedido     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status         ENUM('REALIZADO','CANCELADO') NOT NULL DEFAULT 'REALIZADO',
  createdAt      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_pedidos_status (status),
  INDEX idx_pedidos_cpf (cpfCliente),
  INDEX idx_pedidos_item (itemId),
  CONSTRAINT chk_pedidos_quantidade CHECK (quantidade > 0)
) ENGINE=InnoDB;
