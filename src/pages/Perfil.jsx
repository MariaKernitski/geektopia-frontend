import { useEffect, useState } from 'react';
import api from '../services/api';
import '../style/Perfil.css';
import ccpopLogo from '../assets/CCPOP_NAME.png';
import { Cronometro } from '../components/Cronometro';

export function Perfil() {
  const [user, setUser] = useState(null);
  const [abaAtiva, setAbaAtiva] = useState('dados');
  const [mensagem, setMensagem] = useState({ tipo: '', texto: '' });
  const [modoEdicao, setModoEdicao] = useState(false);

  const [nomeCompleto, setNomeCompleto] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [nickname, setNickname] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const dataProximoEvento = new Date('2027-08-22T09:00:00-03:00');

  useEffect(() => {
    carregarPerfil();
  }, []);

  const carregarPerfil = () => {
    api.get('/auth/me')
      .then(res => {
        const u = res.data;
        setUser(u);
        setNomeCompleto(u.nome_completo || '');
        setTelefone(u.telefone || '');
        setCidade(u.cidade || '');
        setEstado(u.estado || '');
        setNickname(u.perfil?.nickname || '');
        setAvatarUrl(u.perfil?.avatar_url || '');
      })
      .catch(() => setMensagem({ tipo: 'erro', texto: 'Erro ao carregar dados do usuário.' }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setMensagem({ tipo: '', texto: '' });
    try {
      const res = await api.put('/auth/profile', {
        nome_completo: nomeCompleto,
        telefone,
        cidade,
        nickname,
        avatar_url: avatarUrl
      });
      setMensagem({ tipo: 'sucesso', texto: res.data.message || 'Perfil atualizado!' });
      setModoEdicao(false);
      carregarPerfil();
    } catch (err) {
      setMensagem({ tipo: 'erro', texto: err.response?.data?.error || 'Erro ao atualizar perfil.' });
    }
  };

  const cancelarEdicao = () => {
    setNomeCompleto(user.nome_completo || '');
    setTelefone(user.telefone || '');
    setCidade(user.cidade || '');
    setNickname(user.perfil?.nickname || '');
    setModoEdicao(false);
    setMensagem({ tipo: '', texto: '' });
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMensagem({ tipo: '', texto: '' });
    try {
      const res = await api.patch('/auth/change-password', { senha_atual: senhaAtual, nova_senha: novaSenha });
      setMensagem({ tipo: 'sucesso', texto: res.data.message || 'Senha alterada com sucesso!' });
      setSenhaAtual('');
      setNovaSenha('');
    } catch (err) {
      setMensagem({ tipo: 'erro', texto: err.response?.data?.error || 'Erro ao alterar senha.' });
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      setMensagem({ tipo: '', texto: 'Enviando imagem...' });
      const res = await api.post('/auth/upload-avatar', formData);
      setAvatarUrl(res.data.avatar_url);
      setMensagem({ tipo: 'sucesso', texto: 'Foto atualizada com sucesso!' });
    } catch (err) {
      setMensagem({ tipo: 'erro', texto: 'Erro ao enviar foto.' });
    }
  };

  if (!user) {
    return (
      <div className="perfil-page">
        <p className="perfil-loading">Carregando dados do perfil...</p>
      </div>
    );
  }

  const documentoExibido = user.cpf
    ? `CPF: ${user.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}`
    : user.cnpj
    ? `CNPJ: ${user.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')}`
    : user.passaporte
    ? `Passaporte: ${user.passaporte}`
    : 'Documento não informado';

  const dataNascimentoFormatada = user.data_nascimento
    ? new Date(user.data_nascimento).toLocaleDateString('pt-BR')
    : 'Não informada';

  return (
    <div className="perfil-page">
      <div className="perfil-shell">

        {mensagem.texto && (
          <div className={`perfil-feedback is-${mensagem.tipo}`} role="status">
            {mensagem.texto}
          </div>
        )}

        <div className="perfil-card">

          {/* SIDEBAR */}
          <div className="perfil-sidebar">
            <img src={ccpopLogo} alt="Logo CCPOP" className="perfil-badge" />

            <nav className="perfil-nav">
              <button
                onClick={() => setAbaAtiva('dados')}
                className={`btn perfil-nav-btn ${abaAtiva === 'dados' ? 'btn-primary' : 'btn-secondary'}`}
              >
                Meus Dados
              </button>
              <button
                onClick={() => setAbaAtiva('ingressos')}
                className={`btn perfil-nav-btn ${abaAtiva === 'ingressos' ? 'btn-primary' : 'btn-secondary'}`}
              >
                Meus Ingressos
              </button>
              <button
                onClick={() => setAbaAtiva('historico')}
                className={`btn perfil-nav-btn ${abaAtiva === 'historico' ? 'btn-primary' : 'btn-secondary'}`}
              >
                Histórico de Eventos
              </button>
              <button
                onClick={() => setAbaAtiva('competicoes')}
                className={`btn perfil-nav-btn ${abaAtiva === 'competicoes' ? 'btn-primary' : 'btn-secondary'}`}
              >
                Inscrições em Competições
              </button>
              <button
                onClick={() => setAbaAtiva('seguranca')}
                className={`btn perfil-nav-btn ${abaAtiva === 'seguranca' ? 'btn-primary' : 'btn-secondary'}`}
              >
                Segurança e Senha
              </button>
            </nav>
          </div>

          {/* CONTEÚDO */}
          <div className="perfil-content">

            <div className="perfil-header">
              <div className="perfil-avatar-wrap">
                <img
                  src={avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nome_completo)}&background=F7C531&color=16151A&bold=true`}
                  alt="Avatar"
                  className="perfil-avatar"
                />
              </div>
              <h2 className="perfil-greeting-title">
                Olá, {nickname || user.nome_completo.split(' ')[0]}! Bem-vindo(a) de volta!
              </h2>
              <p className="perfil-greeting-sub">O que gostaria de fazer hoje?</p>
            </div>

            <div className="perfil-tab-body">

              {abaAtiva === 'dados' && (
                <div>
                  <div className="perfil-info-box">
                    <p className="perfil-info-row"><span className="label">Nome completo</span> {user.nome_completo}</p>
                    <p className="perfil-info-row"><span className="label">Apelido</span> {user.perfil?.nickname || 'Não definido'}</p>
                    <p className="perfil-info-row"><span className="label">E-mail</span> {user.email}</p>
                    <p className="perfil-info-row"><span className="label">{documentoExibido}</span></p>
                    <p className="perfil-info-row"><span className="label">Data de nascimento</span> {dataNascimentoFormatada}</p>
                    <p className="perfil-info-row"><span className="label">Telefone</span> {user.telefone || 'Não informado'}</p>
                    <p className="perfil-info-row"><span className="label">Localização</span> {user.cidade ? `${user.cidade} - ${user.estado || ''}` : 'Não informada'}</p>
                  </div>

                  {!modoEdicao ? (
                    <div className="perfil-edit-trigger">
                      <button type="button" className="btn btn-secondary" onClick={() => setModoEdicao(true)}>
                        Editar informações
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleUpdateProfile} className="perfil-form">
                      <div className="perfil-field">
                        <label>Nome completo</label>
                        <input value={nomeCompleto} onChange={e => setNomeCompleto(e.target.value)} />
                      </div>
                      <div className="perfil-field">
                        <label>Nickname / Apelido</label>
                        <input value={nickname} onChange={e => setNickname(e.target.value)} placeholder="Ex: DevGamer" />
                      </div>
                      <div className="perfil-field">
                        <label>Telefone</label>
                        <input value={telefone} onChange={e => setTelefone(e.target.value)} />
                      </div>
                      <div className="perfil-field">
                        <label>Cidade</label>
                        <input value={cidade} onChange={e => setCidade(e.target.value)} />
                      </div>
                      <div className="perfil-field">
                        <label>Foto de Perfil</label>
                        <input type="file" accept="image/*" onChange={handleFileUpload} />
                      </div>

                      <div className="perfil-form-actions perfil-form-actions-edit">
                        <button type="button" className="btn btn-secondary" onClick={cancelarEdicao}>Cancelar</button>
                        <button type="submit" className="btn btn-primary">Salvar Alterações</button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {abaAtiva === 'ingressos' && (
                <div className="perfil-empty-state">
                  <h3>🎟️ Seus Ingressos</h3>
                  <p>Você ainda não possui ingressos comprados para os próximos eventos.</p>
                </div>
              )}

              {abaAtiva === 'historico' && (
                <div className="perfil-empty-state">
                  <h3>📜 Histórico de Eventos</h3>
                  <p>Nenhum evento anterior encontrado no seu histórico.</p>
                </div>
              )}

              {abaAtiva === 'competicoes' && (
                <div className="perfil-empty-state">
                  <h3>🏆 Inscrições em Competições</h3>
                  <p>Você não está inscrito em nenhuma competição ou torneio no momento.</p>
                </div>
              )}

              {abaAtiva === 'seguranca' && (
                <form onSubmit={handleChangePassword} className="perfil-security-form">
                  <h3 className="perfil-security-title">Alterar Senha</h3>
                  <div className="perfil-field" style={{ marginBottom: '14px' }}>
                    <label>Senha Atual *</label>
                    <input type="password" value={senhaAtual} onChange={e => setSenhaAtual(e.target.value)} required />
                  </div>
                  <div className="perfil-field" style={{ marginBottom: '20px' }}>
                    <label>Nova Senha *</label>
                    <input type="password" value={novaSenha} onChange={e => setNovaSenha(e.target.value)} required />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Atualizar Senha</button>
                </form>
              )}
            </div>

            <div className="perfil-banner">
                🎉 <Cronometro dataAlvo={dataProximoEvento} />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}