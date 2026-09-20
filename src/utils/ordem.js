// Troca o item de posição com o vizinho (delta = -1 sobe, +1 desce).
// Devolve a MESMA lista se o movimento sairia dos limites.
export function mover(lista, indice, delta) {
  const destino = indice + delta;
  if (destino < 0 || destino >= lista.length) return lista;

  const nova = [...lista];
  [nova[indice], nova[destino]] = [nova[destino], nova[indice]];
  return nova;
}
