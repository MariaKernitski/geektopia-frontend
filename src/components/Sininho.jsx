import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiBell, FiCheck } from 'react-icons/fi';
import api from '../services/api';
import '../style/Sininho.css';

const INTERVALO_MS = 60000;

const quando = (iso) => {
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h} h`;
  return new Date(iso).toLocaleDateString('pt-BR');
};

// Sininho do cabeçalho: mostra as notificações do usuário (aprovações, pagamentos, ingressos...).
// Atualiza a cada minuto e a cada troca de página; não faz nada para quem não está logado.
export function Sininho() {
  const [dados, setDados] = useState({ itens: [], nao_lidas: 0 });
  const [aberto, setAberto] = useState(false);
  const raiz = useRef(null);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const carregar = useCallback(() => {
    api.get('/notificacoes').then((r) => setDados(r.data)).catch(() => { /* sem rede: mantém o que tinha */ });
  }, []);

  useEffect(() => {
    carregar();
    const id = setInterval(() => { if (document.visibilityState === 'visible') carregar(); }, INTERVALO_MS);
    return () => clearInterval(id);
  }, [carregar, pathname]);

  useEffect(() => {
    if (!aberto) return undefined;
    const fora = (e) => { if (raiz.current && !raiz.current.contains(e.target)) setAberto(false); };
    const tecla = (e) => { if (e.key === 'Escape') setAberto(false); };
    document.addEventListener('mousedown', fora);
    document.addEventListener('keydown', tecla);
    return () => { document.removeEventListener('mousedown', fora); document.removeEventListener('keydown', tecla); };
  }, [aberto]);

  const abrirItem = async (n) => {
    setAberto(false);
    if (!n.lida) {
      setDados((d) => ({ itens: d.itens.map((x) => (x.id_notificacao === n.id_notificacao ? { ...x, lida: true } : x)), nao_lidas: Math.max(0, d.nao_lidas - 1) }));
      api.patch(`/notificacoes/${n.id_notificacao}/lida`).catch(() => {});
    }
    if (n.link) navigate(n.link);
  };

  const marcarTodas = () => {
    setDados((d) => ({ itens: d.itens.map((x) => ({ ...x, lida: true })), nao_lidas: 0 }));
    api.patch('/notificacoes/lidas').catch(() => {});
  };

  return (
    <div className="sn" ref={raiz}>
      <button
        type="button" className="sn-botao" aria-haspopup="true" aria-expanded={aberto}
        aria-label={dados.nao_lidas > 0 ? `Notificações: ${dados.nao_lidas} não lida(s)` : 'Notificações'}
        onClick={() => setAberto((a) => !a)}
      >
        <FiBell aria-hidden="true" />
        {dados.nao_lidas > 0 && <span className="sn-contagem" aria-hidden="true">{dados.nao_lidas > 9 ? '9+' : dados.nao_lidas}</span>}
      </button>

      {aberto && (
        <div className="sn-painel" role="region" aria-label="Notificações">
          <div className="sn-topo">
            <strong>Notificações</strong>
            {dados.nao_lidas > 0 && <button type="button" className="sn-link" onClick={marcarTodas}><FiCheck aria-hidden="true" /> Marcar todas como lidas</button>}
          </div>
          {dados.itens.length === 0 ? (
            <p className="sn-vazio">Nada por aqui ainda. Avisos sobre pagamentos, ingressos e análises aparecem neste lugar.</p>
          ) : (
            <ul className="sn-lista">
              {dados.itens.map((n) => (
                <li key={n.id_notificacao}>
                  <button type="button" className={`sn-item ${n.lida ? '' : 'is-nova'}`} onClick={() => abrirItem(n)}>
                    <span className="sn-titulo">{n.titulo}</span>
                    {n.texto && <span className="sn-texto">{n.texto}</span>}
                    <span className="sn-quando">{quando(n.criada_em)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
