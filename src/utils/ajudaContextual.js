// Qual artigo da Central de Ajuda combina com a tela em que a pessoa está. A primeira regra que casar vale; sem regra, abre a Central.
// Os ids são os dos artigos do servidor (geektopia-backend/src/utils/catalogoAjuda.js).
const REGRAS = [
  [/^\/geektopia\/\d+\/comprar/, 'comprar-ingresso'],
  [/^\/geektopia\/\d+/, 'comprar-ingresso'],
  [/^\/pedido\/\d+\/confirmacao/, 'pagamento-nao-confirmou'],
  [/^\/competicoes\/\d+/, 'inscrever-competicao'],
  [/^\/competidor/, 'acompanhar-inscricao'],
  [/^\/expositor\/solicitar/, 'solicitar-espaco'],
  [/^\/expositor\/solicitacoes/, 'acompanhar-solicitacao'],
  [/^\/expositor/, 'virar-expositor'],
  [/^\/perfil/, 'editar-perfil'],
  [/^\/eventos/, 'divulgar-evento'],
  [/^\/cadastro/, 'criar-conta'],
  [/^\/login/, 'entrar-na-conta'],
  [/^\/(esqueci|redefinir)-senha/, 'esqueci-senha'],
  [/^\/admin\/eventos/, 'admin-criar-edicao'],
  [/^\/admin\/solicitacoes/, 'admin-analisar'],
  [/^\/admin\/usuarios/, 'admin-usuarios'],
  [/^\/admin\/paginas/, 'admin-conteudo'],
  [/^\/admin\/checkin/, 'admin-checkin'],
  [/^\/admin\/dashboard/, 'admin-relatorios']
];

export function artigoDaTela(caminho) {
  const regra = REGRAS.find(([padrao]) => padrao.test(caminho));
  return regra ? regra[1] : null;
}

// Telas em que o botão não aparece: a própria ajuda, onde ele seria redundante.
export const semBotaoDeAjuda = (caminho) => /^\/ajuda(\/|$)/.test(caminho) || /^\/confirmar-email/.test(caminho);
