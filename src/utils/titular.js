import { cpfValido, somenteDigitos } from './cpf';
import { exigirDigitoVerificador, idadeEmAnos } from './validacao';

// Regras dos dados de quem vai usar cada ingresso. Espelham o servidor
// (geektopia-backend/src/utils/titulares.js); o servidor é a palavra final.

export const MAX_INGRESSOS_POR_COMPRA = 10;

// Limite de ingressos do lote por pessoa. Meia-entrada tem 1 por pessoa mesmo sem configurar.
export const limiteDoLote = (lote) => lote.limite_por_pessoa ?? (lote.categoria === 'Meia' ? 1 : null);

// Idade exigida: a do lote ou, se não tiver, a classificação da edição.
export const idadeExigida = (lote, evento) => lote.idade_minima ?? (evento.classificacao_etaria > 0 ? evento.classificacao_etaria : null);

// Documento em forma canônica (CPF só dígitos; passaporte em maiúsculas sem símbolos).
export const documentoCanonico = (tipo, valor) => (
  tipo === 'cpf' ? somenteDigitos(valor) : String(valor ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '')
);

// Devolve { nome, documento, nascimento } com a mensagem de cada campo com problema.
export function validarTitular(t, { minIdade } = {}) {
  const erros = {};

  const nome = String(t.nome ?? '').trim().replace(/\s+/g, ' ');
  if (!nome) erros.nome = 'Informe o nome completo do titular.';
  else if (nome.length < 3 || !nome.includes(' ')) erros.nome = 'Informe nome e sobrenome.';
  else if (!/^\p{L}[\p{L}\s'.-]*$/u.test(nome)) erros.nome = 'O nome só pode ter letras, espaços, apóstrofo, ponto e hífen.';

  if (!String(t.doc ?? '').trim()) erros.documento = 'Informe o documento.';
  else if (t.tipoDoc === 'cpf') {
    const d = somenteDigitos(t.doc);
    if (d.length !== 11) erros.documento = 'O CPF deve ter 11 dígitos.';
    else if (exigirDigitoVerificador() && !cpfValido(d)) erros.documento = 'CPF inválido. Confira os números.';
  } else {
    const p = documentoCanonico('passaporte', t.doc);
    if (p.length < 5 || p.length > 20) erros.documento = 'Passaporte inválido: use de 5 a 20 letras e números.';
  }

  if (!t.nasc) erros.nascimento = 'Informe a data de nascimento.';
  else {
    const d = new Date(`${t.nasc}T00:00:00Z`);
    if (Number.isNaN(d.getTime())) erros.nascimento = 'Data inválida. Confira dia, mês e ano.';
    else if (d > new Date()) erros.nascimento = 'A data de nascimento não pode ser no futuro.';
    else {
      const idade = idadeEmAnos(t.nasc);
      if (idade > 120) erros.nascimento = 'Data inválida: ano muito antigo.';
      else if (minIdade && idade < minIdade) erros.nascimento = `Este ingresso exige ${minIdade}+ anos. O titular tem ${idade}.`;
    }
  }
  return erros;
}
