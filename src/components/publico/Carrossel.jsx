import { useCallback, useEffect, useRef, useState } from 'react';
import { FiChevronLeft, FiChevronRight, FiPause, FiPlay } from 'react-icons/fi';

// Carrossel acessível. Usa rolagem nativa com "snap": funciona com toque, roda do
// mouse, teclado (← →) e os botões.
//
//   rotulo    nome da região para leitores de tela
//   itens     lista de dados; cada um vira um <li> via renderItem
//   autoplay  (opcional) milissegundos entre avanços automáticos. A rotação para sozinha
//             quando o mouse está em cima, quando há foco dentro, quando a aba fica em
//             segundo plano e para quem pediu "reduzir movimento" no sistema; e sempre
//             há um botão de pausar (exigência de acessibilidade para conteúdo que se move).
export function Carrossel({ rotulo, itens, renderItem, classeItem = '', autoplay = 0 }) {
  const trilho = useRef(null);
  const [podeVoltar, setPodeVoltar] = useState(false);
  const [podeAvancar, setPodeAvancar] = useState(false);
  const movimentoReduzido = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const temAutoplay = autoplay > 0 && !movimentoReduzido && itens.length > 1;
  const [tocando, setTocando] = useState(true); // escolha da pessoa (botão)
  const [interagindo, setInteragindo] = useState(false); // mouse em cima ou foco dentro: pausa temporária

  const medir = useCallback((el) => {
    if (!el) return;
    setPodeVoltar(el.scrollLeft > 4);
    setPodeAvancar(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  // Mede depois de montar (as imagens ainda podem estar carregando: o onScroll corrige).
  const aoMontar = useCallback((el) => {
    trilho.current = el;
    if (el) requestAnimationFrame(() => medir(el));
  }, [medir]);

  const rolar = (direcao) => {
    const el = trilho.current;
    if (!el) return;
    const reduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollBy({ left: direcao * el.clientWidth * 0.85, behavior: reduzido ? 'auto' : 'smooth' });
  };

  useEffect(() => {
    if (!temAutoplay || !tocando || interagindo) return undefined;
    const id = setInterval(() => {
      const el = trilho.current;
      if (!el || document.visibilityState !== 'visible') return;
      const noFim = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
      if (noFim) el.scrollTo({ left: 0, behavior: 'smooth' }); // volta ao início e segue
      else el.scrollBy({ left: el.clientWidth * 0.85, behavior: 'smooth' });
    }, autoplay);
    return () => clearInterval(id);
  }, [temAutoplay, tocando, interagindo, autoplay]);

  const aoTeclar = (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); rolar(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); rolar(-1); }
  };

  return (
    <div
      className="pb-carrossel" role="region" aria-roledescription="carrossel" aria-label={rotulo}
      onMouseEnter={() => setInteragindo(true)} onMouseLeave={() => setInteragindo(false)}
      onFocus={() => setInteragindo(true)} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setInteragindo(false); }}
    >
      <button type="button" className="pb-carrossel-seta is-voltar" onClick={() => rolar(-1)} disabled={!podeVoltar} aria-label="Ver itens anteriores">
        <FiChevronLeft aria-hidden="true" />
      </button>

      <ul className="pb-carrossel-trilho" ref={aoMontar} onScroll={(e) => medir(e.currentTarget)} onKeyDown={aoTeclar} tabIndex={0} aria-label={`${rotulo}: use as setas do teclado para navegar`} aria-live={temAutoplay && tocando && !interagindo ? 'off' : 'polite'}>
        {itens.map((item, i) => (
          <li key={item.id ?? i} className={`pb-carrossel-item ${classeItem}`} aria-roledescription="item" aria-label={`${i + 1} de ${itens.length}`}>
            {renderItem(item, i)}
          </li>
        ))}
      </ul>

      {temAutoplay && (
        <button type="button" className="pb-carrossel-pausa" onClick={() => setTocando((t) => !t)} aria-pressed={!tocando}
          aria-label={tocando ? 'Pausar a rotação automática' : 'Retomar a rotação automática'}>
          {tocando ? <FiPause aria-hidden="true" /> : <FiPlay aria-hidden="true" />}
          <span>{tocando ? 'Pausar' : 'Reproduzir'}</span>
        </button>
      )}

      <button type="button" className="pb-carrossel-seta is-avancar" onClick={() => rolar(1)} disabled={!podeAvancar} aria-label="Ver próximos itens">
        <FiChevronRight aria-hidden="true" />
      </button>
    </div>
  );
}
