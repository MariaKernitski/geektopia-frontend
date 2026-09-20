import { useCallback, useState } from 'react';

// Mensagem de retorno (sucesso/erro) de uma tela. Guardar { tipo, texto } num
// lugar só evita repetir o mesmo useState em todas as abas do painel.
export function useAviso() {
  const [aviso, setAviso] = useState({ tipo: '', texto: '' });

  const mostrar = useCallback((tipo, texto) => setAviso({ tipo, texto }), []);
  const limpar = useCallback(() => setAviso({ tipo: '', texto: '' }), []);

  return { aviso, mostrar, limpar };
}

// Texto de erro vindo da API, ou o padrão da tela quando não houver resposta
// (servidor fora do ar, queda de rede).
export function mensagemDeErro(err, padrao) {
  return err?.response?.data?.error || padrao;
}
