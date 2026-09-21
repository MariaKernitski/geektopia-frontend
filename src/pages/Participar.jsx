import { Link } from 'react-router-dom';
import { FiArrowRight, FiAward, FiCalendar, FiShoppingBag, FiTag } from 'react-icons/fi';
import '../style/AdminEdicao.css';
import '../style/Parceiro.css';

const OPCOES = [
  {
    to: '/geektopia', Icone: FiTag, titulo: 'Quero visitar', acao: 'Ver eventos e ingressos',
    texto: 'Só quer curtir? Escolha o evento, compre o seu ingresso e receba o QR code no perfil. Não precisa de mais nada.'
  },
  {
    to: '/competidor', Icone: FiAward, titulo: 'Quero competir', acao: 'Ver minhas inscrições',
    texto: 'Inscreva-se nas competições das edições e acompanhe a análise, o pagamento da taxa e a confirmação da vaga.'
  },
  {
    to: '/expositor', Icone: FiShoppingBag, titulo: 'Quero expor', acao: 'Abrir a área do expositor',
    texto: 'Tenha uma loja, um estande ou uma mesa de artista nas edições. Crie o perfil, peça o espaço e acompanhe a análise.'
  },
  {
    to: '/perfil?secao=comunidade', Icone: FiCalendar, titulo: 'Quero divulgar meu evento', acao: 'Enviar evento',
    texto: 'Organiza um evento geek, cultural ou de jogos? Envie para a CCPOP analisar e divulgar na página Eventos da comunidade. É gratuito.'
  }
];

// Porta de entrada: visitar (o caminho mais comum, sem burocracia), competir ou expor.
// A pessoa pode fazer mais de um.
export function Participar() {
  return (
    <div className="ed-pagina">
      <h1 className="ed-titulo-pagina" style={{ marginBottom: 6 }}>Como você quer participar?</h1>
      <p className="ed-subtitulo" style={{ marginBottom: 24 }}>Escolha um caminho. Você pode fazer mais de um e voltar aqui quando quiser.</p>

      <div className="pt-cartoes-participar">
        {OPCOES.map(({ to, Icone, titulo, texto, acao }, i) => (
          <Link key={to} to={to} className={`pt-cartao pt-cartao-link pt-cartao-grande ${i === 0 ? 'is-principal' : ''}`}>
            <span className="pt-cartao-icone"><Icone size={26} aria-hidden="true" /></span>
            <span className="pt-cartao-titulo">{titulo}</span>
            <span className="pt-cartao-texto">{texto}</span>
            <span className="pt-cartao-acao">{acao} <FiArrowRight aria-hidden="true" /></span>
          </Link>
        ))}
      </div>
    </div>
  );
}
