// Abre o Mercado Pago em outra aba, para a pessoa não perder o site.
//
// O navegador só permite abrir uma aba logo no clique, por isso `abrirAbaPagamento` deve ser a primeira
// coisa do tratador do clique (antes de qualquer espera pela API). Depois, `irParaPagamento` aponta a aba
// para o link do Mercado Pago. Se o navegador bloquear a aba, usa a mesma janela como antes.
export function abrirAbaPagamento() {
  try {
    const aba = window.open('', '_blank');
    if (aba) {
      aba.document.title = 'Mercado Pago';
      aba.document.body.innerText = 'Abrindo o Mercado Pago...';
    }
    return aba;
  } catch {
    return null;
  }
}

// Devolve true se abriu em outra aba (a página atual continua no site).
export function irParaPagamento(aba, url) {
  if (aba && !aba.closed) {
    aba.opener = null;
    aba.location.href = url;
    return true;
  }
  window.location.assign(url);
  return false;
}

export const fecharAbaPagamento = (aba) => { try { aba?.close(); } catch { /* ignora */ } };
