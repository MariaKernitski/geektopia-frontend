import { FiAward, FiFlag, FiGrid, FiClock, FiEdit3, FiGlobe, FiImage, FiLayout, FiShoppingBag, FiTag, FiUsers } from 'react-icons/fi';

// Catálogo das abas do painel de uma edição. Fica num arquivo próprio para o
// painel (AdminEdicao) e o assistente de criação (AdminCriarEvento) lerem a
// mesma fonte: mudar quais abas cada tipo de edição tem é mexer só aqui.
export const ABAS = {
  dados: { rotulo: 'Dados', Icone: FiEdit3 },
  vitrine: { rotulo: 'Vitrine', Icone: FiLayout },
  ingressos: { rotulo: 'Ingressos', Icone: FiTag },
  programacao: { rotulo: 'Programação', Icone: FiClock },
  competicoes: { rotulo: 'Competições', Icone: FiAward },
  inscricoes: { rotulo: 'Inscrições', Icone: FiFlag },
  convidados: { rotulo: 'Convidados', Icone: FiUsers },
  espacos: { rotulo: 'Espaços', Icone: FiGrid },
  expositores: { rotulo: 'Expositores', Icone: FiShoppingBag },
  fotos: { rotulo: 'Fotos', Icone: FiImage },
  publicacao: { rotulo: 'Publicação', Icone: FiGlobe }
};

const ABAS_PRINCIPAL = ['dados', 'vitrine', 'ingressos', 'programacao', 'competicoes', 'inscricoes', 'convidados', 'espacos', 'expositores', 'fotos', 'publicacao'];

// Pocket é a edição menor: em geral só ingressos, e às vezes alguns expositores
// (o servidor aceita candidatura em qualquer edição publicada, então a diretoria
// precisa da aba para analisá-las).
export const ABAS_POR_TIPO = {
  Pocket: ['dados', 'ingressos', 'espacos', 'expositores', 'publicacao'],
  Principal: ABAS_PRINCIPAL,
  // A edição passada continua editável até ser esquecida: programação, fotos,
  // convidados e expositores ainda recebem ajustes depois do evento.
  PrincipalAnterior: ABAS_PRINCIPAL
};

// Ordem do assistente logo após criar. 'dados' é o próprio formulário de
// criação (passo 1); expositores ficam de fora porque só existem depois que
// os expositores se candidatam.
export const PASSOS_GUIADOS = {
  Pocket: ['dados', 'ingressos', 'publicacao'],
  Principal: ['dados', 'vitrine', 'ingressos', 'programacao', 'competicoes', 'convidados', 'fotos', 'publicacao']
};

export const ROTULO_TIPO = {
  Principal: 'Principal',
  PrincipalAnterior: 'Principal anterior',
  Pocket: 'Pocket'
};

export const ROTULO_STATUS = {
  Bloqueado: 'Rascunho',
  VendasAbertas: 'Vendas abertas',
  VendasEncerradas: 'Vendas encerradas',
  Encerrado: 'Encerrado'
};
