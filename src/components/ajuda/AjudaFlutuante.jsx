import { Link, useLocation } from 'react-router-dom';
import { FiHelpCircle } from 'react-icons/fi';
import { artigoDaTela, semBotaoDeAjuda } from '../../utils/ajudaContextual';
import '../../style/Ajuda.css';

// Botão redondo de ajuda no canto inferior direito, sempre visível ao rolar. Leva ao artigo da tela em que a pessoa está
// (ou à Central de Ajuda), em outra aba, para ninguém perder o que está preenchendo.
export function AjudaFlutuante() {
  const { pathname } = useLocation();
  if (semBotaoDeAjuda(pathname)) return null;
  const artigo = artigoDaTela(pathname);
  return (
    <Link
      to={artigo ? `/ajuda/${artigo}` : '/ajuda'}
      target="_blank"
      rel="noopener noreferrer"
      className="aj-flutuante"
      aria-label={artigo ? 'Ajuda sobre esta tela (abre em outra aba)' : 'Central de ajuda (abre em outra aba)'}
      title="Precisa de ajuda?"
    >
      <FiHelpCircle aria-hidden="true" />
      <span className="aj-flutuante-rotulo">Ajuda</span>
    </Link>
  );
}
