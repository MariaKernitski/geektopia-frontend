// Cópia do texto PADRÃO da landing page (a fonte é geektopia-backend/src/controllers/conteudoController.js).
// Só é usada se a API estiver fora do ar; normalmente a página usa o que o admin salvou.
export const LANDING_PADRAO = {
  hero: {
    selo: 'Conselho de Cultura POP de Ponta Grossa',
    titulo: 'A cena *geek e pop* de Ponta Grossa começa aqui.',
    lead: 'Ingressos, competições e espaço para expositores da Geektopia e dos Pockets, tudo num só lugar.',
    confianca: ['Compra segura', 'Ingresso no celular', 'Acompanhe tudo online']
  },
  numeros: [
    { valor: '3', legenda: 'edições realizadas desde 2023' },
    { valor: '+5 mil', legenda: 'visitantes na última edição' },
    { valor: '40+', legenda: 'expositores e competidores' }
  ],
  sobre: {
    titulo: 'Quem é o CCPOP?',
    texto: 'O CCPOP (Conselho de Cultura Pop de Ponta Grossa) é uma entidade organizadora voltada a fomentar, estruturar e expandir a cena geek, nerd e pop nos Campos Gerais. Nosso objetivo é inserir Ponta Grossa de vez na rota dos grandes eventos estaduais do setor, valorizando a economia criativa e unindo a comunidade entusiasta.',
    etiquetas: ['Games', 'Animes', 'K-pop', 'RPG', 'Artes visuais']
  },
  chamada: {
    titulo: 'Quer expor ou competir na próxima Geektopia?',
    texto: 'As solicitações de espaço e as inscrições em competições são feitas pela plataforma. A organização analisa e você acompanha o resultado.'
  },
  rodape: { nome: 'Conselho de Cultura POP de Ponta Grossa', instagram: 'https://instagram.com/ccpop.pg' }
};

// "A cena *geek e pop* de..." -> [{ texto, destaque }]: o trecho entre asteriscos aparece em amarelo.
export function partesDoTitulo(titulo) {
  return String(titulo || '').split(/(\*[^*]+\*)/).filter(Boolean).map((p) => (
    p.startsWith('*') && p.endsWith('*') && p.length > 2 ? { texto: p.slice(1, -1), destaque: true } : { texto: p, destaque: false }
  ));
}
