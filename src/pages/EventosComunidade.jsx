import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FiCalendar, FiExternalLink, FiMapPin } from 'react-icons/fi';
import api from '../services/api';
import { useCarga } from '../hooks/useCarga';
import { Rodape } from '../components/Rodape';
import { formatarData } from '../utils/datas';
import '../style/Publico.css';
import '../style/EventosComunidade.css';

// Página pública: eventos de outros grupos e organizadores que a CCPOP aprovou e decidiu divulgar.
export function EventosComunidade() {
  const buscar = useCallback(() => api.get('/eventos-comunidade').then((r) => r.data), []);
  const { dados, carregando, erro, recarregar } = useCarga(buscar);
  const eventos = dados ?? [];

  return (
    <>
      <main className="pb-pagina ec-pagina">
        <header className="pb-cabecalho">
          <h1 className="pb-titulo">Eventos da comunidade</h1>
          <p className="pb-lead">Eventos geek, culturais e de jogos organizados por grupos parceiros, divulgados pela CCPOP. A venda e as regras de cada evento são de responsabilidade de quem organiza.</p>
        </header>

        {carregando ? <p className="pb-carregando" aria-busy="true">Carregando eventos...</p>
          : erro ? <div role="alert"><p>{erro}</p><button type="button" className="btn btn-primary" onClick={recarregar}>Tentar de novo</button></div>
          : eventos.length === 0 ? (
            <div className="pb-vazio">
              <p>Nenhum evento da comunidade por aqui ainda. Volte em breve!</p>
            </div>
          ) : (
            <ul className="ec-grade">
              {eventos.map((e) => (
                <li key={e.id_evento_externo} className="ec-cartao">
                  <span className="ec-data"><FiCalendar aria-hidden="true" /> {formatarData(e.data_evento)}{e.data_fim && e.data_fim.slice(0, 10) !== e.data_evento.slice(0, 10) ? ` a ${formatarData(e.data_fim)}` : ''}</span>
                  <h2>{e.nome_evento}</h2>
                  <p className="ec-local"><FiMapPin aria-hidden="true" /> {e.local}</p>
                  <p className="ec-desc">{e.descricao}</p>
                  {e.regras_idade_minima && <p className="ec-regras"><strong>Idade:</strong> {e.regras_idade_minima}</p>}
                  <p className="ec-org">Organização: {e.organizador?.instituicao_empresa || e.organizador?.usuario?.nome_completo}</p>
                  {e.url_saiba_mais && <a className="btn btn-secondary" href={e.url_saiba_mais} target="_blank" rel="noopener noreferrer">Saiba mais <FiExternalLink aria-hidden="true" /></a>}
                </li>
              ))}
            </ul>
          )}

        <aside className="ec-convite">
          <h2>Organiza um evento?</h2>
          <p>Envie para a CCPOP divulgar. Nossa equipe analisa e, se aprovar, publica aqui. É gratuito.</p>
          <Link to="/perfil?secao=comunidade" className="btn btn-primary">Enviar meu evento</Link>
        </aside>
      </main>
      <Rodape />
    </>
  );
}
