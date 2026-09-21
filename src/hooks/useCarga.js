import { useCallback, useEffect, useState } from 'react';
import { mensagemDeErro } from './useAviso';

// Carrega dados de uma API e permite recarregar depois de uma alteração.
//
//   buscar  função ESTÁVEL (useCallback) que devolve uma Promise com os dados
//   dados   o que `buscar` devolveu (pode ser null: "não existe" é uma resposta válida)
//   erro    mensagem, se a carga falhou
//   atualizando  true enquanto uma nova busca roda com dados antigos ainda na tela
//   definir atualiza os dados localmente (ex.: reordenar na tela antes do servidor)
//
// O estado só é atualizado dentro do .then(), e nunca depois de a tela ter
// sido fechada ou de uma nova carga ter começado (a flag `ativo`), que é o que
// evitava uma resposta atrasada sobrescrever a mais nova.
export function useCarga(buscar) {
  const [estado, setEstado] = useState({ dados: null, erro: '', carregado: false, origem: null });
  const [tentativa, setTentativa] = useState(0);

  const recarregar = useCallback(() => setTentativa((n) => n + 1), []);

  const definir = useCallback((novo) => {
    setEstado((e) => ({ ...e, dados: typeof novo === 'function' ? novo(e.dados) : novo }));
  }, []);

  useEffect(() => {
    let ativo = true;

    buscar()
      .then((dados) => { if (ativo) setEstado({ dados, erro: '', carregado: true, origem: { buscar, tentativa } }); })
      .catch((err) => {
        if (ativo) setEstado({ dados: null, erro: mensagemDeErro(err, 'Não foi possível carregar os dados.'), carregado: false, origem: null });
      });

    return () => { ativo = false; };
  }, [buscar, tentativa]);

  return {
    dados: estado.dados,
    erro: estado.erro,
    // Um resultado null NÃO é "carregando": só vale enquanto a primeira resposta não chegou.
    carregando: !estado.carregado && !estado.erro,
    // Já há dados na tela, mas uma busca nova (outro filtro/página) ainda não voltou.
    atualizando: estado.carregado && (estado.origem?.buscar !== buscar || estado.origem?.tentativa !== tentativa),
    recarregar,
    definir
  };
}

// Junta a mensagem da última ação com o erro de carga: a ação mais recente
// (sucesso ou erro) vence; se não houver, mostra o erro de carga.
export function avisoDaTela(aviso, erroCarga) {
  return aviso.texto || !erroCarga ? aviso : { tipo: 'erro', texto: erroCarga };
}
