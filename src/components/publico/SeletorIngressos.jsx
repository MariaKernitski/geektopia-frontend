import { useRef, useState } from 'react';
import { CATEGORIAS, moeda } from '../../utils/evento';

const POUCAS_UNIDADES = 10;

// Escolha de ingressos por categoria (Inteira, Meia-entrada, Meet & Greet...),
// como no protótipo: uma aba por categoria e, dentro dela, os lotes com preço,
// disponibilidade e quantidade.
//
//   lotes        lotes da edição (com categoria, restantes, esgotado, idade_minima)
//   quantidades  { id_lote: n }
//   onAlterar    (id_lote, delta): delta = +1 ou -1 (incremento, não valor absoluto, para cliques rápidos não se perderem)
//   vendaAberta  false = só informa; não mostra os controles de quantidade
export function SeletorIngressos({ lotes, quantidades, onAlterar, vendaAberta, semVendaTexto }) {
  const grupos = CATEGORIAS
    .map((c) => ({ ...c, lotes: lotes.filter((l) => (l.categoria || 'Inteira') === c.chave) }))
    .filter((g) => g.lotes.length > 0);

  // Abre na primeira categoria que ainda tem ingresso; se tudo esgotou, na primeira.
  const [ativa, setAtiva] = useState(() => (grupos.find((g) => g.lotes.some((l) => !l.esgotado)) || grupos[0])?.chave);
  const abas = useRef({});

  const selecionadosPorCategoria = (g) => g.lotes.reduce((s, l) => s + (quantidades[l.id_lote] || 0), 0);

  // Setas do teclado entre as abas (padrão WAI-ARIA de tabs).
  const aoTeclar = (e, i) => {
    let alvo = null;
    if (e.key === 'ArrowRight') alvo = (i + 1) % grupos.length;
    if (e.key === 'ArrowLeft') alvo = (i - 1 + grupos.length) % grupos.length;
    if (e.key === 'Home') alvo = 0;
    if (e.key === 'End') alvo = grupos.length - 1;
    if (alvo === null) return;
    e.preventDefault();
    setAtiva(grupos[alvo].chave);
    abas.current[grupos[alvo].chave]?.focus();
  };

  const grupoAtivo = grupos.find((g) => g.chave === ativa) || grupos[0];

  return (
    <div className="dt-ingressos">
      {grupos.length > 1 && (
        <div className="dt-abas" role="tablist" aria-label="Tipos de ingresso">
          {grupos.map((g, i) => {
            const marcados = selecionadosPorCategoria(g);
            return (
              <button
                key={g.chave} type="button" role="tab" id={`aba-${g.chave}`}
                aria-selected={g.chave === grupoAtivo.chave} aria-controls={`painel-${g.chave}`}
                tabIndex={g.chave === grupoAtivo.chave ? 0 : -1}
                ref={(el) => { abas.current[g.chave] = el; }}
                className={`dt-aba ${g.chave === grupoAtivo.chave ? 'is-ativa' : ''}`}
                onClick={() => setAtiva(g.chave)} onKeyDown={(e) => aoTeclar(e, i)}
              >
                {g.rotulo}
                {marcados > 0 && <span className="dt-aba-marca" aria-label={`${marcados} selecionado(s)`}>{marcados}</span>}
              </button>
            );
          })}
        </div>
      )}

      <div role="tabpanel" id={`painel-${grupoAtivo.chave}`} aria-labelledby={`aba-${grupoAtivo.chave}`} className="dt-painel-ingressos">
        {grupoAtivo.dica && <p className="dt-dica">{grupoAtivo.dica}</p>}

        <ul className="dt-lotes">
          {grupoAtivo.lotes.map((l) => {
            const qtd = quantidades[l.id_lote] || 0;
            const max = l.restantes ?? 99;
            const poucos = !l.esgotado && l.restantes !== undefined && l.restantes <= POUCAS_UNIDADES;
            const nomeCampo = `${l.nome_lote}`;

            return (
              <li key={l.id_lote} className={`dt-lote ${l.esgotado ? 'is-esgotado' : ''} ${qtd > 0 ? 'is-selecionado' : ''}`}>
                <div className="dt-lote-info">
                  <strong className="dt-lote-nome" id={`lote-${l.id_lote}`}>{l.nome_lote}</strong>
                  <div className="dt-lote-chips">
                    {l.idade_minima && <span className="pb-chip">{l.idade_minima}+ anos</span>}
                    {poucos && <span className="pb-chip is-aviso">{l.restantes === 1 ? 'Última unidade' : `Restam ${l.restantes}`}</span>}
                    {l.esgotado && <span className="pb-chip is-erro">Esgotado</span>}
                  </div>
                </div>

                <span className="dt-lote-preco">{moeda(l.valor_ingresso)}</span>

                {vendaAberta && (
                  <div className="dt-stepper" role="group" aria-labelledby={`lote-${l.id_lote}`}>
                    <button type="button" aria-label={`Diminuir quantidade de ${nomeCampo}`} disabled={l.esgotado || qtd === 0} onClick={() => onAlterar(l.id_lote, -1)}>−</button>
                    <output aria-live="polite">{qtd}</output>
                    <button type="button" aria-label={`Aumentar quantidade de ${nomeCampo}`} disabled={l.esgotado || qtd >= max} onClick={() => onAlterar(l.id_lote, 1)}>+</button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        {!vendaAberta && semVendaTexto && <p className="dt-dica dt-dica-aviso">{semVendaTexto}</p>}
      </div>
    </div>
  );
}
