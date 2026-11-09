import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiHelpCircle } from 'react-icons/fi';
import { DICAS } from '../../utils/dicas';
import '../../style/Ajuda.css';

// Ícone "?" que abre uma explicação curta ao lado de um campo confuso.
//   chave  nome do texto em utils/dicas.js        rotulo  nome do campo (para leitores de tela)
// Funciona com teclado (Enter/Espaço abre, Esc fecha) e fecha ao clicar fora.
export function Dica({ chave, rotulo, texto, artigo }) {
  const dica = DICAS[chave] || {};
  const conteudo = texto || dica.texto;
  const idArtigo = artigo || dica.artigo;
  const [aberta, setAberta] = useState(false);
  const raiz = useRef(null);
  const id = useId();

  useEffect(() => {
    if (!aberta) return undefined;
    const fora = (e) => { if (raiz.current && !raiz.current.contains(e.target)) setAberta(false); };
    const esc = (e) => { if (e.key === 'Escape') setAberta(false); };
    document.addEventListener('mousedown', fora);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', fora); document.removeEventListener('keydown', esc); };
  }, [aberta]);

  if (!conteudo) return null;
  return (
    <span className="aj-dica" ref={raiz}>
      <button type="button" className="aj-dica-botao" aria-expanded={aberta} aria-controls={id} aria-label={`Ajuda${rotulo ? `: ${rotulo}` : ''}`} onClick={() => setAberta((a) => !a)}>
        <FiHelpCircle aria-hidden="true" />
      </button>
      {aberta && (
        <span className="aj-dica-balao" id={id} role="note">
          {conteudo}
          {idArtigo && <Link to={`/ajuda/${idArtigo}`} target="_blank" rel="noopener noreferrer" className="aj-dica-link">Ver o passo a passo</Link>}
        </span>
      )}
    </span>
  );
}
