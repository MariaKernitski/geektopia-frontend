import { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AvisoBox } from '../components/edicao/AvisoBox';
import { avisoDaTela, useCarga } from '../hooks/useCarga';
import { useAviso, mensagemDeErro } from '../hooks/useAviso';
import { formatarData, formatarMoeda } from '../utils/datas';
import { calcularPrevia } from '../utils/solicitacao';
import '../style/AdminEdicao.css';
import '../style/Parceiro.css';

const MAX_EXTRA = 99;

function Quantidade({ nome, preco, valor, onChange }) {
  return (
    <div className="pt-quantidade">
      <div className="pt-quantidade-info">
        <span className="pt-quantidade-nome" id={`q-${nome}`}>{nome}</span>
        <span className="pt-quantidade-preco">{preco ? `${formatarMoeda(preco)} cada` : 'Sem custo adicional'}</span>
      </div>
      <div className="pt-stepper" role="group" aria-labelledby={`q-${nome}`}>
        <button type="button" aria-label={`Diminuir ${nome}`} disabled={valor === 0} onClick={() => onChange(valor - 1)}>−</button>
        <output aria-live="polite">{valor}</output>
        <button type="button" aria-label={`Aumentar ${nome}`} disabled={valor >= MAX_EXTRA} onClick={() => onChange(valor + 1)}>+</button>
      </div>
    </div>
  );
}

export function ExpositorSolicitar() {
  const navigate = useNavigate();
  const { aviso, mostrar, limpar } = useAviso();

  const buscar = useCallback(async () => {
    const [perfil, edicoes, espacos, minhas] = await Promise.all([
      api.get('/parceiros/meu-perfil'),
      api.get('/geektopia'),
      api.get('/espacos'),
      api.get('/solicitacoes-espaco/minhas')
    ]);
    return {
      temPerfil: Boolean(perfil.data.papeis?.expositor),
      // Edição encerrada não recebe candidatura (regra do servidor).
      edicoes: edicoes.data.filter((e) => e.status_evento !== 'Encerrado'),
      espacos: espacos.data,
      // Quem já tem candidatura aberta na edição não pode abrir outra.
      abertas: Object.fromEntries(
        minhas.data.filter((s) => s.status_solicitacao !== 'Reprovado').map((s) => [s.id_geektopia, s.id_solicitacao])
      )
    };
  }, []);
  const { dados, erro, carregando } = useCarga(buscar);

  const [idEdicao, setIdEdicao] = useState('');
  const [idEspaco, setIdEspaco] = useState('');
  const [extras, setExtras] = useState({ ajudantes: 0, mesas: 0, cadeiras: 0 });
  const [enviando, setEnviando] = useState(false);

  if (carregando) return <div className="ed-pagina"><p className="ed-vazio">Carregando...</p></div>;

  const { temPerfil, edicoes = [], espacos = [], abertas = {} } = dados || {};
  const espaco = espacos.find((e) => String(e.id_espaco) === idEspaco);
  const total = espaco ? calcularPrevia(espaco, extras) : 0;

  const enviar = async () => {
    limpar();
    if (!idEdicao || !idEspaco) {
      mostrar('erro', 'Escolha a edição e o espaço antes de enviar.');
      return;
    }
    setEnviando(true);
    try {
      const res = await api.post('/solicitacoes-espaco', {
        id_geektopia: Number(idEdicao),
        id_espaco: Number(idEspaco),
        qtd_ajudantes_extras: extras.ajudantes,
        qtd_mesas_extras: extras.mesas,
        qtd_cadeiras_extras: extras.cadeiras
      });
      navigate(`/expositor/solicitacoes/${res.data.solicitacao.id_solicitacao}`, { state: { sucesso: res.data.message } });
    } catch (err) {
      mostrar('erro', mensagemDeErro(err, 'Não foi possível enviar a solicitação.'));
      setEnviando(false);
    }
  };

  if (!temPerfil) {
    return (
      <div className="ed-pagina ed-pagina-estreita">
        <Link to="/expositor" className="btn btn-secondary ed-voltar">← Área do expositor</Link>
        <div className="pt-destaque">
          <strong>Antes de pedir um espaço, crie o seu perfil de expositor.</strong>
          <div className="ed-acoes ed-acoes-esquerda"><Link to="/expositor/perfil" className="btn btn-primary">Criar perfil</Link></div>
        </div>
      </div>
    );
  }

  return (
    <div className="ed-pagina">
      <Link to="/expositor" className="btn btn-secondary ed-voltar">← Área do expositor</Link>
      <h1 className="ed-titulo-pagina" style={{ marginBottom: 6 }}>Solicitar espaço</h1>
      <p className="ed-subtitulo" style={{ marginBottom: 20 }}>Escolha a edição e o espaço. A diretoria avalia o pedido e, se aprovar, você paga a taxa para confirmar a presença.</p>

      <AvisoBox aviso={avisoDaTela(aviso, erro)} />

      <div className="pt-grade">
        <div>
          <fieldset className="pt-secao pt-cartoes">
            <legend className="pt-secao-titulo"><span className="pt-numero">1</span> Em qual edição?</legend>
            {edicoes.length === 0 && <p className="ed-vazio" style={{ gridColumn: '1 / -1' }}>Nenhuma edição está recebendo candidaturas agora.</p>}
            {edicoes.map((ed) => {
              const jaTem = abertas[ed.id_geektopia];
              return (
                <label key={ed.id_geektopia} className={`pt-cartao ${jaTem ? 'is-bloqueado' : ''}`}>
                  <input type="radio" className="ed-sr-only" name="edicao" value={ed.id_geektopia} disabled={Boolean(jaTem)} checked={idEdicao === String(ed.id_geektopia)} onChange={(e) => setIdEdicao(e.target.value)} />
                  <span className="pt-cartao-titulo">{ed.nome_edicao}</span>
                  <span className="pt-cartao-texto">
                    {ed.data_inicio ? formatarData(ed.data_inicio) : 'Data a definir'}{ed.local ? ` · ${ed.local}` : ''}
                  </span>
                  {jaTem && <span className="pt-cartao-texto"><Link to={`/expositor/solicitacoes/${jaTem}`}>Você já tem uma candidatura aqui. Ver</Link></span>}
                </label>
              );
            })}
          </fieldset>

          <fieldset className="pt-secao pt-cartoes">
            <legend className="pt-secao-titulo"><span className="pt-numero">2</span> Qual espaço?</legend>
            {espacos.length === 0 && <p className="ed-vazio" style={{ gridColumn: '1 / -1' }}>Os espaços ainda não foram cadastrados pela organização. Volte em breve.</p>}
            {espacos.map((e) => (
              <label key={e.id_espaco} className="pt-cartao">
                <input type="radio" className="ed-sr-only" name="espaco" value={e.id_espaco} checked={idEspaco === String(e.id_espaco)} onChange={(ev) => setIdEspaco(ev.target.value)} />
                <span className="pt-cartao-titulo">{e.tipo_espaco}{e.area_m2 !== null && ` · ${e.area_m2} m²`}</span>
                <span className="pt-cartao-texto">
                  {[
                    e.qtd_mesas !== null && `${e.qtd_mesas} mesa(s)`,
                    e.quantidade_cadeiras !== null && `${e.quantidade_cadeiras} cadeira(s)`,
                    e.qtd_credenciais_inclusas !== null && `${e.qtd_credenciais_inclusas} credencial(is)`
                  ].filter(Boolean).join(' · ') || 'Sem itens listados'}
                </span>
                {e.descricao && <span className="pt-cartao-texto">{e.descricao}</span>}
                <span className="pt-cartao-preco">{formatarMoeda(e.valor_base)}</span>
              </label>
            ))}
          </fieldset>

          <section className="pt-secao" aria-labelledby="extras">
            <h2 className="pt-secao-titulo" id="extras"><span className="pt-numero">3</span> Precisa de algo a mais?</h2>
            {!espaco ? (
              <p className="ed-ajuda">Escolha um espaço para ver as opções extras.</p>
            ) : (
              <div className="ed-painel" style={{ padding: '4px 20px' }}>
                <Quantidade nome="Ajudantes extras" preco={espaco.valor_taxa_ajudante} valor={extras.ajudantes} onChange={(v) => setExtras({ ...extras, ajudantes: v })} />
                <Quantidade nome="Mesas extras" preco={espaco.valor_taxa_mesa_extra} valor={extras.mesas} onChange={(v) => setExtras({ ...extras, mesas: v })} />
                <Quantidade nome="Cadeiras extras" preco={espaco.valor_taxa_cadeira_extra} valor={extras.cadeiras} onChange={(v) => setExtras({ ...extras, cadeiras: v })} />
              </div>
            )}
          </section>
        </div>

        <aside className="pt-resumo" aria-label="Resumo do pedido">
          <h2>Resumo</h2>
          {!espaco ? (
            <p className="pt-resumo-vazio">Escolha um espaço para ver o valor.</p>
          ) : (
            <>
              <div className="pt-valor-linha"><span>{espaco.tipo_espaco}</span><span>{formatarMoeda(espaco.valor_base)}</span></div>
              {extras.ajudantes > 0 && <div className="pt-valor-linha"><span>{extras.ajudantes} ajudante(s)</span><span>{formatarMoeda(extras.ajudantes * (espaco.valor_taxa_ajudante || 0))}</span></div>}
              {extras.mesas > 0 && <div className="pt-valor-linha"><span>{extras.mesas} mesa(s) extra(s)</span><span>{formatarMoeda(extras.mesas * (espaco.valor_taxa_mesa_extra || 0))}</span></div>}
              {extras.cadeiras > 0 && <div className="pt-valor-linha"><span>{extras.cadeiras} cadeira(s) extra(s)</span><span>{formatarMoeda(extras.cadeiras * (espaco.valor_taxa_cadeira_extra || 0))}</span></div>}
              <div className="pt-valor-linha pt-valor-total"><span>Total</span><span>{formatarMoeda(total)}</span></div>
              <p className="ed-ajuda">Você só paga se a diretoria aprovar. O valor fica travado no momento do envio.</p>
            </>
          )}
          <button type="button" className="btn btn-primary" disabled={enviando || !idEdicao || !idEspaco} onClick={enviar}>
            {enviando ? 'Enviando...' : 'Enviar solicitação'}
          </button>
        </aside>
      </div>
    </div>
  );
}
