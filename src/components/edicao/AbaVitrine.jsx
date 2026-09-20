import { useState } from 'react';
import { FiArrowDown, FiArrowUp, FiPlus, FiTrash2 } from 'react-icons/fi';
import api from '../../services/api';
import { useAviso, mensagemDeErro } from '../../hooks/useAviso';
import { AvisoBox } from './AvisoBox';
import { COR_PADRAO, contraste, ehHexValido } from '../../utils/cores';
import { mover } from '../../utils/ordem';

const MAX_DESTAQUES = 6;
let contador = 0;
const chave = () => `d${(contador += 1)}`; // chave estável para a lista, sem depender do índice

const doEvento = (evento) => ({
  tagline: evento.tagline || '',
  texto_sobre: evento.texto_sobre || '',
  cor: evento.cor_destaque || '',
  destaques: (Array.isArray(evento.destaques) ? evento.destaques : []).map((d) => ({
    _k: chave(), titulo: d.titulo || '', descricao: d.descricao || ''
  }))
});

// Textos e cor que alimentam a vitrine pública da edição.
export function AbaVitrine({ evento, recarregarEvento, marcarAlterado }) {
  const { aviso, mostrar, limpar } = useAviso();
  const [form, setForm] = useState(() => doEvento(evento));
  const [enviando, setEnviando] = useState(false);

  const atualizar = (parcial) => {
    setForm((f) => ({ ...f, ...parcial }));
    marcarAlterado(true);
  };

  const corValida = ehHexValido(form.cor) ? form.cor : null;
  const corEfetiva = corValida || COR_PADRAO;
  const contrasteBotao = contraste(corEfetiva, '#16151A'); // texto escuro sobre o botão
  const contrasteFundo = contraste(corEfetiva, '#FCFAF6'); // título/realce sobre o fundo claro

  const alterarDestaque = (indice, parcial) => {
    atualizar({ destaques: form.destaques.map((d, i) => (i === indice ? { ...d, ...parcial } : d)) });
  };

  const salvar = async (e) => {
    e.preventDefault();
    limpar();

    if (form.cor && !corValida) {
      mostrar('erro', 'A cor precisa estar no formato #RRGGBB (ex.: #F7C531).');
      return;
    }
    if (form.destaques.some((d) => !d.titulo.trim())) {
      mostrar('erro', 'Todo destaque precisa de um título. Preencha ou remova o item vazio.');
      return;
    }

    setEnviando(true);
    try {
      await api.put(`/geektopia/${evento.id_geektopia}`, {
        tagline: form.tagline,
        texto_sobre: form.texto_sobre,
        cor_destaque: corValida,
        destaques: form.destaques.length
          ? form.destaques.map((d) => ({ titulo: d.titulo.trim(), descricao: d.descricao.trim() }))
          : null
      });
      await recarregarEvento();
      marcarAlterado(false);
      mostrar('sucesso', 'Vitrine salva.');
    } catch (err) {
      mostrar('erro', mensagemDeErro(err, 'Não foi possível salvar a vitrine.'));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <section className="ed-painel" aria-labelledby="t-vitrine">
      <h2 id="t-vitrine" className="ed-titulo">Vitrine pública</h2>
      <p className="ed-ajuda-topo">Textos e cor que aparecem na página desta edição. Tudo é opcional: o que ficar em branco simplesmente não aparece.</p>
      <AvisoBox aviso={aviso} />

      <div className="ed-duas-colunas">
        <form onSubmit={salvar} className="ed-form" noValidate>
          <div className="ed-campo">
            <label htmlFor="v-tag">Frase de destaque</label>
            <input
              id="v-tag" value={form.tagline} maxLength={200}
              onChange={(e) => atualizar({ tagline: e.target.value })}
              placeholder="Ex: O maior encontro geek do Paraná"
            />
            <small className="ed-ajuda">{form.tagline.length}/200 · aparece logo abaixo do nome, no topo.</small>
          </div>

          <div className="ed-campo">
            <label htmlFor="v-sobre">Sobre a edição</label>
            <textarea
              id="v-sobre" rows={6} value={form.texto_sobre} maxLength={10000}
              onChange={(e) => atualizar({ texto_sobre: e.target.value })}
              placeholder="Conte a história e o clima desta edição. Quebras de linha são mantidas."
            />
          </div>

          <div className="ed-campo">
            <label htmlFor="v-cor">Cor de destaque</label>
            <div className="ed-cor">
              <input
                type="color" aria-label="Escolher cor" value={corEfetiva}
                onChange={(e) => atualizar({ cor: e.target.value.toUpperCase() })}
              />
              <input
                id="v-cor" value={form.cor} placeholder={COR_PADRAO} maxLength={7}
                onChange={(e) => atualizar({ cor: e.target.value })}
                aria-invalid={form.cor && !corValida ? true : undefined}
              />
              {form.cor && (
                <button type="button" className="btn btn-secondary ed-btn-sm" onClick={() => atualizar({ cor: '' })}>
                  Usar padrão
                </button>
              )}
            </div>
            <small className="ed-ajuda">Tinge botões, títulos de seção e realces. O fundo escuro do site não muda.</small>
            {corValida && contrasteBotao < 4.5 && (
              <p className="ed-alerta" role="status">Texto escuro sobre botões desta cor fica difícil de ler. Prefira um tom mais claro ou mais vivo.</p>
            )}
            {corValida && contrasteFundo < 3 && (
              <p className="ed-alerta" role="status">Esta cor é muito clara: títulos com ela podem sumir sobre o fundo claro do site.</p>
            )}
          </div>

          <fieldset className="ed-fieldset">
            <legend>Destaques ({form.destaques.length}/{MAX_DESTAQUES})</legend>
            <p className="ed-ajuda">Cartões curtos sobre o que a edição tem de melhor (ex.: "Desfile cosplay", "Arena de jogos").</p>

            {form.destaques.map((d, i) => (
              <div className="ed-item-editavel" key={d._k}>
                <div className="ed-campo">
                  <label htmlFor={`d-t-${d._k}`}>Título</label>
                  <input id={`d-t-${d._k}`} value={d.titulo} maxLength={80} onChange={(e) => alterarDestaque(i, { titulo: e.target.value })} />
                </div>
                <div className="ed-campo">
                  <label htmlFor={`d-d-${d._k}`}>Descrição (opcional)</label>
                  <input id={`d-d-${d._k}`} value={d.descricao} maxLength={300} onChange={(e) => alterarDestaque(i, { descricao: e.target.value })} />
                </div>
                <div className="ed-item-acoes">
                  <button type="button" className="ed-icone-btn" aria-label={`Subir destaque ${i + 1}`} disabled={i === 0} onClick={() => atualizar({ destaques: mover(form.destaques, i, -1) })}><FiArrowUp /></button>
                  <button type="button" className="ed-icone-btn" aria-label={`Descer destaque ${i + 1}`} disabled={i === form.destaques.length - 1} onClick={() => atualizar({ destaques: mover(form.destaques, i, 1) })}><FiArrowDown /></button>
                  <button type="button" className="ed-icone-btn is-perigo" aria-label={`Remover destaque ${i + 1}`} onClick={() => atualizar({ destaques: form.destaques.filter((x) => x._k !== d._k) })}><FiTrash2 /></button>
                </div>
              </div>
            ))}

            <button
              type="button" className="btn btn-secondary ed-btn-sm"
              disabled={form.destaques.length >= MAX_DESTAQUES}
              onClick={() => atualizar({ destaques: [...form.destaques, { _k: chave(), titulo: '', descricao: '' }] })}
            >
              <FiPlus aria-hidden="true" /> Adicionar destaque
            </button>
          </fieldset>

          <div className="ed-acoes">
            <button type="submit" className="btn btn-primary" disabled={enviando}>{enviando ? 'Salvando...' : 'Salvar vitrine'}</button>
          </div>
        </form>

        <aside className="ed-previa" aria-label="Prévia" style={{ '--cor-edicao': corEfetiva }}>
          <span className="ed-previa-rotulo">Prévia</span>
          <div className="ed-previa-hero">
            <span className="ed-previa-eyebrow">GEEKTOPIA Principal</span>
            <strong className="ed-previa-nome">{evento.nome_edicao}</strong>
            <p className="ed-previa-tagline">{form.tagline || 'Sua frase de destaque aparece aqui'}</p>
            <span className="ed-previa-botao">Comprar ingressos</span>
          </div>
          {form.destaques.filter((d) => d.titulo.trim()).length > 0 && (
            <div className="ed-previa-cards">
              {form.destaques.filter((d) => d.titulo.trim()).map((d) => (
                <div className="ed-previa-card" key={d._k}>
                  <strong>{d.titulo}</strong>
                  {d.descricao && <span>{d.descricao}</span>}
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
