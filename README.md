# ☕ Coffee.exe

Projeto da disciplina **Desenvolvimento Web 3 (DSW3)** — Arquitetura de Microsserviços.

**Descrição:** Desenvolvimento de um projeto prático aplicando os conceitos da arquitetura de microsserviços com a temática de uma **Cafeteria Tech**.

A aplicação é composta por dois microsserviços de backend independentes (**Cardápio** e **Pedidos**) e um frontend único desenvolvido em React.

## Arquitetura do projeto

<img width="2720" height="1760" alt="arquitetura_coffee_exe_v2" src="https://github.com/user-attachments/assets/3604ab51-f761-4cbc-92c3-c6316afd9cd7" />

- **Frontend:** interface do usuário onde ele poderá visualizar o cardápio e realizar pedidos.
- **Microsserviço Cardápio:** gerencia o catálogo de itens da cafeteria.
- **Microsserviço Pedidos:** gerencia os pedidos dos clientes.
- **Banco de dados do Cardápio:** armazena os dados do catálogo de produtos.
- **Banco de dados de Pedidos:** armazena o histórico de pedidos realizados.
- **Comunicação validação/snapshot:** chamada síncrona que o microsserviço de Pedidos faz ao de Cardápio para confirmar que o item existe, checar estoque e capturar o preço e o nome no momento da compra.

### Comunicação entre os microsserviços

O frontend se comunica diretamente com os dois microsserviços:

```text
Frontend (React)
   |-- GET /cardapio -------------> ms-cardapio (porta 3001) -- MySQL: coffee_cardapio
   |
   '-- POST /pedidos -------------> ms-pedidos (porta 3002) -- MySQL: coffee_pedidos
                                          |
                                          '-- GET /cardapio/:id
                                              (validação + snapshot)
                                                    |
                                                    '--> ms-cardapio
```

- **ms-cardapio:** gerencia o catálogo de itens da cafeteria.
- **ms-pedidos:** gerencia os pedidos, validando o item e capturando um *snapshot* (nome + preço no momento da compra) através de uma chamada síncrona ao `ms-cardapio`.
- **frontend:** interface em React para visualizar o cardápio, realizar pedidos e consultar o histórico.

> **Observação:** não há Docker neste projeto. Cada parte da aplicação roda localmente com Node.js e um servidor MySQL local.

## Pré-requisitos

- Node.js 18+
- MySQL instalado e rodando localmente (ou acessível via rede)
- Um cliente MySQL (Workbench, DBeaver, linha de comando etc.) para criar os bancos

## 1. Criando os bancos de dados

Entre no MySQL e crie os dois bancos, um para cada microsserviço:

```sql
CREATE DATABASE coffee_cardapio;

CREATE DATABASE coffee_pedidos;
```

As tabelas são criadas automaticamente pelo Sequelize (`sequelize.sync()`) na primeira vez que cada serviço é iniciado. Não é necessário executar migrations manualmente.

## 2. Configurando e rodando o ms-cardapio

```bash
cd ms-cardapio

npm install

cp .env.example .env

# Edite o .env com o usuário/senha do seu MySQL

npm run dev
```

O serviço será iniciado em:

**http://localhost:3001**

### Endpoints

- `POST /cardapio` — cadastra um item `{ nome, preco, descricao, estoque }`
- `GET /cardapio` — lista todos os itens
- `GET /cardapio/:id` — exibe os detalhes de um item

## 3. Configurando e rodando o ms-pedidos

Em outro terminal:

```bash
cd ms-pedidos

npm install

cp .env.example .env

# Edite o .env com o usuário/senha do seu MySQL

npm run dev
```

O serviço será iniciado em:

**http://localhost:3002**

O `ms-pedidos` depende do `ms-cardapio` estar em execução para validar os itens e criar os pedidos.

### Endpoints

- `POST /pedidos` — cria um pedido `{ itemId, quantidade }`
- `GET /pedidos` — lista todos os pedidos
- `GET /pedidos/:id` — exibe os detalhes de um pedido

## 4. Rodando o frontend

Em outro terminal:

```bash
cd frontend

npm install

npm run dev
```

Acesse:

**http://localhost:5173**

## 5. Testando rapidamente com curl

### Cadastrar um item no cardápio

```bash
curl -X POST http://localhost:3001/cardapio \
  -H "Content-Type: application/json" \
  -d '{"nome":"Cappuccino","preco":12.50,"descricao":"Café com leite vaporizado","estoque":20}'
```

### Listar o cardápio

Copie o `id` retornado no cadastro:

```bash
curl http://localhost:3001/cardapio
```

### Fazer um pedido

Substitua `COLE_O_ID_AQUI` pelo ID do item:

```bash
curl -X POST http://localhost:3002/pedidos \
  -H "Content-Type: application/json" \
  -d '{"itemId":"COLE_O_ID_AQUI","quantidade":2}'
```

## Estrutura do repositório

```text
/
├── ms-cardapio/       -> Microsserviço de Cardápio
│                         Node.js + Express + Sequelize + MySQL
│
├── ms-pedidos/        -> Microsserviço de Pedidos
│                         Node.js + Express + Sequelize + MySQL
│
├── frontend/          -> Frontend
│                         React + Vite + Axios
│
└── README.md
```