import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiStar, FiPackage } from 'react-icons/fi';
import api from '../services/api';
import '../style/AdminHub.css';
import '../style/AdminEventoTipoEscolha.css';

// Tela que abre ao clicar em "Criar evento". Só existe UMA Geektopia Principal
// vigente por vez: criar uma nova NÃO é bloqueado, mas a atual passa a ser a
// "Principal anterior" (edição passada, continua editável). Por isso, quando
// já existe uma, este card avisa disso em vez de esconder a opção.
export function AdminEventoTipoEscolha() {
  const navigate = useNavigate();
  const [principalExistente, setPrincipalExistente] = useState(undefined); // undefined = ainda carregando
  const [erro, setErro] = useState('');

  useEffect(() => {
    api.get('/geektopia/admin/todas')
      .then(res => {
        const principal = res.data.find(ev => ev.tipo_edicao === 'Principal');
        setPrincipalExistente(principal || null);
      })
      .catch(() => setErro('Não foi possível verificar as edições existentes.'));
  }, []);

  const carregando = principalExistente === undefined;

  return (
    <div className="admin-hub-page">
      <div className="admin-hub-shell">
        <button type="button" className="btn btn-secondary" onClick={() => navigate('/admin/eventos')} style={{ marginBottom: '16px' }}>
          ← Voltar
        </button>

        <div className="admin-hub-header">
          <div>
            <h1 className="admin-hub-greeting">Que tipo de edição você quer criar?</h1>
            <p className="admin-hub-sub">
              Pocket é uma edição menor, só com ingressos. A Geektopia Principal é o evento
              grande do ano — com programação, competições e convidados de destaque.
            </p>
          </div>
        </div>

        {erro && <div className="admin-list-feedback is-erro">{erro}</div>}

        <div className="tipo-escolha-grid">
          {/* POCKET — sempre pode criar mais uma */}
          <Link to="/admin/eventos/criar/pocket" className="tipo-escolha-card">
            <FiPackage className="tipo-escolha-icon" />
            <span className="tipo-escolha-titulo">Edição Pocket</span>
            <span className="tipo-escolha-desc">Evento menor, focado em ingressos. Pode criar quantas quiser.</span>
            <span className="btn btn-secondary tipo-escolha-btn">+ Criar Pocket</span>
          </Link>

          {/* PRINCIPAL — card muda de comportamento se já existir uma */}
          {carregando ? (
            <div className="tipo-escolha-card is-carregando">
              <FiStar className="tipo-escolha-icon" />
              <span className="tipo-escolha-titulo">Geektopia Principal</span>
              <span className="tipo-escolha-desc">Verificando...</span>
            </div>
          ) : principalExistente ? (
            <div className="tipo-escolha-card is-existente">
              <FiStar className="tipo-escolha-icon" />
              <span className="tipo-escolha-titulo">Geektopia Principal</span>
              <span className="tipo-escolha-desc">
                A atual é <strong>{principalExistente.nome_edicao}</strong>. Só há uma por vez: ao criar uma nova,
                a atual vira a edição passada (Principal anterior) e continua editável.
              </span>
              <div className="tipo-escolha-botoes">
                <Link to="/admin/eventos/criar/principal" className="btn btn-primary tipo-escolha-btn">+ Criar nova Principal</Link>
                <Link to={`/admin/eventos/${principalExistente.id_geektopia}`} className="btn btn-secondary tipo-escolha-btn">Gerenciar a atual</Link>
              </div>
            </div>
          ) : (
            <Link to="/admin/eventos/criar/principal" className="tipo-escolha-card">
              <FiStar className="tipo-escolha-icon" />
              <span className="tipo-escolha-titulo">Geektopia Principal</span>
              <span className="tipo-escolha-desc">O evento de destaque da edição atual. Ainda não existe nenhuma.</span>
              <span className="btn btn-primary tipo-escolha-btn">+ Criar Principal</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}