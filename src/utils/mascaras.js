// Máscaras de digitação. Só formatam: a validação fica em validacao.js.

// (00) 00000-0000 ou (00) 0000-0000
export const mascaraTelefone = (valor) => {
  const d = String(valor ?? '').replace(/\D/g, '').slice(0, 11);
  if (d.length > 10) return d.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
  if (d.length > 6) return d.replace(/^(\d{2})(\d{4})(\d{0,4})$/, '($1) $2-$3');
  if (d.length > 2) return d.replace(/^(\d{2})(\d{0,5})$/, '($1) $2');
  return d;
};

export const mascaraCpf = (valor) => {
  const d = String(valor ?? '').replace(/\D/g, '').slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2');
};

export const mascaraCnpj = (valor) => {
  const d = String(valor ?? '').replace(/\D/g, '').slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
};
