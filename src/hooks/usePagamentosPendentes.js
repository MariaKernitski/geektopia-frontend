import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../services/api';

const INTERVALO_MS = 8000;
const MAX_TENTATIVAS = 20; // ~2,5 min; depois disso só o botão "Verificar agora"

// Confirma sozinho os pagamentos pendentes de uma tela (taxa de espaço, inscrição em competição).
// O Mercado Pago pode demorar a avisar o servidor (ou o aviso pode não chegar), então a tela
// pergunta por conta própria: ao abrir, a cada poucos segundos e sempre que a pessoa volta para a aba.
//   ids     ids dos pedidos ainda Pendentes
//   onPago  chamado quando algum vira Pago (a tela recarrega os dados)
export function usePagamentosPendentes(ids, onPago) {
  const [verificando, setVerificando] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const chave = ids.join(',');
  const aoPagar = useRef(onPago);
  useEffect(() => { aoPagar.current = onPago; }, [onPago]);

  const verificar = useCallback(async () => {
    const lista = chave ? chave.split(',') : [];
    if (lista.length === 0) return;
    setVerificando(true);
    let pago = false;
    let ultima = '';
    for (const id of lista) {
      try {
        const r = await api.get(`/pedidos/${id}/sincronizar`);
        if (r.data.status_pedido === 'Pago') pago = true;
        else ultima = r.data.mensagem || '';
      } catch {
        ultima = 'Não foi possível consultar o Mercado Pago agora. Tente de novo em instantes.';
      }
    }
    setVerificando(false);
    setMensagem(pago ? '' : ultima);
    if (pago) aoPagar.current?.();
  }, [chave]);

  useEffect(() => {
    if (!chave) return undefined;
    let tentativas = 0;
    const primeira = setTimeout(verificar, 0);
    const intervalo = setInterval(() => {
      if (document.visibilityState === 'visible' && tentativas < MAX_TENTATIVAS) { tentativas += 1; verificar(); }
    }, INTERVALO_MS);
    const aoVoltar = () => { if (document.visibilityState === 'visible') verificar(); };
    document.addEventListener('visibilitychange', aoVoltar);
    window.addEventListener('focus', aoVoltar);
    return () => {
      clearTimeout(primeira);
      clearInterval(intervalo);
      document.removeEventListener('visibilitychange', aoVoltar);
      window.removeEventListener('focus', aoVoltar);
    };
  }, [chave, verificar]);

  return { verificando, mensagem, verificar };
}
