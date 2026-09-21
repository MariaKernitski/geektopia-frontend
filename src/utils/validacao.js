// Validações de formulário de usuário. Espelham as regras do servidor
// (geektopia-backend/src/utils/validacaoUsuario.js): a tela avisa na hora, e o
// servidor continua sendo a palavra final.
//
// Cada função devolve a mensagem de erro, ou '' se estiver tudo certo.
//
// Sobre "dados de verdade": o FORMATO é sempre conferido. O dígito verificador
// de CPF/CNPJ só é exigido no build de produção, para permitir testar com dados
// inventados em desenvolvimento. VITE_VALIDAR_DOCUMENTOS=true|false força.

import { cpfValido, somenteDigitos } from './cpf';

export function exigirDigitoVerificador() {
  const forcado = import.meta.env.VITE_VALIDAR_DOCUMENTOS;
  if (forcado === 'true') return true;
  if (forcado === 'false') return false;
  return import.meta.env.PROD;
}

export function cnpjValido(valor) {
  const cnpj = somenteDigitos(valor);
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;

  const digito = (base) => {
    const pesos = base.length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const soma = [...base].reduce((acc, n, i) => acc + Number(n) * pesos[i], 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };
  return digito(cnpj.slice(0, 12)) === Number(cnpj[12]) && digito(cnpj.slice(0, 13)) === Number(cnpj[13]);
}

export function nomeCompleto(valor, { doisNomes = true } = {}) {
  const nome = String(valor ?? '').trim().replace(/\s+/g, ' ');
  if (!nome) return 'Informe o nome completo.';
  if (nome.length < 3) return 'O nome precisa ter pelo menos 3 letras.';
  if (nome.length > 150) return 'O nome deve ter no máximo 150 caracteres.';
  if (!/^\p{L}[\p{L}\s'.-]*$/u.test(nome)) return 'O nome só pode ter letras, espaços, apóstrofo, ponto e hífen.';
  if (doisNomes && !nome.includes(' ')) return 'Informe nome e sobrenome.';
  return '';
}

export function documento(tipo, valor) {
  const bruto = String(valor ?? '').trim();
  if (!bruto) return 'Informe o documento.';

  if (tipo === 'cpf') {
    const d = somenteDigitos(bruto);
    if (d.length !== 11) return 'O CPF deve ter 11 dígitos.';
    if (exigirDigitoVerificador() && !cpfValido(d)) return 'CPF inválido. Confira os números.';
  } else if (tipo === 'cnpj') {
    const d = somenteDigitos(bruto);
    if (d.length !== 14) return 'O CNPJ deve ter 14 dígitos.';
    if (exigirDigitoVerificador() && !cnpjValido(d)) return 'CNPJ inválido. Confira os números.';
  } else if (!/^[A-Za-z0-9]{6,20}$/.test(bruto)) {
    return 'Passaporte inválido: use de 6 a 20 letras e números, sem espaços.';
  }
  return '';
}

export function email(valor) {
  const e = String(valor ?? '').trim();
  if (!e) return 'Informe o e-mail.';
  if (e.length > 100) return 'O e-mail deve ter no máximo 100 caracteres.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) || e.includes('..')) return 'E-mail inválido. Use o formato nome@dominio.com.';
  return '';
}

export function telefone(valor, { obrigatorio = true } = {}) {
  const d = somenteDigitos(valor);
  if (!d) return obrigatorio ? 'Informe o telefone.' : '';
  if (d.length < 10) return 'Telefone incompleto: informe DDD + número.';
  if (d.length > 11) return 'Telefone com dígitos demais.';
  if (Number(d.slice(0, 2)) < 11) return 'DDD inválido.';
  if (d.length === 11 && d[2] !== '9') return 'Celular inválido: o número deve começar com 9 depois do DDD.';
  return '';
}

// 'YYYY-MM-DD' que exista de verdade (recusa 2001-02-30).
function lerData(valor) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor || '')) return null;
  const [a, m, d] = valor.split('-').map(Number);
  const data = new Date(Date.UTC(a, m - 1, d, 12));
  return data.getUTCFullYear() === a && data.getUTCMonth() === m - 1 && data.getUTCDate() === d ? data : null;
}

// Igual ao backend (utils/validacaoUsuario.js). Portaria MJ 502/2021: a partir dos 12 anos
// a pessoa pode ir sozinha a eventos com termo de autorização do responsável.
export const IDADE_MINIMA_CADASTRO = 12;

export function dataNascimento(valor) {
  if (!valor) return 'Informe a data de nascimento.';
  const data = lerData(valor);
  if (!data) return 'Data inválida. Confira dia, mês e ano.';
  if (data > new Date()) return 'A data de nascimento não pode ser no futuro.';
  if (data.getUTCFullYear() < new Date().getUTCFullYear() - 120) return 'Data inválida: ano muito antigo.';
  if (idadeEmAnos(valor) < IDADE_MINIMA_CADASTRO) return `É preciso ter pelo menos ${IDADE_MINIMA_CADASTRO} anos para criar uma conta.`;
  return '';
}

// Idade em anos completos hoje, ou null se a data for inválida.
export function idadeEmAnos(valor) {
  const data = lerData(valor);
  if (!data || data > new Date()) return null;
  const hoje = new Date();
  let idade = hoje.getUTCFullYear() - data.getUTCFullYear();
  const fezAniversario =
    hoje.getUTCMonth() > data.getUTCMonth() ||
    (hoje.getUTCMonth() === data.getUTCMonth() && hoje.getUTCDate() >= data.getUTCDate());
  if (!fezAniversario) idade -= 1;
  return idade;
}

export const requisitosSenha = (senha = '') => ({
  tamanho: senha.length >= 8,
  maiuscula: /[A-Z]/.test(senha),
  minuscula: /[a-z]/.test(senha),
  numero: /\d/.test(senha),
  especial: /[^A-Za-z0-9]/.test(senha)
});

export function senha(valor) {
  if (!valor) return 'Informe a senha.';
  if (!Object.values(requisitosSenha(valor)).every(Boolean)) return 'A senha ainda não atende a todos os requisitos abaixo.';
  if (new TextEncoder().encode(valor).length > 72) return 'A senha deve ter no máximo 72 caracteres.';
  return '';
}

export function confirmarSenha(valor, senhaDigitada) {
  if (!valor) return 'Repita a senha.';
  if (valor !== senhaDigitada) return 'As senhas não coincidem.';
  return '';
}

export const obrigatorio = (valor, mensagem) => (String(valor ?? '').trim() ? '' : mensagem);
