// Contraste entre cores (WCAG). Usado no seletor de cor da edição: o admin
// pode escolher qualquer cor, então avisamos quando ela dificulta a leitura.

export const COR_PADRAO = '#F7C531'; // amarelo CCPOP (--light-yellow)

export function ehHexValido(valor) {
  return typeof valor === 'string' && /^#[0-9a-fA-F]{6}$/.test(valor);
}

function luminancia(hex) {
  const canais = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = canais.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Razão de contraste de 1 (igual) a 21 (preto no branco).
export function contraste(hexA, hexB) {
  const [maior, menor] = [luminancia(hexA), luminancia(hexB)].sort((a, b) => b - a);
  return (maior + 0.05) / (menor + 0.05);
}
