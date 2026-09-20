import { useState } from 'react';
import { ImagemUpload } from './ImagemUpload';
import { OPCOES_CLASSIFICACAO } from '../../utils/idade';
import { localParaIso, paraInputData, paraInputDataHora, paraInputHora } from '../../utils/datas';

// Formulário de dados básicos de uma edição. Usado na CRIAÇÃO (a página
// AdminCriarEvento) e na EDIÇÃO (aba "Dados" do painel), então a lógica de
// datas e as validações existem uma vez só.
//
// O pai decide o que fazer com o resultado: onSubmit recebe
//   { campos, foto }  onde campos já vem no formato da API
// e devolve uma Promise. O botão fica desabilitado enquanto ela roda.

const VAZIO = {
  nome_edicao: '', local: '', descricao: '', classificacao_etaria: '', regras_idade_minima: '', aviso_documentacao: '',
  data_evento: '', hora_inicio: '', hora_fim: '', inicio_multi: '', fim_multi: ''
};

// Converte a edição vinda da API para o estado do formulário.
function doEvento(evento) {
  if (!evento) return { form: VAZIO, diaUnico: true };

  const mesmoDia = evento.data_inicio && evento.data_fim
    && paraInputData(evento.data_inicio) === paraInputData(evento.data_fim);
  const semFim = evento.data_inicio && !evento.data_fim;
  const diaUnico = mesmoDia || semFim || !evento.data_inicio;

  return {
    diaUnico,
    form: {
      nome_edicao: evento.nome_edicao || '',
      local: evento.local || '',
      descricao: evento.descricao || '',
      classificacao_etaria: evento.classificacao_etaria === null || evento.classificacao_etaria === undefined ? '' : String(evento.classificacao_etaria),
      regras_idade_minima: evento.regras_idade_minima || '',
      aviso_documentacao: evento.aviso_documentacao || '',
      data_evento: paraInputData(evento.data_inicio),
      hora_inicio: paraInputHora(evento.data_inicio),
      hora_fim: paraInputHora(evento.data_fim),
      inicio_multi: paraInputDataHora(evento.data_inicio),
      fim_multi: paraInputDataHora(evento.data_fim)
    }
  };
}

// O estado nasce das props. Para reiniciar o formulário (ex.: depois de salvar),
// o pai troca a `key` do componente, em vez de sincronizar por efeito.
export function FormDados({ evento, rotuloEnvio, onSubmit, onAlterado, enviando }) {
  const [inicial] = useState(() => doEvento(evento));
  const [form, setForm] = useState(inicial.form);
  const [diaUnico, setDiaUnico] = useState(inicial.diaUnico);
  const [foto, setFoto] = useState(null);
  const [erros, setErros] = useState({});

  const alterar = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErros((er) => ({ ...er, [e.target.name]: undefined }));
    onAlterado?.(true);
  };

  const montarDatas = () => {
    if (diaUnico) {
      if (!form.data_evento) return { inicio: null, fim: null };
      return {
        inicio: localParaIso(`${form.data_evento}T${form.hora_inicio || '00:00'}`),
        fim: localParaIso(`${form.data_evento}T${form.hora_fim || '23:59'}`)
      };
    }
    return { inicio: localParaIso(form.inicio_multi), fim: localParaIso(form.fim_multi) };
  };

  const enviar = async (e) => {
    e.preventDefault();

    const novosErros = {};
    if (!form.nome_edicao.trim()) novosErros.nome_edicao = 'Informe o nome do evento.';

    const { inicio, fim } = montarDatas();
    if (inicio && fim && new Date(fim) <= new Date(inicio)) {
      novosErros[diaUnico ? 'hora_fim' : 'fim_multi'] = 'O término deve ser depois do início.';
    }
    if (!diaUnico && !inicio) novosErros.inicio_multi = 'Informe quando o evento começa.';
    if (!diaUnico && !fim) novosErros.fim_multi = 'Informe quando o evento termina.';

    setErros(novosErros);
    if (Object.keys(novosErros).length > 0) return;

    const campos = {
      nome_edicao: form.nome_edicao.trim(),
      local: form.local.trim(),
      descricao: form.descricao.trim(),
      classificacao_etaria: form.classificacao_etaria === '' ? null : Number(form.classificacao_etaria),
      regras_idade_minima: form.regras_idade_minima.trim(),
      aviso_documentacao: form.aviso_documentacao.trim()
    };
    if (inicio) campos.data_inicio = inicio;
    if (fim) campos.data_fim = fim;

    await onSubmit({ campos, foto });
  };

  const campoErro = (nome) => erros[nome] && <p className="ed-erro-campo" id={`erro-${nome}`} role="alert">{erros[nome]}</p>;
  const ariaErro = (nome) => (erros[nome] ? { 'aria-invalid': true, 'aria-describedby': `erro-${nome}` } : {});

  return (
    <form onSubmit={enviar} className="ed-form" noValidate>
      <div className="ed-campo">
        <label htmlFor="f-nome">Nome do evento *</label>
        <input
          id="f-nome" name="nome_edicao" value={form.nome_edicao} onChange={alterar}
          placeholder="Ex: GEEKTOPIA 2027" maxLength={150} required {...ariaErro('nome_edicao')}
        />
        {campoErro('nome_edicao')}
      </div>

      <fieldset className="ed-fieldset">
        <legend>Quando acontece</legend>

        <label className="ed-check">
          <input
            type="checkbox" checked={diaUnico}
            onChange={(e) => { setDiaUnico(e.target.checked); onAlterado?.(true); }}
          />
          Evento de um dia só
        </label>

        {diaUnico ? (
          <div className="ed-linha">
            <div className="ed-campo">
              <label htmlFor="f-data">Data</label>
              <input id="f-data" type="date" name="data_evento" value={form.data_evento} onChange={alterar} />
            </div>
            <div className="ed-campo">
              <label htmlFor="f-hi">Início</label>
              <input id="f-hi" type="time" name="hora_inicio" value={form.hora_inicio} onChange={alterar} />
            </div>
            <div className="ed-campo">
              <label htmlFor="f-hf">Término</label>
              <input id="f-hf" type="time" name="hora_fim" value={form.hora_fim} onChange={alterar} {...ariaErro('hora_fim')} />
              {campoErro('hora_fim')}
            </div>
          </div>
        ) : (
          <div className="ed-linha">
            <div className="ed-campo">
              <label htmlFor="f-im">Começa em</label>
              <input id="f-im" type="datetime-local" name="inicio_multi" value={form.inicio_multi} onChange={alterar} {...ariaErro('inicio_multi')} />
              {campoErro('inicio_multi')}
            </div>
            <div className="ed-campo">
              <label htmlFor="f-fm">Termina em</label>
              <input id="f-fm" type="datetime-local" name="fim_multi" value={form.fim_multi} onChange={alterar} {...ariaErro('fim_multi')} />
              {campoErro('fim_multi')}
            </div>
          </div>
        )}
      </fieldset>

      <div className="ed-campo">
        <label htmlFor="f-local">Local</label>
        <input id="f-local" name="local" value={form.local} onChange={alterar} placeholder="Ex: Centro de Convenções, Ponta Grossa - PR" maxLength={200} />
      </div>

      <div className="ed-campo">
        <label htmlFor="f-desc">Descrição</label>
        <textarea id="f-desc" name="descricao" value={form.descricao} onChange={alterar} rows={4} placeholder="Conte do que se trata o evento..." />
      </div>

      <div className="ed-linha">
        <div className="ed-campo">
          <label htmlFor="f-faixa">Classificação indicativa</label>
          <select id="f-faixa" name="classificacao_etaria" value={form.classificacao_etaria} onChange={alterar} aria-describedby="ajuda-faixa">
            {OPCOES_CLASSIFICACAO.map((o) => <option key={o.valor} value={o.valor}>{o.rotulo}</option>)}
          </select>
          <small className="ed-ajuda" id="ajuda-faixa">Aparece como selo no site (ex.: “14+”).</small>
        </div>
        <div className="ed-campo">
          <label htmlFor="f-idade">Observações sobre idade</label>
          <textarea id="f-idade" name="regras_idade_minima" value={form.regras_idade_minima} onChange={alterar} rows={2} placeholder="Ex: Menores de 14 anos só acompanhados de um responsável." />
        </div>
        <div className="ed-campo">
          <label htmlFor="f-doc">Aviso sobre documentação</label>
          <textarea id="f-doc" name="aviso_documentacao" value={form.aviso_documentacao} onChange={alterar} rows={2} placeholder="Ex: Leve um documento com foto." />
        </div>
      </div>

      <ImagemUpload
        rotulo="Foto de capa"
        urlAtual={evento?.banner_url}
        arquivo={foto}
        onEscolher={(f) => { setFoto(f); onAlterado?.(true); }}
        ajuda="Aparece no topo da página do evento. JPEG, PNG ou WEBP, até 4MB. Imagens largas (16:9) ficam melhores."
      />

      <div className="ed-acoes">
        <button type="submit" className="btn btn-primary" disabled={enviando}>
          {enviando ? 'Salvando...' : rotuloEnvio}
        </button>
      </div>
    </form>
  );
}
