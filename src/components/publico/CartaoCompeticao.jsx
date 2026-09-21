import { Link } from 'react-router-dom';
import { ROTULO_MODALIDADE } from '../../utils/competicao';
import { moeda } from '../../utils/evento';

// Cartão de competição: o cartão inteiro é o link para a página da competição,
// onde a pessoa vê os detalhes e faz a inscrição.
export function CartaoCompeticao({ c, classe }) {
  return (
    <li className="pb-cartao-item">
      <Link to={`/competicoes/${c.id_competicao}`} className={`pb-cartao ${classe}`}>
        <div className="pb-chips">
          {c.modalidade && <span className="pb-chip">{ROTULO_MODALIDADE[c.modalidade]}</span>}
          <span className={`pb-chip ${c.valor_taxa_inscricao ? '' : 'is-ok'}`}>{c.valor_taxa_inscricao ? `Inscrição ${moeda(c.valor_taxa_inscricao)}` : 'Inscrição gratuita'}</span>
        </div>
        <h3>{c.nome_competicao}</h3>
        {c.descricao && <p className="pb-cartao-resumo">{c.descricao}</p>}
        <span className="pb-cartao-cta">Ver detalhes e me inscrever →</span>
      </Link>
    </li>
  );
}
