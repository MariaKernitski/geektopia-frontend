import { useCallback, useRef, useState } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

// Carrossel acessível, sem rotação automática (o usuário controla o ritmo, e não
// há movimento inesperado). Usa rolagem nativa com "snap": funciona com toque,
// roda do mouse, teclado (← →) e os botões.
//
//   rotulo   nome da região para leitores de tela
//   itens    lista de dados; cada um vira um <li> via renderItem
export function Carrossel({ rotulo, itens, renderItem, classeItem = '' }) {
  const trilho = useRef(null);
  const [podeVoltar, setPodeVoltar] = useState(false);
  const [podeAvancar, setPodeAvancar] = useState(false);

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

  const aoTeclar = (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); rolar(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); rolar(-1); }
  };

  return (
    <div className="pb-carrossel" role="region" aria-roledescription="carrossel" aria-label={rotulo}>
      <button type="button" className="pb-carrossel-seta is-voltar" onClick={() => rolar(-1)} disabled={!podeVoltar} aria-label="Ver itens anteriores">
        <FiChevronLeft aria-hidden="true" />
      </button>

      <ul className="pb-carrossel-trilho" ref={aoMontar} onScroll={(e) => medir(e.currentTarget)} onKeyDown={aoTeclar} tabIndex={0} aria-label={`${rotulo}: use as setas do teclado para navegar`}>
        {itens.map((item, i) => (
          <li key={item.id ?? i} className={`pb-carrossel-item ${classeItem}`} aria-roledescription="item" aria-label={`${i + 1} de ${itens.length}`}>
            {renderItem(item, i)}
          </li>
        ))}
      </ul>

      <button type="button" className="pb-carrossel-seta is-avancar" onClick={() => rolar(1)} disabled={!podeAvancar} aria-label="Ver próximos itens">
        <FiChevronRight aria-hidden="true" />
      </button>
    </div>
  );
}
