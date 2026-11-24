# Avaliações

Serviço Express/Sequelize independente, na porta 3003, com MySQL e volume próprios.
O modelo `Avaliacao` é persistido na tabela `avaliacoes`; a migration Umzug não apaga dados.
Não existe chave estrangeira entre os bancos dos serviços.

| Método | Rota | Resultado |
| --- | --- | --- |
| POST | `/avaliacoes` | Cria uma avaliação e retorna 201 |
| GET | `/avaliacoes?produtoId=UUID` | Lista avaliações do produto, mais recentes primeiro |
| GET | `/avaliacoes/media/UUID` | Retorna `{ produtoId, media, total }` |
| GET | `/health` | Processo ativo |
| GET | `/ready` | Banco inicializado e acessível |

Corpo de criação:

```json
{ "produtoId": "UUID-do-produto", "nota": 5, "comentario": "Café delicioso!" }
```

`nota` deve ser um inteiro de 1 a 5. `comentario` é obrigatório e aceita até 2000
caracteres após remover espaços das extremidades. `id` e `criadoEm` são gerados pelo servidor.
A API retorna 400 para dados inválidos, 404 para produto inexistente e 503 quando
Produtos não responde ou o banco está indisponível. Nenhuma avaliação é salva nesses casos.
A consulta HTTP a Produtos tem timeout configurável e segue o cliente de Pedidos.

Leituras consultam apenas MySQL. Um produto sem avaliações retorna lista vazia,
`media: null` e `total: 0`; a média existente é arredondada a duas casas decimais.
O frontend usa “Ver e avaliar” no cardápio para listar comentários e publicar avaliações.
Comentários e médias são lidos pelo frontend no ms-query (porta 3004), que guarda
uma projeção em MySQL próprio. As leituras funcionam em outro computador ou navegador
sem cache, mesmo quando ms-avaliacoes está parado. Não dependem de localStorage.
A interface atualiza automaticamente a cada 30 segundos, ou a cada 5 segundos após
falha da consulta, e também quando a conexão do navegador volta.

Cada criação grava a avaliação e um evento AvaliacaoCriada na outbox, na mesma transação.
O publicador tenta enviá-lo ao Event Bus (porta 4005) a cada 2 segundos. Eventos são
persistidos no banco do barramento e deduplicados pelo UUID da avaliação. Query lê o
histórico, aplica a projeção e avança seu checkpoint atomicamente. Ao voltar de uma
queda, recupera os eventos perdidos. A migration 002 publica também avaliações antigas.
Há consistência eventual entre a criação e a consulta: a propagação leva alguns segundos.
O formulário publica solicitações em `POST /review-requests` no Event Bus, com um
`requestId` estável por envio. O barramento salva a solicitação em MySQL e retorna 202,
mesmo com ms-avaliacoes parado. O frontend mostra “Aguardando processamento” até a
publicação e não inclui notas pendentes na média. Pendências podem ser consultadas de
outro computador por `GET /review-requests?produtoId=UUID`.

Um consumidor em ms-avaliacoes verifica o produto e grava avaliação/outbox; só então
confirma a solicitação como PROCESSADA. O UUID da solicitação é também o da avaliação,
evitando duplicações após perda de confirmação. Falhas temporárias mantêm a solicitação
PENDENTE; produto inexistente deixa REJEITADA com o motivo. O consumo retoma a cada 2 segundos.
Se o Event Bus não aceitar o envio, o formulário conserva o comentário e o mesmo ID
para uma nova tentativa. Nenhuma avaliação é apresentada como recebida antes de ser
persistida no servidor. Essas solicitações não dependem de localStorage.

Na raiz do projeto:

```powershell
docker compose up -d --build ms-avaliacoes event-bus ms-query frontend
```

Desenvolvimento local: crie o banco `meow_avaliacoes`, configure `.env` a partir de
`.env.example` e execute `npm ci` e `npm run dev` nesta pasta. Produtos deve estar
acessível pela URL de `PRODUTOS_API_URL`. No frontend, configure `VITE_QUERY_API_URL`
e `VITE_EVENT_BUS_API_URL`.

