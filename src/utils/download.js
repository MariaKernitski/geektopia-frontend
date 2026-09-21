import api from '../services/api';

// Baixa um arquivo protegido por login (o PDF do ingresso exige o token): busca como arquivo
// e dispara o download no navegador.
export async function baixarArquivo(url, nomeSugerido) {
  const res = await api.get(url, { responseType: 'blob', timeout: 30000 });
  const objeto = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = objeto;
  a.download = nomeSugerido;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(objeto), 10000);
}
