import { Link } from 'react-router-dom';
import { FiHome, FiStar } from 'react-icons/fi';

const PAGINAS = [
  { chave: 'inicial', rotulo: 'Página inicial', detalhe: 'Landing page: topo, números, quem somos, rodapé', to: '/admin/paginas', Icone: FiHome, endereco: '/' },
  { chave: 'geektopia', rotulo: 'Página Geektopia', detalhe: 'Carrossel de fotos e textos gerais do evento', to: '/admin/paginas?pagina=geektopia', Icone: FiStar, endereco: '/geektopia' }
];

// Escolha da página que está sendo editada: cada cartão diz o que a página é e qual está aberta agora.
export function AbasPaginas({ atual }) {
  return (
    <nav className="pg-seletor" aria-label="Qual página você quer editar?">
      {PAGINAS.map(({ chave, rotulo, detalhe, to, Icone }) => {
        const ativa = chave === atual;
        return (
          <Link key={chave} to={to} className={`pg-opcao ${ativa ? 'is-ativa' : ''}`} aria-current={ativa ? 'page' : undefined}>
            <span className="pg-opcao-icone"><Icone aria-hidden="true" /></span>
            <span className="pg-opcao-texto">
              <strong>{rotulo}</strong>
              <small>{detalhe}</small>
            </span>
            {ativa && <span className="pg-opcao-selo">Editando agora</span>}
          </Link>
        );
      })}
    </nav>
  );
}
