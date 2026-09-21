import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { ConfirmModal } from '../components/ConfirmModal';
import { ABAS, ABAS_POR_TIPO, PASSOS_GUIADOS, ROTULO_STATUS, ROTULO_TIPO } from '../components/edicao/abas';
import { AbaDados } from '../components/edicao/AbaDados';
import { AbaVitrine } from '../components/edicao/AbaVitrine';
import { AbaIngressos } from '../components/edicao/AbaIngressos';
import { AbaProgramacao } from '../components/edicao/AbaProgramacao';
import { AbaCompeticoes } from '../components/edicao/AbaCompeticoes';
import { AbaInscricoes } from '../components/edicao/AbaInscricoes';
import { AbaConvidados } from '../components/edicao/AbaConvidados';
import { AbaExpositores } from '../components/edicao/AbaExpositores';
import { AbaFotos } from '../components/edicao/AbaFotos';
import { AbaPublicacao } from '../components/edicao/AbaPublicacao';
import '../style/AdminEdicao.css';

const COMPONENTES = {
  dados: AbaDados,
  vitrine: AbaVitrine,
  ingressos: AbaIngressos,
  programacao: AbaProgramacao,
  competicoes: AbaCompeticoes,
  inscricoes: AbaInscricoes,
  convidados: AbaConvidados,
  expositores: AbaExpositores,
  fotos: AbaFotos,
  publicacao: AbaPublicacao
};

const RESUMO_VAZIO = { lotes: 0, programacao: 0, competicoes: 0, convidados: 0, fotos: 0 };

// Painel de uma edição: uma página com abas, uma por assunto. Serve para
// criar (modo guiado, logo após o formulário de criação) e para editar depois.
// Cada aba salva sozinha; este componente só cuida da moldura, do carregamento
// e de não deixar o admin perder alterações sem querer.
// Buscar o resumo não depende do estado da tela: função pura, reaproveitada
// pela carga inicial e por quem pede para recarregar. null se falhar (o resumo
// só alimenta contadores e o checklist).
async function buscarResumo(id) {
  try {
    const [l, p, c, cv, f] = await Promise.all([
      api.get(`/geektopia/admin/${id}/lotes`),
      api.get(`/geektopia/admin/${id}/programacao`),
      api.get(`/geektopia/admin/${id}/competicoes`),
      api.get(`/geektopia/admin/${id}/convidados`),
      api.get(`/geektopia/admin/${id}/fotos`)
    ]);
    return { lotes: l.data.length, programacao: p.data.length, competicoes: c.data.length, convidados: cv.data.length, fotos: f.data.length };
  } catch {
    return null;
  }
}

// A `key` faz o painel recomeçar do zero ao trocar de edição, sem precisar
// "limpar" estado dentro de um efeito.
export function AdminEdicao() {
  const { id } = useParams();
  return <PainelDaEdicao key={id} />;
}

function PainelDaEdicao() {
  const { id, aba: abaUrl } = useParams();
  const [busca] = useSearchParams();
  const navigate = useNavigate();
  const guiado = busca.get('guiado') === '1';

  const [evento, setEvento] = useState(null);
  const [resumo, setResumo] = useState(RESUMO_VAZIO);
  const [erro, setErro] = useState('');
  const [sujo, setSujo] = useState(false);
  const [destinoPendente, setDestinoPendente] = useState(null);

  const carregarEvento = useCallback(async () => {
    const res = await api.get(`/geektopia/admin/${id}`);
    setEvento(res.data);
  }, [id]);

  const carregarResumo = useCallback(async () => {
    const resumoNovo = await buscarResumo(id);
    if (resumoNovo) setResumo(resumoNovo);
  }, [id]);

  useEffect(() => {
    let ativo = true;

    Promise.all([api.get(`/geektopia/admin/${id}`), buscarResumo(id)])
      .then(([res, resumoInicial]) => {
        if (!ativo) return;
        setEvento(res.data);
        if (resumoInicial) setResumo(resumoInicial);
      })
      .catch((err) => {
        if (ativo) setErro(err.response?.status === 404 ? 'Edição não encontrada.' : 'Não foi possível carregar a edição.');
      });

    return () => { ativo = false; };
  }, [id]);

  // Fechar a aba do navegador com alterações não salvas.
  useEffect(() => {
    if (!sujo) return undefined;
    const avisar = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', avisar);
    return () => window.removeEventListener('beforeunload', avisar);
  }, [sujo]);

  const tipo = evento?.tipo_edicao;
  const abasVisiveis = tipo ? ABAS_POR_TIPO[tipo] || ABAS_POR_TIPO.Pocket : [];
  const aba = abaUrl === 'lotes' ? 'ingressos' : abaUrl || 'dados'; // 'lotes' era o nome antigo da rota

  const passos = tipo ? PASSOS_GUIADOS[tipo === 'Pocket' ? 'Pocket' : 'Principal'].slice(1) : [];
  const indicePasso = passos.indexOf(aba);
  const noAssistente = guiado && indicePasso !== -1;

  const caminho = useCallback((destino, comGuia = guiado) => `/admin/eventos/${id}/${destino}${comGuia ? '?guiado=1' : ''}`, [id, guiado]);

  // Toda navegação interna passa por aqui: com alterações pendentes, pergunta antes.
  const irPara = (destino) => {
    if (sujo) setDestinoPendente(destino);
    else navigate(destino);
  };

  const marcarAlterado = useCallback((valor) => setSujo(valor), []);

  const contexto = useMemo(() => ({
    evento, resumo, recarregarEvento: carregarEvento, recarregarResumo: carregarResumo, marcarAlterado
  }), [evento, resumo, carregarEvento, carregarResumo, marcarAlterado]);

  if (erro) {
    return (
      <div className="ed-pagina">
        <div className="ed-aviso is-erro" role="alert">{erro}</div>
        <Link to="/admin/eventos/lista" className="btn btn-secondary">← Voltar para as edições</Link>
      </div>
    );
  }

  if (!evento) {
    return <div className="ed-pagina"><p className="ed-vazio">Carregando edição...</p></div>;
  }

  // Aba que este tipo de edição não tem (ex.: /programacao numa Pocket).
  if (!abasVisiveis.includes(aba)) {
    return <Navigate to={`/admin/eventos/${id}/dados`} replace />;
  }

  const AbaAtual = COMPONENTES[aba];
  const publico = evento.status_evento !== 'Bloqueado';

  return (
    <div className="ed-pagina">
      <button type="button" className="btn btn-secondary ed-voltar" onClick={() => irPara('/admin/eventos/lista')}>
        ← Todas as edições
      </button>

      <header className="ed-cabecalho">
        <div className="ed-selos">
          <span className={`ed-selo ${tipo === 'Principal' ? 'is-destaque' : ''}`}>
            {tipo === 'Principal' ? '★ ' : ''}{ROTULO_TIPO[tipo]}
          </span>
          <span className={`ed-selo is-status-${evento.status_evento}`}>{ROTULO_STATUS[evento.status_evento]}</span>
        </div>
        <h1 className="ed-titulo-pagina">{evento.nome_edicao}</h1>
        {publico ? (
          <a className="ed-link-publico" href={`/geektopia/${evento.id_geektopia}`} target="_blank" rel="noreferrer">
            Ver página pública ↗
          </a>
        ) : (
          <p className="ed-subtitulo">Rascunho: ainda não aparece no site.</p>
        )}
      </header>

      <nav className="ed-abas" aria-label="Seções da edição">
        {abasVisiveis.map((chave) => {
          const { rotulo, Icone } = ABAS[chave];
          const ativa = chave === aba;
          const contagem = { ingressos: resumo.lotes, programacao: resumo.programacao, competicoes: resumo.competicoes, convidados: resumo.convidados, fotos: resumo.fotos }[chave];
          return (
            <Link
              key={chave} to={caminho(chave)}
              className={`ed-aba ${ativa ? 'is-ativa' : ''}`}
              aria-current={ativa ? 'page' : undefined}
              onClick={(e) => { if (sujo && !ativa) { e.preventDefault(); setDestinoPendente(caminho(chave)); } }}
            >
              <Icone aria-hidden="true" />
              <span>{rotulo}</span>
              {contagem > 0 && <span className="ed-aba-contagem" aria-label={`${contagem} itens`}>{contagem}</span>}
            </Link>
          );
        })}
      </nav>

      {noAssistente && (
        <div className="ed-guiado" role="region" aria-label="Assistente de criação">
          <strong>Passo {indicePasso + 2} de {passos.length + 1}</strong>
          <span>Tudo o que você preenche é salvo na hora. Pode pular o que não se aplica.</span>
          <button type="button" className="btn btn-secondary ed-btn-sm" onClick={() => irPara(`/admin/eventos/${id}/publicacao`)}>
            Sair do assistente
          </button>
        </div>
      )}

      <div className="ed-conteudo">
        <AbaAtual key={aba} {...contexto} />
      </div>

      {noAssistente && (
        <div className="ed-navegacao-guiada">
          <button
            type="button" className="btn btn-secondary"
            disabled={indicePasso === 0}
            onClick={() => irPara(caminho(passos[indicePasso - 1]))}
          >
            ← Anterior
          </button>
          {indicePasso < passos.length - 1 ? (
            <button type="button" className="btn btn-primary" onClick={() => irPara(caminho(passos[indicePasso + 1]))}>
              Próximo: {ABAS[passos[indicePasso + 1]].rotulo} →
            </button>
          ) : (
            <button type="button" className="btn btn-primary" onClick={() => irPara('/admin/eventos/lista')}>
              Concluir
            </button>
          )}
        </div>
      )}

      <ConfirmModal
        isOpen={destinoPendente !== null}
        title="Alterações não salvas"
        message="Você tem alterações que ainda não foram salvas nesta seção. Se sair agora, elas serão perdidas."
        confirmLabel="Descartar e sair"
        cancelLabel="Continuar editando"
        variant="danger"
        onConfirm={() => { const destino = destinoPendente; setDestinoPendente(null); setSujo(false); navigate(destino); }}
        onCancel={() => setDestinoPendente(null)}
      />
    </div>
  );
}
