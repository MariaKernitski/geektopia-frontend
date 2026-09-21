// Regras do formulário de evento da comunidade. Espelham o servidor
// (geektopia-backend/src/controllers/eventoComunidadeController.js); o servidor é a palavra final.

export const hojeISO = () => new Date().toISOString().slice(0, 10);
export const limiteDataISO = () => `${new Date().getFullYear() + 3}-12-31`;

const dataValida = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(new Date(`${v}T12:00:00`).getTime());

export function validarEventoComunidade(f) {
  const erros = {};
  const nome = String(f.nome_evento ?? '').trim();
  if (!nome) erros.nome_evento = 'Informe o nome do evento.';
  else if (nome.length > 150) erros.nome_evento = 'O nome pode ter até 150 caracteres.';

  if (!f.data_evento) erros.data_evento = 'Informe a data do evento.';
  else if (!dataValida(f.data_evento)) erros.data_evento = 'Data inválida. Confira dia, mês e ano (com 4 dígitos).';
  else if (f.data_evento < hojeISO()) erros.data_evento = 'A data do evento não pode estar no passado.';
  else if (f.data_evento > limiteDataISO()) erros.data_evento = 'Data muito distante. Confira o ano.';

  if (f.data_fim) {
    if (!dataValida(f.data_fim)) erros.data_fim = 'Data inválida.';
    else if (f.data_evento && f.data_fim < f.data_evento) erros.data_fim = 'O término deve ser igual ou depois do início.';
  }

  if (!String(f.local ?? '').trim()) erros.local = 'Informe o local.';
  else if (f.local.trim().length > 200) erros.local = 'O local pode ter até 200 caracteres.';

  if (!String(f.descricao ?? '').trim()) erros.descricao = 'Escreva uma descrição do evento.';
  else if (f.descricao.trim().length > 3000) erros.descricao = 'A descrição pode ter até 3000 caracteres.';

  if (!f.url_saiba_mais?.trim()) erros.url_saiba_mais = 'Informe um link do evento ou do organizador (Instagram, site, Drive): a CCPOP avalia por ele.';
  else {
    try {
      const u = new URL(f.url_saiba_mais.trim());
      if (!['http:', 'https:'].includes(u.protocol)) throw new Error();
    } catch { erros.url_saiba_mais = 'O link precisa começar com http:// ou https://'; }
  }
  return erros;
}

export const paraEnvio = (f) => ({
  nome_evento: f.nome_evento.trim(),
  data_evento: new Date(`${f.data_evento}T12:00:00`).toISOString(),
  data_fim: f.data_fim ? new Date(`${f.data_fim}T12:00:00`).toISOString() : null,
  local: f.local.trim(),
  descricao: f.descricao.trim(),
  url_saiba_mais: f.url_saiba_mais?.trim() || null,
  regras_idade_minima: f.regras_idade_minima?.trim() || null,
  instituicao_empresa: f.instituicao_empresa?.trim() || undefined
});
