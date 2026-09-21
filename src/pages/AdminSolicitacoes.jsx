import { Link, useSearchParams } from 'react-router-dom';
import { FiAward, FiCalendar, FiShoppingBag } from 'react-icons/fi';
import { AbaExpositores } from '../components/edicao/AbaExpositores';
import { AbaComunidade } from '../components/edicao/AbaComunidade';
import { AbaInscricoes } from '../components/edicao/AbaInscricoes';
import { usePendencias } from '../hooks/usePendencias';
import '../style/AdminEdicao.css';

const ABAS = [
  { chave: 'expositores', rotulo: 'Expositores', Icone: FiShoppingBag, Componente: AbaExpositores },
  { chave: 'competicoes', rotulo: 'Competições', Icone: FiAward, Componente: AbaInscricoes },
  { chave: 'comunidade', rotulo: 'Eventos da comunidade', Icone: FiCalendar, Componente: AbaComunidade }
];

// Central de solicitações: tudo o que espera análise da organização, de todas as
// edições num lugar só, separado por tipo (espaço de expositor / inscrição em competição / evento da comunidade).
export function AdminSolicitacoes() {
  const [params, setParams] = useSearchParams();
  const pendencias = usePendencias();
  const chave = ABAS.some((a) => a.chave === params.get('tipo')) ? params.get('tipo') : 'expositores';
  const { Componente } = ABAS.find((a) => a.chave === chave);

  return (
    <div className="ed-pagina">
      <Link to="/admin" className="btn btn-secondary ed-voltar">← Painel</Link>
      <h1 className="ed-titulo-pagina">Solicitações</h1>
      <p className="ed-ajuda-topo">Pedidos de espaço de expositores, inscrições em competições e eventos da comunidade que aguardam a sua análise, de todas as edições.</p>

      <nav className="sol-abas" aria-label="Tipos de solicitação">
        {ABAS.map(({ chave: k, rotulo, Icone }) => (
          <button key={k} type="button" className={`sol-aba ${k === chave ? 'is-ativa' : ''}`} aria-current={k === chave ? 'page' : undefined}
            onClick={() => setParams({ tipo: k }, { replace: true })}>
            <Icone aria-hidden="true" /> {rotulo}
            {pendencias[k] > 0 && <span className="sol-aba-qtd" aria-label={`${pendencias[k]} em análise`}>{pendencias[k]}</span>}
          </button>
        ))}
      </nav>

      <Componente key={chave} evento={null} />
    </div>
  );
}
