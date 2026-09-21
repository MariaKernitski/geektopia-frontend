// Conta itens por valor de um campo de status: { todas: n, EmAnalise: n, ... }
export function contarPorStatus(lista, campo) {
  const c = { todas: lista.length };
  lista.forEach((i) => { c[i[campo]] = (c[i[campo]] || 0) + 1; });
  return c;
}
