import { Link } from 'react-router-dom';
import { FiLifeBuoy } from 'react-icons/fi';
import '../../style/Ajuda.css';

// "Precisa de ajuda?" que leva direto ao artigo certo da Central de Ajuda (abre em outra aba, para não perder o que está preenchendo).
export function LinkAjuda({ artigo, children = 'Precisa de ajuda? Veja o passo a passo' }) {
  return (
    <Link to={artigo ? `/ajuda/${artigo}` : '/ajuda'} target="_blank" rel="noopener noreferrer" className="aj-link-ajuda">
      <FiLifeBuoy aria-hidden="true" /> {children}
    </Link>
  );
}
