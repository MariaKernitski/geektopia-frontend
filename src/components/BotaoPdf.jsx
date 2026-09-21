import { useState } from 'react';
import { FiDownload } from 'react-icons/fi';
import { baixarArquivo } from '../utils/download';

// Botão que baixa um PDF protegido por login (ingressos), com estado de carregando e erro.
export function BotaoPdf({ url, nome, children, secundario = true }) {
  const [baixando, setBaixando] = useState(false);
  const [falhou, setFalhou] = useState(false);
  const baixar = async () => {
    setBaixando(true);
    setFalhou(false);
    try { await baixarArquivo(url, nome); } catch { setFalhou(true); } finally { setBaixando(false); }
  };
  return (
    <>
      <button type="button" className={`btn ${secundario ? 'btn-secondary' : 'btn-primary'} perfil-btn-pdf`} disabled={baixando} onClick={baixar}>
        <FiDownload aria-hidden="true" /> {baixando ? 'Gerando PDF...' : children}
      </button>
      {falhou && <span className="perfil-erro-pdf" role="alert">Não foi possível baixar. Tente de novo.</span>}
    </>
  );
}

