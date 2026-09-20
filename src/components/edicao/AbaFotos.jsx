import { useCallback, useId, useState } from 'react';
import { FiArrowDown, FiArrowUp } from 'react-icons/fi';
import api from '../../services/api';
import { ConfirmModal } from '../ConfirmModal';
import { useAviso, mensagemDeErro } from '../../hooks/useAviso';
import { avisoDaTela, useCarga } from '../../hooks/useCarga';
import { AvisoBox } from './AvisoBox';
import { mover } from '../../utils/ordem';

const TIPOS = ['image/jpeg', 'image/png', 'image/webp'];
const TAMANHO_MAXIMO = 4 * 1024 * 1024;
const MAX_FOTOS = 40; // mesmo teto do backend

export function AbaFotos({ evento, recarregarResumo }) {
  const id = evento.id_geektopia;
  const inputId = useId();
  const { aviso, mostrar, limpar } = useAviso();
  const [progresso, setProgresso] = useState(null); // { atual, total } enquanto envia
  const [excluir, setExcluir] = useState(null);

  const buscar = useCallback(() => api.get(`/geektopia/admin/${id}/fotos`).then((r) => r.data), [id]);
  const { dados, erro: erroCarga, carregando, recarregar: carregar, definir: setFotos } = useCarga(buscar);
  const fotos = dados ?? [];

  // Envia as imagens uma por vez: a ordem de chegada vira a ordem na galeria e
  // uma falha no meio não perde as que já subiram.
  const enviar = async (e) => {
    const arquivos = [...(e.target.files || [])];
    e.target.value = '';
    if (arquivos.length === 0) return;
    limpar();

    const problemas = [];
    const validos = arquivos.filter((f) => {
      if (!TIPOS.includes(f.type)) { problemas.push(`"${f.name}": formato não aceito.`); return false; }
      if (f.size > TAMANHO_MAXIMO) { problemas.push(`"${f.name}": passa de 4MB.`); return false; }
      return true;
    });

    const espaco = MAX_FOTOS - fotos.length;
    const aEnviar = validos.slice(0, Math.max(espaco, 0));
    if (validos.length > aEnviar.length) {
      problemas.push(`Limite de ${MAX_FOTOS} fotos: ${validos.length - aEnviar.length} arquivo(s) ficaram de fora.`);
    }

    let enviadas = 0;
    for (let i = 0; i < aEnviar.length; i += 1) {
      setProgresso({ atual: i + 1, total: aEnviar.length });
      const dados = new FormData();
      dados.append('id_geektopia', id);
      dados.append('foto', aEnviar[i]);
      try {
        await api.post('/fotos-edicao', dados);
        enviadas += 1;
      } catch (err) {
        problemas.push(`"${aEnviar[i].name}": ${mensagemDeErro(err, 'falha no envio.')}`);
      }
    }

    setProgresso(null);
    carregar();
    recarregarResumo();

    if (problemas.length) {
      mostrar('erro', `${enviadas ? `${enviadas} foto(s) enviada(s). ` : ''}Não foi possível enviar:\n${problemas.join('\n')}`);
    } else if (enviadas) {
      mostrar('sucesso', `${enviadas} foto(s) adicionada(s).`);
    }
  };

  const salvarLegenda = async (foto, legenda) => {
    if ((foto.legenda || '') === legenda.trim()) return;
    try {
      await api.put(`/fotos-edicao/${foto.id_foto}`, { legenda: legenda.trim() });
      setFotos((lista) => (lista || []).map((f) => (f.id_foto === foto.id_foto ? { ...f, legenda: legenda.trim() || null } : f)));
    } catch (err) {
      mostrar('erro', mensagemDeErro(err, 'Não foi possível salvar a legenda.'));
    }
  };

  const reordenar = async (indice, delta) => {
    const anterior = fotos;
    const nova = mover(fotos, indice, delta);
    if (nova === fotos) return;

    setFotos(nova);
    try {
      await api.patch('/fotos-edicao/reordenar', { id_geektopia: id, ids: nova.map((f) => f.id_foto) });
    } catch (err) {
      setFotos(anterior);
      mostrar('erro', mensagemDeErro(err, 'Não foi possível salvar a nova ordem.'));
    }
  };

  const confirmarExclusao = async () => {
    const alvo = excluir;
    setExcluir(null);
    try {
      await api.delete(`/fotos-edicao/${alvo.id_foto}`);
      mostrar('sucesso', 'Foto removida.');
      carregar();
      recarregarResumo();
    } catch (err) {
      mostrar('erro', mensagemDeErro(err, 'Não foi possível remover a foto.'));
    }
  };

  return (
    <section className="ed-painel" aria-labelledby="t-fotos">
      <h2 id="t-fotos" className="ed-titulo">Fotos da edição</h2>
      <p className="ed-ajuda-topo">Galeria em carrossel na página do evento. Serve tanto para divulgar quanto para guardar a memória de edições passadas. Você pode escolher várias imagens de uma vez.</p>
      <AvisoBox aviso={avisoDaTela(aviso, erroCarga)} />

      <div className="ed-upload-multi">
        <input id={inputId} type="file" multiple accept={TIPOS.join(',')} className="ed-sr-only" onChange={enviar} disabled={progresso !== null} />
        <label htmlFor={inputId} className={`btn btn-primary ${progresso ? 'is-desabilitado' : ''}`}>
          {progresso ? `Enviando ${progresso.atual} de ${progresso.total}...` : '+ Adicionar fotos'}
        </label>
        <small className="ed-ajuda">JPEG, PNG ou WEBP, até 4MB cada · {fotos.length}/{MAX_FOTOS} fotos</small>
      </div>

      {carregando ? (
        <p className="ed-vazio">Carregando fotos...</p>
      ) : fotos.length === 0 ? (
        <div className="ed-vazio">
          <strong>Nenhuma foto ainda.</strong>
          <span>Sem fotos, o carrossel não aparece no site.</span>
        </div>
      ) : (
        <ul className="ed-grade-fotos">
          {fotos.map((f, i) => (
            <li className="ed-foto" key={f.id_foto}>
              <img src={f.url_foto} alt={f.legenda || `Foto ${i + 1} da edição`} loading="lazy" />
              <label className="ed-sr-only" htmlFor={`leg-${f.id_foto}`}>Legenda da foto {i + 1}</label>
              <input
                id={`leg-${f.id_foto}`} className="ed-foto-legenda" maxLength={200} placeholder="Legenda (opcional)"
                defaultValue={f.legenda || ''} onBlur={(e) => salvarLegenda(f, e.target.value)}
              />
              <div className="ed-foto-acoes">
                <button type="button" className="ed-icone-btn" aria-label={`Mover foto ${i + 1} para antes`} disabled={i === 0} onClick={() => reordenar(i, -1)}><FiArrowUp /></button>
                <button type="button" className="ed-icone-btn" aria-label={`Mover foto ${i + 1} para depois`} disabled={i === fotos.length - 1} onClick={() => reordenar(i, 1)}><FiArrowDown /></button>
                <button type="button" className="btn btn-danger ed-btn-sm" onClick={() => setExcluir(f)}>Remover</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmModal
        isOpen={excluir !== null}
        title="Remover foto"
        message="Remover esta foto da galeria? O arquivo será apagado."
        confirmLabel="Remover"
        variant="danger"
        onConfirm={confirmarExclusao}
        onCancel={() => setExcluir(null)}
      />
    </section>
  );
}
