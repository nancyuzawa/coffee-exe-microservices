export class HttpError extends Error {
  constructor(status, message, code = 'REQUISICAO_INVALIDA') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error instanceof HttpError || error.status === 409) {
    if (error.status === 503) res.set('Retry-After', '5');
    return res.status(error.status).json({ error: error.message, code: error.code });
  }
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'O corpo da requisição deve ser um JSON válido.', code: 'JSON_INVALIDO' });
  }
  if (error.type === 'entity.too.large') {
    return res.status(413).json({ error: 'O corpo da requisição excede o limite permitido.', code: 'CORPO_MUITO_GRANDE' });
  }
  if (/Sequelize(Connection|Host|Access|Timeout)/.test(error.name) ||
      ['ECONNREFUSED', 'ETIMEDOUT', 'ECONNRESET', 'PROTOCOL_CONNECTION_LOST'].includes(error.parent?.code)) {
    console.error('Banco indisponível:', error.name);
    res.set('Retry-After', '5');
    return res.status(503).json({ error: 'O banco de dados deste serviço está temporariamente indisponível. Tente novamente.', code: 'BANCO_INDISPONIVEL' });
  }
  if (/Sequelize(Validation|UniqueConstraint)/.test(error.name)) {
    return res.status(400).json({ error: 'Os dados informados não atendem ao formato esperado.', code: 'DADOS_INVALIDOS' });
  }
  console.error('Falha interna:', error.name, error.message);
  return res.status(500).json({ error: 'Não foi possível concluir a operação. Tente novamente.', code: 'ERRO_INTERNO' });
}
