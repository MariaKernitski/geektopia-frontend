import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiCheck, FiX } from 'react-icons/fi';
import { TextoTermos } from './TextoTermos';
import '../../style/Termos.css';

// Pop-up com os Termos de Uso e a Política de Privacidade. O botão "Li e aceito" só libera depois de rolar até o fim.
export function TermosModal({ aberto, aoAceitar, aoFechar }) {
  const rolagem = useRef(null);
  const [chegouAoFim, setChegouAoFim] = useState(false);

  const conferir = useCallback(() => {
    const el = rolagem.current;
    if (el && el.scrollTop + el.clientHeight >= el.scrollHeight - 12) setChegouAoFim(true);
  }, []);

  useEffect(() => {
    if (!aberto) return undefined;
    const t = setTimeout(conferir, 100);
    const aoTeclar = (e) => { if (e.key === 'Escape') aoFechar(); };
    document.addEventListener('keydown', aoTeclar);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { clearTimeout(t); document.removeEventListener('keydown', aoTeclar); document.body.style.overflow = overflow; };
  }, [aberto, aoFechar, conferir]);

  if (!aberto) return null;
  return createPortal(
    <div className="tm-fundo" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) aoFechar(); }}>
      <div className="tm-caixa" role="dialog" aria-modal="true" aria-labelledby="tm-titulo">
        <header className="tm-topo">
          <h2 id="tm-titulo">Termos de Uso e Política de Privacidade</h2>
          <button type="button" className="tm-fechar" onClick={aoFechar} aria-label="Fechar sem aceitar"><FiX aria-hidden="true" /></button>
        </header>
        <div className="tm-rolagem" ref={rolagem} onScroll={conferir} tabIndex={0} aria-label="Texto dos termos">
          <TextoTermos />
        </div>
        <footer className="tm-rodape">
          <p className="tm-dica" role="status">{chegouAoFim ? 'Você chegou ao fim do texto.' : 'Role até o final para liberar o aceite.'}</p>
          <div className="tm-botoes">
            <button type="button" className="btn btn-secondary" onClick={aoFechar}>Agora não</button>
            <button type="button" className="btn btn-primary" disabled={!chegouAoFim} onClick={aoAceitar}><FiCheck aria-hidden="true" /> Li e aceito</button>
          </div>
        </footer>
      </div>
    </div>,
    document.body
  );
}
