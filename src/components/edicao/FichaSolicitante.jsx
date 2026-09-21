import { FiExternalLink, FiMail, FiPhone } from 'react-icons/fi';
import { mascaraTelefone } from '../../utils/mascaras';

const iniciais = (nome = '') => nome.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('') || '?';

// Ficha de quem pede algo à organização (expositor ou competidor): foto, contato e
// links de portfólio no mesmo lugar, para a análise não depender de perguntar depois.
//   foto      logo do expositor ou avatar do competidor (pode faltar)
//   pessoa    { nome_completo, email, telefone }
//   links     [{ rotulo, url }] (os vazios são ignorados)
export function FichaSolicitante({ foto, titulo, pessoa, links = [] }) {
  const validos = links.filter((l) => l.url);
  return (
    <div className="ed-ficha">
      {foto ? (
        <a href={foto} target="_blank" rel="noopener noreferrer" className="ed-ficha-foto" title="Abrir a imagem em tamanho real">
          <img src={foto} alt={`Imagem de ${titulo}`} />
        </a>
      ) : (
        <span className="ed-ficha-foto is-vazia" aria-label="Sem imagem cadastrada">{iniciais(titulo)}</span>
      )}
      <div className="ed-ficha-dados">
        {pessoa && (
          <p className="ed-ficha-linha">
            <strong>{pessoa.nome_completo}</strong>
            {pessoa.email && <a href={`mailto:${pessoa.email}`}><FiMail aria-hidden="true" /> {pessoa.email}</a>}
            {pessoa.telefone
              ? <a href={`tel:${pessoa.telefone.replace(/\D/g, '')}`}><FiPhone aria-hidden="true" /> {mascaraTelefone(pessoa.telefone)}</a>
              : <span className="ed-ficha-falta"><FiPhone aria-hidden="true" /> sem telefone cadastrado</span>}
          </p>
        )}
        <p className="ed-ficha-linha">
          {validos.length > 0
            ? validos.map((l) => <a key={l.rotulo} href={l.url} target="_blank" rel="noopener noreferrer">{l.rotulo} <FiExternalLink aria-hidden="true" /><span className="ed-sr-only"> (abre em nova aba)</span></a>)
            : <span className="ed-ficha-falta">Nenhum link de portfólio informado</span>}
        </p>
      </div>
    </div>
  );
}
