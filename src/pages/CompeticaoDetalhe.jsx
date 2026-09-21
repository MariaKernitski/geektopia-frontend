import { useCallback, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { AvisoBox } from '../components/edicao/AvisoBox';
import { avisoDaTela, useCarga } from '../hooks/useCarga';
import { useAviso, mensagemDeErro } from '../hooks/useAviso';
import { ROTULO_MODALIDADE, situacaoDaInscricao } from '../utils/competicao';
import { moeda } from '../utils/evento';
import '../style/AdminEdicao.css';
import '../style/Parceiro.css';

const ehUrl = (v) => /^https?:\/\//i.test(v.trim());

// Página pública de uma competição: o que é, como funciona e a inscrição.
// Visitante é convidado a entrar/cadastrar (e volta para cá depois); cliente
// preenche o formulário, que vai para a análise da organização.
export function CompeticaoDetalhe() {
  const { id } = useParams();
  const buscar = useCallback(() => api.get(`/competicoes/${id}`).then((r) => r.data), [id]);
  const { dados: c, erro, carregando } = useCarga(buscar);

  const token = localStorage.getItem('@Geektopia:token');
  let usuario = null;
  try { usuario = JSON.parse(localStorage.getItem('@Geektopia:user') || 'null'); } catch { /* ignora */ }

  if (carregando) return <div className="ed-pagina ed-pagina-estreita"><p className="ed-vazio">Carregando...</p></div>;
  if (erro || !c) {
    return (
      <div className="ed-pagina ed-pagina-estreita">
        <div className="ed-vazio" role="alert">
          <strong>Não encontramos esta competição.</strong>
          <Link to="/geektopia" className="btn btn-secondary" style={{ alignSelf: 'center', marginTop: 8 }}>← Voltar para a Geektopia</Link>
        </div>
      </div>
    );
  }

  const taxa = Number(c.valor_taxa_inscricao) || 0;
  const encerrada = c.geektopia?.status_evento === 'Encerrado';
  const destinoBase = `/competicoes/${c.id_competicao}`;

  let bloco;
  if (encerrada) {
    bloco = <div className="pt-destaque"><strong>Inscrições encerradas.</strong><p style={{ margin: '6px 0 0' }}>Esta edição da Geektopia já aconteceu.</p></div>;
  } else if (!token) {
    bloco = (
      <div className="pt-destaque">
        <strong>Para se inscrever, você precisa de uma conta.</strong>
        <p style={{ margin: '6px 0 0' }}>Entre ou cadastre-se em poucos minutos — depois você volta direto para esta página para preencher a inscrição.</p>
        <div className="ed-acoes ed-acoes-esquerda">
          <Link to="/login" state={{ from: destinoBase }} className="btn btn-primary">Entrar</Link>
          <Link to="/cadastro" state={{ from: destinoBase }} className="btn btn-secondary">Criar conta</Link>
        </div>
      </div>
    );
  } else if (usuario?.administrador) {
    bloco = (
      <div className="pt-destaque">
        <strong>Você está como administrador.</strong>
        <p style={{ margin: '6px 0 0' }}>As inscrições são analisadas no painel, na edição desta competição.</p>
        <div className="ed-acoes ed-acoes-esquerda">
          <Link to={`/admin/eventos/${c.geektopia.id_geektopia}/inscricoes`} className="btn btn-primary">Abrir inscrições no painel</Link>
        </div>
      </div>
    );
  } else {
    bloco = <FormularioInscricao competicao={c} taxa={taxa} />;
  }

  return (
    <div className="ed-pagina ed-pagina-estreita">
      <Link to={`/geektopia/${c.geektopia.id_geektopia}`} className="btn btn-secondary ed-voltar">← {c.geektopia.nome_edicao}</Link>

      <h1 className="ed-titulo-pagina" style={{ marginBottom: 8 }}>{c.nome_competicao}</h1>
      <div className="pb-chips" style={{ marginBottom: 16 }}>
        {c.modalidade && <span className="pb-chip">{ROTULO_MODALIDADE[c.modalidade]}</span>}
        <span className={`pb-chip ${taxa ? '' : 'is-ok'}`}>{taxa ? `Inscrição ${moeda(taxa)}` : 'Inscrição gratuita'}</span>
      </div>

      <div className="ed-painel">
        {c.descricao ? <p style={{ whiteSpace: 'pre-line', lineHeight: 1.6, margin: 0 }}>{c.descricao}</p> : <p className="ed-ajuda-topo" style={{ margin: 0 }}>A organização ainda não publicou a descrição desta competição.</p>}
        {c.regras_url && <p style={{ marginBottom: 0 }}><a href={c.regras_url} target="_blank" rel="noopener noreferrer">Ler o regulamento completo (abre em nova aba)</a></p>}
      </div>

      <h2 className="ed-subtitulo-secao">Inscrição</h2>
      {bloco}
    </div>
  );
}

function FormularioInscricao({ competicao, taxa }) {
  const buscar = useCallback(async () => {
    const [perfil, minhas] = await Promise.all([api.get('/parceiros/meu-perfil'), api.get('/inscricoes/minhas')]);
    return { competidor: perfil.data.papeis?.competidor || null, minhas: minhas.data };
  }, []);
  const { dados, erro, carregando } = useCarga(buscar);

  if (carregando) return <p className="ed-vazio">Carregando...</p>;
  if (erro) return <AvisoBox aviso={{ tipo: 'erro', texto: erro }} />;

  const existente = dados.minhas.find((i) => i.id_competicao === competicao.id_competicao && i.status_inscricao !== 'Reprovado');
  if (existente) {
    const sit = situacaoDaInscricao(existente);
    return (
      <div className={`pt-destaque ${sit.tipo === 'ok' ? 'is-ok' : ''}`}>
        <strong>Você já se inscreveu: {sit.rotulo}.</strong>
        <p style={{ margin: '6px 0 0' }}>{sit.passo}</p>
        <div className="ed-acoes ed-acoes-esquerda"><Link to="/competidor" className="btn btn-primary">Acompanhar minhas inscrições</Link></div>
      </div>
    );
  }
  return <Formulario competicao={competicao} taxa={taxa} competidor={dados.competidor} reprovada={dados.minhas.some((i) => i.id_competicao === competicao.id_competicao)} />;
}

function Formulario({ competicao, taxa, competidor, reprovada }) {
  const navigate = useNavigate();
  const { aviso, mostrar, limpar } = useAviso();
  const modalidade = competicao.modalidade;
  const [form, setForm] = useState({
    nickname: competidor?.nickname_competidor || '',
    nome_equipe: '', integrantes: '', link_equipe: '', portfolio: '', audio: '', aceite: false
  });
  const [erros, setErros] = useState({});
  const [enviando, setEnviando] = useState(false);

  const alterar = (e) => {
    const { name, type, checked, value } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
    setErros((er) => ({ ...er, [name]: undefined }));
  };

  const enviar = async (e) => {
    e.preventDefault();
    limpar();
    const n = {};
    if (!competidor && !form.nickname.trim()) n.nickname = 'Informe o nome (nickname) com que você vai competir.';
    if (modalidade !== 'Solo') {
      if (!form.nome_equipe.trim()) n.nome_equipe = 'Dê um nome para a sua equipe.';
      const qtd = form.integrantes.split('\n').map((x) => x.trim()).filter(Boolean).length;
      if (modalidade === 'Dupla' && qtd !== 1) n.integrantes = 'Uma dupla tem 2 pessoas: informe só o nome do seu parceiro(a).';
      if (modalidade === 'Grupo' && (qtd < 2 || qtd > 9)) n.integrantes = 'Informe de 2 a 9 integrantes além de você, um por linha.';
      if (form.link_equipe.trim() && !ehUrl(form.link_equipe)) n.link_equipe = 'O link deve começar com http:// ou https://.';
    }
    if (form.portfolio.trim() && !ehUrl(form.portfolio)) n.portfolio = 'O link deve começar com http:// ou https://.';
    if (form.audio.trim() && !ehUrl(form.audio)) n.audio = 'O link deve começar com http:// ou https://.';
    if (!form.aceite) n.aceite = 'Confirme que leu as informações da competição.';
    setErros(n);
    if (Object.keys(n).length) { document.getElementById(`i-${Object.keys(n)[0]}`)?.focus(); return; }

    setEnviando(true);
    try {
      // Quem nunca competiu ganha o perfil de competidor aqui mesmo, sem etapa à parte.
      if (!competidor) await api.post('/parceiros/competidor', { nickname_competidor: form.nickname.trim() });

      const corpo = {
        id_competicao: competicao.id_competicao,
        url_portfolio_apresentacao: form.portfolio.trim() || undefined,
        link_audio_apresentacao: form.audio.trim() || undefined
      };
      if (modalidade !== 'Solo') {
        corpo.equipe = {
          nome_equipe: form.nome_equipe.trim(),
          integrantes: form.integrantes,
          link_portfolio_grupo: form.link_equipe.trim() || undefined
        };
      }
      const res = await api.post('/inscricoes', corpo);
      navigate('/competidor', { state: { sucesso: res.data.message } });
    } catch (err) {
      mostrar('erro', mensagemDeErro(err, 'Não foi possível enviar a inscrição. Tente de novo.'));
      setEnviando(false);
    }
  };

  const campoErro = (k) => erros[k] && <p className="ed-erro-campo" id={`erro-i-${k}`} role="alert">{erros[k]}</p>;
  const aria = (k) => (erros[k] ? { 'aria-invalid': true, 'aria-describedby': `erro-i-${k}` } : {});

  return (
    <div className="ed-painel">
      {reprovada && <p className="ed-ajuda-topo">Sua inscrição anterior nesta competição não foi aprovada. Você pode enviar uma nova.</p>}
      <p className="ed-ajuda-topo" style={{ marginTop: 0 }}>
        Sua inscrição vai para a análise da organização{taxa > 0 ? `; se for aprovada, você paga a taxa de ${moeda(taxa)} para garantir a vaga` : ' e é gratuita'}.
        Quem tem menos de 18 anos precisa do termo de autorização assinado por um responsável na entrada do evento.
      </p>
      <AvisoBox aviso={avisoDaTela(aviso, null)} />

      <form onSubmit={enviar} className="ed-form" noValidate>
        {!competidor && (
          <div className="ed-campo">
            <label htmlFor="i-nickname">Seu nome de competidor (nickname) *</label>
            <input id="i-nickname" name="nickname" value={form.nickname} onChange={alterar} maxLength={30} {...aria('nickname')} />
            {campoErro('nickname')}
            <small className="ed-ajuda">É como você aparece nas chaves e no placar. Fica salvo para as próximas competições.</small>
          </div>
        )}

        {modalidade !== 'Solo' && (
          <>
            <div className="ed-campo">
              <label htmlFor="i-nome_equipe">Nome da equipe *</label>
              <input id="i-nome_equipe" name="nome_equipe" value={form.nome_equipe} onChange={alterar} maxLength={100} {...aria('nome_equipe')} />
              {campoErro('nome_equipe')}
            </div>
            <div className="ed-campo">
              <label htmlFor="i-integrantes">{modalidade === 'Dupla' ? 'Nome do seu parceiro(a) *' : 'Nomes dos demais integrantes *'}</label>
              <textarea id="i-integrantes" name="integrantes" rows={modalidade === 'Dupla' ? 1 : 4} value={form.integrantes} onChange={alterar} {...aria('integrantes')} />
              {campoErro('integrantes')}
              <small className="ed-ajuda">{modalidade === 'Dupla' ? 'Você é o líder da dupla.' : 'Um nome por linha, de 2 a 9 pessoas. Você é o líder do grupo.'}</small>
            </div>
            <div className="ed-campo">
              <label htmlFor="i-link_equipe">Link do portfólio da equipe</label>
              <input id="i-link_equipe" name="link_equipe" type="url" value={form.link_equipe} onChange={alterar} placeholder="https://..." {...aria('link_equipe')} />
              {campoErro('link_equipe')}
            </div>
          </>
        )}

        <div className="ed-campo">
          <label htmlFor="i-portfolio">Link do seu material de apresentação</label>
          <input id="i-portfolio" name="portfolio" type="url" value={form.portfolio} onChange={alterar} placeholder="https://..." {...aria('portfolio')} />
          {campoErro('portfolio')}
          <small className="ed-ajuda">Portfólio, vídeo, fotos ou rede social. É o que a organização usa para avaliar a inscrição.</small>
        </div>

        <div className="ed-campo">
          <label htmlFor="i-audio">Link do áudio ou vídeo da apresentação</label>
          <input id="i-audio" name="audio" type="url" value={form.audio} onChange={alterar} placeholder="https://..." {...aria('audio')} />
          {campoErro('audio')}
          <small className="ed-ajuda">Só se a competição pedir (ex.: música de uma apresentação).</small>
        </div>

        <div className="ed-campo">
          <label className="ed-check">
            <input id="i-aceite" type="checkbox" name="aceite" checked={form.aceite} onChange={alterar} {...aria('aceite')} />
            Li a descrição e o regulamento da competição.
          </label>
          {campoErro('aceite')}
        </div>

        <div className="ed-acoes ed-acoes-esquerda">
          <button type="submit" className="btn btn-primary" disabled={enviando}>{enviando ? 'Enviando...' : 'Enviar inscrição'}</button>
        </div>
      </form>
    </div>
  );
}
