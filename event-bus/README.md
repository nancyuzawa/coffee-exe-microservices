# Event Bus persistente

Express na porta 4005, com MySQL e volume exclusivos (`eventos-data`).
Não usa armazenamento em memória para conservar o histórico.

- `POST /events`: persiste `{ id, type: "AvaliacaoCriada", data: { id, produtoId, nota, comentario, criadoEm } }`.
- `GET /events?after=0&limit=100`: retorna `{ events, next }`, em ordem crescente de sequência. Limite máximo: 500.
- `GET /health` e `GET /ready`: processo e banco.
- `POST /review-requests`: aceita `{ requestId, produtoId, nota, comentario }` com HTTP 202 após salvar a solicitação.
- `GET /review-requests?produtoId=UUID`: lista solicitações e seus estados para o frontend.
- `GET /review-requests?status=PENDENTE&limit=100`: fila ordenada por chegada para o consumidor de Avaliações.
- `POST /review-requests/UUID/ack`: consumidor confirma `{ status: "PROCESSADA" }` ou `{ status: "REJEITADA", motivo }`.

A migration 002 cria a fila em `solicitacoes_avaliacao`. Ela sobrevive a reinícios do
barramento. Reenvios do mesmo requestId e conteúdo recuperam a solicitação existente;
conteúdo diferente retorna 409. A criação é aceita mesmo com Avaliações fora do ar;
o serviço valida o produto quando consumir a solicitação. O frontend distingue
PENDENTE, PROCESSADA (aguardando projeção) e REJEITADA. Solicitações só entram na média
depois de gravadas por Avaliações e projetadas por Query.

O UUID do evento coincide com o da avaliação. Reenvios iguais retornam o mesmo ID e
sequência; conteúdo diferente para um ID existente retorna 409. O retorno só ocorre
depois do commit. Um lock transacional ordena as inserções para impedir que o consumidor
avance além de uma sequência ainda não confirmada por outro publicador.

Query consome o histórico por polling, inclusive para replay após quedas.
O barramento pode reiniciar sem perder os eventos. Com o barramento parado, a outbox
de Avaliações conserva publicações pendentes; Query continua servindo sua projeção.

Configuração local em `.env.example`; `npm ci` e `npm run dev`.
No Docker: `docker compose up -d --build event-bus` na raiz.
