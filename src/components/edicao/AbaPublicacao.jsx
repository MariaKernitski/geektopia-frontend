import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiAlertCircle, FiCheckCircle, FiCircle } from 'react-icons/fi';
import api from '../../services/api';
import { ConfirmModal } from '../ConfirmModal';
import { useAviso, mensagemDeErro } from '../../hooks/useAviso';
import { AvisoBox } from './AvisoBox';
import { ROTULO_STATUS } from './abas';

// O que cada estado significa para o público — dito em linguagem de quem
// administra, não de quem programa.
const SIGNIFICADO = {
  Bloqueado: 'Rascunho: invisível no site. Só a diretoria enxerga.',
  VendasAbertas: 'Publicada e vendendo: aparece no site e os visitantes podem comprar ingressos.',
  VendasEncerradas: 'Publicada sem vendas: aparece no site, mas ninguém consegue comprar.',
  Encerrado: 'Evento encerrado: continua no site como registro, sem vendas.'
};

// Transições disponíveis em cada estado.
const TRANSICOES = {
  Bloqueado: [
    { para: 'VendasAbertas', rotulo: 'Abrir vendas', variante: 'btn-primary', exigeLote: true },
    { para: 'VendasEncerradas', rotulo: 'Publicar sem abrir vendas', variante: 'btn-secondary' }
  ],
  VendasAbertas: [
    { para: 'VendasEncerradas', rotulo: 'Encerrar vendas', variante: 'btn-primary' },
    { para: 'Bloqueado', rotulo: 'Voltar para rascunho', variante: 'btn-secondary', confirmar: 'A edição some do site e as vendas param. Ingressos já vendidos continuam válidos.' }
  ],
  VendasEncerradas: [
    { para: 'VendasAbertas', rotulo: 'Reabrir vendas', variante: 'btn-primary', exigeLote: true },
    { para: 'Encerrado', rotulo: 'Marcar como encerrado', variante: 'btn-secondary' },
    { para: 'Bloqueado', rotulo: 'Voltar para rascunho', variante: 'btn-secondary', confirmar: 'A edição some do site.' }
  ],
  Encerrado: [
    { para: 'VendasAbertas', rotulo: 'Reabrir vendas', variante: 'btn-secondary', exigeLote: true, confirmar: 'O evento voltará a vender ingressos.' },
    { para: 'Bloqueado', rotulo: 'Voltar para rascunho', variante: 'btn-secondary', confirmar: 'A edição some do site.' }
  ]
};

function Item({ ok, aviso, children }) {
  const Icone = ok ? FiCheckCircle : aviso ? FiAlertCircle : FiCircle;
  return (
    <li className={`ed-check-item ${ok ? 'is-ok' : aviso ? 'is-aviso' : ''}`}>
      <Icone aria-hidden="true" />
      <span>{children}<span className="ed-sr-only">{ok ? ' (feito)' : ' (pendente)'}</span></span>
    </li>
  );
}

export function AbaPublicacao({ evento, resumo, recarregarEvento }) {
  const navigate = useNavigate();
  const { aviso, mostrar, limpar } = useAviso();
  const [confirmar, setConfirmar] = useState(null); // transição aguardando confirmação
  const [promover, setPromover] = useState(false);
  const [excluir, setExcluir] = useState(false);
  const [trabalhando, setTrabalhando] = useState(false);
  const [principalAtual, setPrincipalAtual] = useState(null);

  const ehPrincipalLike = evento.tipo_edicao !== 'Pocket';
  const temLote = resumo.lotes > 0;

  useEffect(() => {
    if (evento.tipo_edicao === 'Principal') return;
    api.get('/geektopia/admin/todas')
      .then((res) => setPrincipalAtual(res.data.find((e) => e.tipo_edicao === 'Principal') || null))
      .catch(() => {});
  }, [evento.tipo_edicao]);

  const executarTransicao = async (t) => {
    limpar();
    setTrabalhando(true);
    try {
      const res = await api.patch(`/geektopia/${evento.id_geektopia}/status`, { status_evento: t.para });
      await recarregarEvento();
      mostrar('sucesso', res.data.message || 'Status atualizado.');
    } catch (err) {
      mostrar('erro', mensagemDeErro(err, 'Não foi possível alterar o status.'));
    } finally {
      setTrabalhando(false);
    }
  };

  const tornarPrincipal = async () => {
    setPromover(false);
    limpar();
    setTrabalhando(true);
    try {
      const res = await api.patch(`/geektopia/${evento.id_geektopia}/tornar-principal`);
      await recarregarEvento();
      mostrar('sucesso', res.data.message);
    } catch (err) {
      mostrar('erro', mensagemDeErro(err, 'Não foi possível definir a edição principal.'));
    } finally {
      setTrabalhando(false);
    }
  };

  const excluirEdicao = async () => {
    setExcluir(false);
    limpar();
    setTrabalhando(true);
    try {
      await api.delete(`/geektopia/${evento.id_geektopia}`);
      navigate('/admin/eventos/lista', { replace: true });
    } catch (err) {
      mostrar('erro', mensagemDeErro(err, 'Não foi possível excluir a edição.'));
      setTrabalhando(false);
    }
  };

  const temDatas = Boolean(evento.data_inicio && evento.data_fim);

  return (
    <section className="ed-painel" aria-labelledby="t-pub">
      <h2 id="t-pub" className="ed-titulo">Publicação</h2>
      <AvisoBox aviso={aviso} />

      <div className="ed-bloco">
        <h3 className="ed-subtitulo-secao">Situação atual</h3>
        <p className="ed-status-atual">
          <span className={`ed-badge ed-badge-grande is-status-${evento.status_evento}`}>{ROTULO_STATUS[evento.status_evento]}</span>
          <span>{SIGNIFICADO[evento.status_evento]}</span>
        </p>

        <div className="ed-acoes ed-acoes-esquerda ed-acoes-quebra">
          {TRANSICOES[evento.status_evento].map((t) => {
            const bloqueado = t.exigeLote && !temLote;
            return (
              <button
                key={t.para} type="button" className={`btn ${t.variante}`}
                disabled={trabalhando || bloqueado}
                aria-describedby={bloqueado ? 'motivo-lote' : undefined}
                onClick={() => (t.confirmar ? setConfirmar(t) : executarTransicao(t))}
              >
                {t.rotulo}
              </button>
            );
          })}
        </div>
        {!temLote && TRANSICOES[evento.status_evento].some((t) => t.exigeLote) && (
          <p className="ed-alerta" id="motivo-lote" role="status">Para abrir as vendas, cadastre ao menos um lote na aba Ingressos.</p>
        )}
      </div>

      <div className="ed-bloco">
        <h3 className="ed-subtitulo-secao">Antes de publicar</h3>
        <ul className="ed-checklist">
          <Item ok={temLote}>Pelo menos um lote de ingressos <strong>(necessário para vender)</strong></Item>
          <Item ok={temDatas} aviso>Data e horário do evento</Item>
          <Item ok={Boolean(evento.local)} aviso>Local</Item>
          <Item ok={Boolean(evento.banner_url)} aviso>Foto de capa</Item>
          <Item ok={Boolean(evento.descricao)} aviso>Descrição</Item>
          {ehPrincipalLike && (
            <>
              <Item ok={Boolean(evento.tagline || evento.texto_sobre)} aviso>Frase de destaque ou texto “sobre” (aba Vitrine)</Item>
              <Item ok={resumo.programacao > 0} aviso>Programação ({resumo.programacao} atividade(s))</Item>
              <Item ok={resumo.convidados > 0} aviso>Convidados ({resumo.convidados})</Item>
              <Item ok={resumo.fotos > 0} aviso>Fotos ({resumo.fotos})</Item>
            </>
          )}
        </ul>
        <p className="ed-ajuda">Só o lote é obrigatório. Os demais itens são recomendações: você pode publicar sem eles e completar depois.</p>
      </div>

      <div className="ed-bloco">
        <h3 className="ed-subtitulo-secao">Tipo da edição</h3>
        {evento.tipo_edicao === 'Principal' && (
          <p>Esta é a <strong>Geektopia Principal</strong> vigente, o evento anual em destaque no site. Ao criar ou promover outra edição como Principal, esta vira a Principal anterior.</p>
        )}
        {evento.tipo_edicao === 'PrincipalAnterior' && <p>Esta é uma <strong>Principal anterior</strong> (edição passada). Continua editável.</p>}
        {evento.tipo_edicao === 'Pocket' && <p>Esta é uma edição <strong>Pocket</strong> (menor, ao longo do ano).</p>}
        {evento.tipo_edicao !== 'Principal' && (
          <button type="button" className="btn btn-secondary" disabled={trabalhando} onClick={() => setPromover(true)}>
            Tornar esta a Geektopia Principal
          </button>
        )}
      </div>

      <div className="ed-bloco ed-bloco-perigo">
        <h3 className="ed-subtitulo-secao">Zona de risco</h3>
        <p>Excluir só é possível para edições sem nenhum vínculo (ingressos, lotes, competições, programação...). Se houver, prefira <strong>Encerrar</strong> a edição.</p>
        <button type="button" className="btn btn-danger" disabled={trabalhando} onClick={() => setExcluir(true)}>Excluir esta edição</button>
      </div>

      <ConfirmModal
        isOpen={confirmar !== null}
        title={confirmar?.rotulo || ''}
        message={confirmar?.confirmar || ''}
        confirmLabel={confirmar?.rotulo || 'Confirmar'}
        onConfirm={() => { const t = confirmar; setConfirmar(null); executarTransicao(t); }}
        onCancel={() => setConfirmar(null)}
      />
      <ConfirmModal
        isOpen={promover}
        title="Tornar Geektopia Principal"
        message={principalAtual
          ? `"${principalAtual.nome_edicao}" vai virar a Principal anterior (edição passada) e "${evento.nome_edicao}" passa a ser a Principal. Você poderá continuar editando as duas.`
          : `"${evento.nome_edicao}" passará a ser a Geektopia Principal.`}
        confirmLabel="Tornar Principal"
        onConfirm={tornarPrincipal}
        onCancel={() => setPromover(false)}
      />
      <ConfirmModal
        isOpen={excluir}
        title="Excluir edição"
        message={`Excluir "${evento.nome_edicao}" definitivamente? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        variant="danger"
        onConfirm={excluirEdicao}
        onCancel={() => setExcluir(false)}
      />
    </section>
  );
}
