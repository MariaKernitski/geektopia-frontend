import { useCallback } from 'react';
import api from '../services/api';
import { useCarga } from './useCarga';

// Quantas solicitações aguardam análise da organização (só para administradores).
// Falha em silêncio: o contador é um aviso, não pode derrubar a tela em que aparece.
export function usePendencias(ativo = true, atualizarQuando = '') {
  const buscar = useCallback(async () => {
    if (!ativo) return { expositores: 0, competicoes: 0 };
    const contar = (url) => api.get(url, { params: { status: 'EmAnalise' } }).then((r) => r.data.length).catch(() => 0);
    const [expositores, competicoes] = await Promise.all([contar('/solicitacoes-espaco/admin/todas'), contar('/inscricoes/admin/todas')]);
    return { expositores, competicoes };
  // atualizarQuando: muda a cada navegação, para o contador não ficar velho depois de uma análise
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ativo, atualizarQuando]);
  const { dados } = useCarga(buscar);
  const expositores = dados?.expositores ?? 0;
  const competicoes = dados?.competicoes ?? 0;
  return { expositores, competicoes, total: expositores + competicoes };
}
