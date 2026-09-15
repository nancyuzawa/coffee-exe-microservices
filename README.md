# ☕ Coffee.exe

Projeto da disciplina **Desenvolvimento Web 3 (DSW3)** — Arquitetura de Microsserviços.

Cafeteria Tech composta por dois microsserviços de backend independentes (Cardápio e Pedidos)
e um frontend único em React.

## Arquitetura

```
Frontend (React)
   |-- GET /cardapio -------------> ms-cardapio (porta 3001) -- MySQL: coffee_cardapio
   |-- POST /pedidos -------------> ms-pedidos  (porta 3002) -- MySQL: coffee_pedidos
                                        |
                                        '-- GET /cardapio/:id (validação + snapshot)
                                            --------------------> ms-cardapio
```

- **ms-cardapio**: gerencia o catálogo de itens da cafeteria.
- **ms-pedidos**: gerencia os pedidos, validando o item e capturando um *snapshot*
  (nome + preço no momento da compra) via chamada síncrona ao ms-cardapio.
- **frontend**: interface em React para visualizar o cardápio, fazer pedidos e ver o histórico.

Não há Docker neste projeto — cada parte roda localmente com Node.js e um servidor MySQL local.

## Pré-requisitos

- Node.js 18+
- MySQL instalado e rodando localmente (ou acessível via rede)
- Um cliente MySQL (Workbench, DBeaver, linha de comando etc.) para criar os bancos

## 1. Criando os bancos de dados

Entre no MySQL e crie os dois bancos (um para cada microsserviço):

```sql
CREATE DATABASE coffee_cardapio;
CREATE DATABASE coffee_pedidos;
```

As tabelas são criadas automaticamente pelo Sequelize (`sequelize.sync()`) na primeira
vez que cada serviço é iniciado — não é necessário rodar migrations manuais.

## 2. Configurando e rodando o ms-cardapio

```bash
cd ms-cardapio
npm install
cp .env.example .env
# edite o .env com o usuário/senha do seu MySQL
npm run dev
```

O serviço sobe em `http://localhost:3001`.

**Endpoints:**
- `POST /cardapio` — cadastra um item `{ nome, preco, descricao, estoque }`
- `GET /cardapio` — lista todos os itens
- `GET /cardapio/:id` — detalhes de um item

## 3. Configurando e rodando o ms-pedidos

Em outro terminal:

```bash
cd ms-pedidos
npm install
cp .env.example .env
# edite o .env com o usuário/senha do seu MySQL
npm run dev
```

O serviço sobe em `http://localhost:3002` e depende do ms-cardapio estar no ar
para validar e criar pedidos.

**Endpoints:**
- `POST /pedidos` — cria um pedido `{ itemId, quantidade }`
- `GET /pedidos` — lista todos os pedidos
- `GET /pedidos/:id` — detalhes de um pedido

## 4. Rodando o frontend

Em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

Acesse `http://localhost:5173`.

## 5. Testando rapidamente com curl

```bash
# cadastra um item no cardápio
curl -X POST http://localhost:3001/cardapio \
  -H "Content-Type: application/json" \
  -d '{"nome":"Cappuccino","preco":12.50,"descricao":"Café com leite vaporizado","estoque":20}'

# lista o cardápio (copie o "id" retornado acima)
curl http://localhost:3001/cardapio

# faz um pedido
curl -X POST http://localhost:3002/pedidos \
  -H "Content-Type: application/json" \
  -d '{"itemId":"COLE_O_ID_AQUI","quantidade":2}'
```

## Estrutura do repositório

```
/ms-cardapio     -> Microsserviço de Cardápio (Node/Express + Sequelize + MySQL)
/ms-pedidos      -> Microsserviço de Pedidos  (Node/Express + Sequelize + MySQL)
/frontend        -> Frontend (React + Vite + Axios)
README.md
```
