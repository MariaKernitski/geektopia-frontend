import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { TextoTermos } from '../components/termos/TextoTermos';
import { Rodape } from '../components/Rodape';
import '../style/Termos.css';

// Página pública com o mesmo texto do pop-up do cadastro. Aceita âncoras: /termos#compras, #privacidade, #participacao.
export function Termos() {
  const { hash } = useLocation();
  useEffect(() => {
    if (!hash) return;
    const t = setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    return () => clearTimeout(t);
  }, [hash]);

  return (
    <>
      <main className="tm-pagina">
        <h1>Termos de Uso e Política de Privacidade</h1>
        <nav className="tm-indice" aria-label="Índice">
          <a href="#termos">Termos de Uso</a>
          <a href="#privacidade">Privacidade e seus dados</a>
          <a href="#compras">Compras e ingressos</a>
          <a href="#participacao">Expositores, competições e eventos da comunidade</a>
        </nav>
        <TextoTermos />
      </main>
      <Rodape />
    </>
  );
}
