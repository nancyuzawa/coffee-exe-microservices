# Consulta de avaliações

Express na porta 3004, com MySQL e volume exclusivos (`query-data`).
O frontend consulta este serviço para listar avaliações e médias:

- `GET /avaliacoes?produtoId=UUID`
- `GET /avaliacoes/media/UUID`
- `GET /health` e `GET /ready`

Os contratos das duas leituras são iguais aos de Avaliações. Não existem endpoints
para cadastrar avaliações neste serviço; o POST continua no ms-avaliacoes.

O consumidor busca eventos do Event Bus a cada 2 segundos, com timeout e novas tentativas.
Atualiza a projeção e seu checkpoint na mesma transação. Eventos repetidos não criam
novas linhas. A média é calculada com AVG/COUNT no banco de consulta.

A primeira inicialização espera a recuperação do histórico antes de liberar leituras.
Depois, tanto a projeção quanto o checkpoint persistem entre reinícios, e o serviço
pode servir consultas mesmo com Event Bus e Avaliações parados. Ao voltar, recupera
o que ocorreu enquanto estava fora. A consistência entre gravação e leitura é eventual.

Um cliente em outro computador não precisa de cache de navegador para acessar os dados.
Ele precisa acessar o frontend hospedado no servidor, com Query e seu banco disponíveis.

Configuração local em `.env.example`; `npm ci` e `npm run dev`.
No Docker: `docker compose up -d --build ms-query` na raiz.
