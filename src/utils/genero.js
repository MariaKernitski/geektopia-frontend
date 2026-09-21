// Gênero no cadastro/perfil: lista fixa + "Outro" com texto livre. Espelha o servidor (backend/src/utils/genero.js).
export const GENEROS = ['Feminino', 'Masculino', 'Não binário', 'Outro', 'Prefiro não informar'];
export const SEXUALIDADES = ['Heterossexual', 'Homossexual', 'Bissexual', 'Pansexual', 'Assexual', 'Outra', 'Prefiro não informar'];

// Valor guardado -> { genero, generoOutro } para os campos da tela. Textos livres antigos viram "Outro" + o texto que a pessoa escreveu.
export function separarGenero(valor) {
  const v = (valor || '').trim();
  if (!v) return { genero: '', generoOutro: '' };
  if (GENEROS.includes(v)) return { genero: v, generoOutro: '' };
  const m = v.match(/^Outro:\s*(.*)$/);
  return { genero: 'Outro', generoOutro: (m ? m[1] : v).slice(0, 40) };
}

export function comporGenero(genero, generoOutro) {
  if (!genero) return null;
  const detalhe = (generoOutro || '').trim().replace(/\s+/g, ' ').replace(/[^\p{L}\p{N}\s'./-]/gu, '');
  return genero === 'Outro' && detalhe ? `Outro: ${detalhe}` : genero;
}

export function separarSexualidade(valor) {
  const v = (valor || '').trim();
  if (!v) return { sexualidade: '', sexualidadeOutra: '' };
  if (SEXUALIDADES.includes(v)) return { sexualidade: v, sexualidadeOutra: '' };
  const m = v.match(/^Outra:\s*(.*)$/);
  return { sexualidade: 'Outra', sexualidadeOutra: (m ? m[1] : v).slice(0, 40) };
}

export function comporSexualidade(sexualidade, outra) {
  if (!sexualidade) return '';
  const detalhe = (outra || '').trim().replace(/\s+/g, ' ').replace(/[^\p{L}\p{N}\s'./-]/gu, '');
  return sexualidade === 'Outra' && detalhe ? `Outra: ${detalhe}` : sexualidade;
}
