import { contraste, ehHexValido } from './cores';

// Fundo do banner sem imagem, guardado como texto:
//   "#RRGGBB"                 cor lisa
//   "#RRGGBB,#RRGGBB"         gradiente na diagonal (135°)
//   "#RRGGBB,#RRGGBB,ÂNGULO"  gradiente no ângulo dado (0 a 360)
export const ANGULOS = [
  { valor: 135, rotulo: 'Diagonal' },
  { valor: 180, rotulo: 'De cima para baixo' },
  { valor: 90, rotulo: 'Da esquerda para a direita' }
];

// Combinações prontas: escuras e vivas, para o texto branco do banner continuar legível.
export const PRESETS = [
  { nome: 'Meia-noite', valor: '#1D1C22,#3B2F63,135' },
  { nome: 'Aurora', valor: '#0E7C78,#1D1C22,135' },
  { nome: 'Pôr do sol', valor: '#7B2CBF,#E4405F,135' },
  { nome: 'Oceano', valor: '#0B3C5D,#328CC1,135' },
  { nome: 'Floresta', valor: '#14532D,#0E7C78,135' },
  { nome: 'Brasa', valor: '#7F1D1D,#C2410C,135' },
  { nome: 'Ultravioleta', valor: '#3B0764,#6D28D9,135' },
  { nome: 'Grafite', valor: '#2B2A33' }
];

export function lerFundo(texto) {
  if (typeof texto !== 'string') return null;
  const [a, b, ang] = texto.split(',');
  if (!ehHexValido(a) || (b !== undefined && !ehHexValido(b))) return null;
  return { cor1: a.toUpperCase(), cor2: b ? b.toUpperCase() : null, angulo: ang === undefined ? 135 : Number(ang) };
}

export function montarFundo({ cor1, cor2, angulo }) {
  if (!cor2) return cor1;
  return `${cor1},${cor2},${angulo ?? 135}`;
}

// Valor de `background` do CSS, ou null se não houver fundo válido.
export function cssDoFundo(texto) {
  const f = lerFundo(texto);
  if (!f) return null;
  return f.cor2 ? `linear-gradient(${f.angulo}deg, ${f.cor1}, ${f.cor2})` : f.cor1;
}

// Pior contraste do texto branco sobre as cores escolhidas (mínimo recomendado: 3 para títulos grandes).
export function contrasteComBranco(texto) {
  const f = lerFundo(texto);
  if (!f) return null;
  return Math.min(contraste(f.cor1, '#FFFFFF'), f.cor2 ? contraste(f.cor2, '#FFFFFF') : 21);
}

// Estado inicial do editor a partir do que está salvo na edição.
export function fundoInicial(evento) {
  const f = lerFundo(evento?.banner_fundo);
  return {
    modo: f ? 'cor' : 'imagem',
    cor1: f?.cor1 || '#1D1C22',
    cor2: f?.cor2 || '#3B2F63',
    gradiente: f ? Boolean(f.cor2) : true,
    angulo: f?.angulo ?? 135
  };
}

// Texto guardado no banco (null = usa imagem).
export const fundoParaTexto = (fundo) => (
  fundo.modo === 'cor' ? montarFundo({ cor1: fundo.cor1, cor2: fundo.gradiente ? fundo.cor2 : null, angulo: fundo.angulo }) : null
);

