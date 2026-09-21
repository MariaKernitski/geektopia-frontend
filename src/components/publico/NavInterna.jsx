import { useEffect, useState } from 'react';

// Navegação fixa entre as seções de uma página, logo abaixo do cabeçalho do site.
// Destaca a seção que está na tela. `cta` é o botão de ação à direita (opcional).
export function NavInterna({ secoes, cta }) {
  const [ativa, setAtiva] = useState('');

  useEffect(() => {
    const observador = new IntersectionObserver(
      (entradas) => entradas.forEach((e) => { if (e.isIntersecting) setAtiva(e.target.id); }),
      { rootMargin: '-25% 0px -65% 0px' }
    );
    secoes.forEach((s) => { const el = document.getElementById(s.id); if (el) observador.observe(el); });
    return () => observador.disconnect();
  }, [secoes]);

  return (
    <nav className="pb-nav" aria-label="Seções da página">
      <div className="pb-container pb-nav-interno">
        <ul>
          {secoes.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className={ativa === s.id ? 'is-ativa' : undefined} aria-current={ativa === s.id ? 'location' : undefined}>{s.rotulo}</a>
            </li>
          ))}
        </ul>
        {cta}
      </div>
    </nav>
  );
}
