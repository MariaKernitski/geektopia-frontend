// Textos curtos dos "?" ao lado de campos que costumam confundir. Ficam todos aqui para ser fácil revisar o texto.
//   texto: a explicação (1 ou 2 frases)    artigo: id do artigo da Central de Ajuda com o passo a passo (opcional)
export const DICAS = {
  documentoTitular: { texto: 'Informe o documento de quem vai usar este ingresso, não o de quem está comprando. Na entrada, o documento com foto é conferido com este nome.', artigo: 'comprar-ingresso' },
  nascimentoTitular: { texto: 'Usamos a data para conferir a idade mínima do evento. Datas irreais são recusadas.', artigo: 'comprar-ingresso' },
  limitePorPessoa: { texto: 'Quantos ingressos deste lote uma pessoa pode levar numa mesma compra. A meia-entrada é sempre 1. Deixe vazio para não limitar.' },
  idadeMinimaLote: { texto: 'Idade exigida só para este ingresso. Se ficar vazio, vale a classificação indicativa da edição.' },
  categoriaLote: { texto: 'Inteira, Meia-entrada ou outro tipo (como Meet & Greet). A meia-entrada exige comprovação do direito na entrada.' },
  portfolio: { texto: 'Um link do seu trabalho (Instagram, site, Drive ou vídeo). É com ele que a organização avalia o pedido, por isso é obrigatório.', artigo: 'virar-expositor' },
  portfolioCompeticao: { texto: 'Um link do seu material de apresentação (portfólio, Instagram, Drive ou vídeo). A organização avalia a inscrição por ele.', artigo: 'inscrever-competicao' },
  nicknameCompeticao: { texto: 'O nome que aparece no placar e nas chaves. Em cada edição, dois competidores não podem ter o mesmo nome.', artigo: 'virar-competidor' },
  extrasExpositor: { texto: 'Mesas, cadeiras e ajudantes além do que o espaço já inclui. Cada extra tem um valor, somado ao total. Você só paga se a diretoria aprovar.', artigo: 'solicitar-espaco' },
  generoCadastro: { texto: 'Usado só para estatísticas do público, sem identificar você. Pode escolher “Prefiro não informar”.' },
  sexualidadePerfil: { texto: 'Opcional. É um dado sensível, usado apenas em estatísticas agregadas. Você pode apagar quando quiser.', artigo: 'editar-perfil' },
  linkEventoComunidade: { texto: 'Link do evento ou de quem organiza (Instagram, site, Drive). A CCPOP avalia o pedido por ele.', artigo: 'divulgar-evento' },
  relatorioBase: { texto: '“Participantes” conta quem tem ingresso. “Todos os usuários” conta todo mundo que se cadastrou, tendo comprado ou não.', artigo: 'admin-relatorios' },
  relatorioFiltros: { texto: 'Dica: clique numa barra ou fatia de qualquer gráfico para aplicar aquele valor como filtro. Remova pelas etiquetas amarelas.', artigo: 'admin-relatorios' },
  checkinCodigo: { texto: 'O código começa com GT- e aparece abaixo do QR code do ingresso. Use se a câmera não conseguir ler.', artigo: 'admin-checkin' }
};
