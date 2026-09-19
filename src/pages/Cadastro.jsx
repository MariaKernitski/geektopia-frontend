import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../style/Cadastro.css';

// Aplica máscara (00) 00000-0000 ou (00) 0000-0000
const mascaraTelefone = (v) => {
  v = v.replace(/\D/g, '');
  if (v.length > 11) v = v.slice(0, 11);
  if (v.length > 10) return v.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
  if (v.length > 6) return v.replace(/^(\d{2})(\d{4})(\d{0,4})$/, '($1) $2-$3');
  if (v.length > 2) return v.replace(/^(\d{2})(\d{0,5})$/, '($1) $2');
  return v;
};

const requisitosSenha = (senha = '') => ({
  tamanho: senha.length >= 8,
  maiuscula: /[A-Z]/.test(senha),
  minuscula: /[a-z]/.test(senha),
  numero: /\d/.test(senha),
  especial: /[^A-Za-z0-9]/.test(senha),
});

// Aplica máscara automática dependendo do tamanho (CPF ou CNPJ)
const mascaraDocumento = (v) => {
  const apenasDigitos = v.replace(/\D/g, '');

  if (apenasDigitos.length <= 11) {
    return apenasDigitos
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  } else {
    return apenasDigitos
      .slice(0, 14)
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
};

export function Cadastro() {
  const [tipoDocumento, setTipoDocumento] = useState('cpf');
  const navigate = useNavigate();
  const [etapa, setEtapa] = useState(1);
  const [mensagem, setMensagem] = useState('');

  const [estados, setEstados] = useState([]);
  const [cidades, setCidades] = useState([]);

  const [formData, setFormData] = useState({
    nome_completo: '',
    cpf: '',
    data_nascimento: '',
    email: '',
    telefone: '',
    senha: '',
    confirmarSenha: '',
    estado: '',
    cidade: '',
    genero: '',
    sexualidade: '',
    aceitaTermos: false
  });

  useEffect(() => {
    fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome')
      .then(res => res.json())
      .then(data => setEstados(data))
      .catch(err => console.error('Erro ao buscar estados:', err));
  }, []);

  useEffect(() => {
    if (!formData.estado) return;

    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${formData.estado}/municipios?orderBy=nome`)
      .then(res => res.json())
      .then(data => setCidades(data))
      .catch(err => console.error('Erro ao buscar cidades:', err));
  }, [formData.estado]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const proximaEtapa = (e) => {
    e.preventDefault();
    setMensagem('');

    const docPreenchido =
      (tipoDocumento === 'cpf' && formData.cpf) ||
      (tipoDocumento === 'cnpj' && formData.cnpj) ||
      (tipoDocumento === 'passaporte' && formData.passaporte);

    if (etapa === 1) {
      if (!formData.nome_completo || !docPreenchido || !formData.data_nascimento) {
        setMensagem('Preencha todos os campos obrigatórios da Etapa 1.');
        return;
      }
    }

    if (etapa === 2) {
      if (!formData.email || !formData.telefone || !formData.senha || !formData.confirmarSenha) {
        setMensagem('Preencha todos os campos obrigatórios da Etapa 2.');
        return;
      }

      const requisitos = requisitosSenha(formData.senha);
      const senhaValida = Object.values(requisitos).every(Boolean);
      if (!senhaValida) {
        setMensagem('A senha não atende a todos os requisitos de segurança listados abaixo.');
        return;
      }

      if (formData.senha !== formData.confirmarSenha) {
        setMensagem('As senhas não coincidem!');
        return;
      }
    }

    setEtapa(etapa + 1);
  };

  const voltarEtapa = () => {
    setMensagem('');
    setEtapa(etapa - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensagem('');

    if (!formData.estado || !formData.cidade) {
      setMensagem('Preencha Estado e Cidade.');
      return;
    }

    if (!formData.aceitaTermos) {
      setMensagem('Você deve aceitar os Termos de Uso para prosseguir.');
      return;
    }

    const { aceitaTermos, confirmarSenha, ...dadosParaEnviar } = formData;

    const payload = {
      ...dadosParaEnviar,
      cpf: formData.cpf ? formData.cpf.replace(/\D/g, '') : null,
      cnpj: formData.cnpj ? formData.cnpj.replace(/\D/g, '') : null,
      telefone: formData.telefone ? formData.telefone.replace(/\D/g, '') : null,
    };

    try {
      await api.post('/auth/register', payload);
      navigate('/login', { state: { cadastroSucesso: true, emailCadastrado: formData.email } });
    } catch (error) {
      setMensagem(error.response?.data?.error || 'Erro ao realizar cadastro.');
    }
  };

  return (
    <div className="cadastro-page">
      <div className="cadastro-card">

        <div className="cadastro-steps">
          <span className={`cadastro-step ${etapa === 1 ? 'is-active' : ''}`}>1. Dados Pessoais</span>
          <span className={`cadastro-step ${etapa === 2 ? 'is-active' : ''}`}>2. Contato e Senha</span>
          <span className={`cadastro-step ${etapa === 3 ? 'is-active' : ''}`}>3. Localização</span>
        </div>

        <div className="cadastro-content">

          {mensagem && (
            <div className="cadastro-feedback is-error" role="alert">{mensagem}</div>
          )}

          {/* ETAPA 1: DADOS PESSOAIS */}
          {etapa === 1 && (
            <form onSubmit={proximaEtapa}>
              <h3 className="cadastro-title">1. Dados Pessoais</h3>

              <div className="cadastro-field">
                <label>Nome Completo *</label>
                <input name="nome_completo" value={formData.nome_completo} onChange={handleChange} required />
              </div>

              <div className="cadastro-field">
                <label>Tipo de Documento *</label>
                <div className="cadastro-radio-group">
                  <label className="cadastro-radio-option">
                    <input
                      type="radio"
                      name="tipoDoc"
                      value="cpf"
                      checked={tipoDocumento === 'cpf'}
                      onChange={() => {
                        setTipoDocumento('cpf');
                        setFormData({ ...formData, cpf: '', cnpj: '', passaporte: '' });
                      }}
                    /> CPF
                  </label>

                  <label className="cadastro-radio-option">
                    <input
                      type="radio"
                      name="tipoDoc"
                      value="cnpj"
                      checked={tipoDocumento === 'cnpj'}
                      onChange={() => {
                        setTipoDocumento('cnpj');
                        setFormData({ ...formData, cpf: '', cnpj: '', passaporte: '' });
                      }}
                    /> CNPJ
                  </label>

                  <label className="cadastro-radio-option">
                    <input
                      type="radio"
                      name="tipoDoc"
                      value="passaporte"
                      checked={tipoDocumento === 'passaporte'}
                      onChange={() => {
                        setTipoDocumento('passaporte');
                        setFormData({ ...formData, cpf: '', cnpj: '', passaporte: '' });
                      }}
                    /> Passaporte
                  </label>
                </div>

                {tipoDocumento === 'cpf' && (
                  <input
                    name="cpf"
                    value={formData.cpf || ''}
                    onChange={(e) => setFormData({ ...formData, cpf: mascaraDocumento(e.target.value) })}
                    required
                    placeholder="000.000.000-00"
                    maxLength={14}
                  />
                )}

                {tipoDocumento === 'cnpj' && (
                  <input
                    name="cnpj"
                    value={formData.cnpj || ''}
                    onChange={(e) => setFormData({ ...formData, cnpj: mascaraDocumento(e.target.value) })}
                    required
                    placeholder="00.000.000/0001-00"
                    maxLength={18}
                  />
                )}

                {tipoDocumento === 'passaporte' && (
                  <input
                    name="passaporte"
                    value={formData.passaporte || ''}
                    onChange={(e) => setFormData({ ...formData, passaporte: e.target.value.toUpperCase() })}
                    required
                    placeholder="Ex: CS123456"
                    maxLength={20}
                  />
                )}
              </div>

              <div className="cadastro-field">
                <label>Data de Nascimento *</label>
                <input type="date" name="data_nascimento" value={formData.data_nascimento} onChange={handleChange} required />
              </div>

              <div className="cadastro-actions">
                <button type="submit" className="btn btn-primary">Próximo →</button>
              </div>
            </form>
          )}

          {/* ETAPA 2: CONTATO E SENHA */}
          {etapa === 2 && (
            <form onSubmit={proximaEtapa}>
              <h3 className="cadastro-title">2. Contato e Senha</h3>

              <div className="cadastro-field">
                <label>E-mail *</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} required />
              </div>

              <div className="cadastro-field">
                <label>Telefone *</label>
                <input
                  name="telefone"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: mascaraTelefone(e.target.value) })}
                  required
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                />
              </div>

              <div className="cadastro-field">
                <label>Senha *</label>
                <input type="password" name="senha" value={formData.senha} onChange={handleChange} required />

                <ul className="cadastro-senha-checklist">
                  <li className={requisitosSenha(formData.senha).tamanho ? 'is-valido' : ''}>Mínimo 8 caracteres</li>
                  <li className={requisitosSenha(formData.senha).maiuscula ? 'is-valido' : ''}>Uma letra maiúscula</li>
                  <li className={requisitosSenha(formData.senha).minuscula ? 'is-valido' : ''}>Uma letra minúscula</li>
                  <li className={requisitosSenha(formData.senha).numero ? 'is-valido' : ''}>Um número</li>
                  <li className={requisitosSenha(formData.senha).especial ? 'is-valido' : ''}>Um caractere especial (!@#$%...)</li>
                </ul>
              </div>

              <div className="cadastro-field">
                <label>Confirme a Senha *</label>
                <input type="password" name="confirmarSenha" value={formData.confirmarSenha} onChange={handleChange} required />
              </div>

              <div className="cadastro-actions has-two">
                <button type="button" className="btn btn-secondary" onClick={voltarEtapa}>← Voltar</button>
                <button type="submit" className="btn btn-primary">Próximo →</button>
              </div>
            </form>
          )}

          {/* ETAPA 3: LOCALIZAÇÃO E ADICIONAIS */}
          {etapa === 3 && (
            <form onSubmit={handleSubmit}>
              <h3 className="cadastro-title">3. Localização e Dados Adicionais</h3>

              <div className="cadastro-field">
                <label>Estado *</label>
                <select
                  name="estado"
                  value={formData.estado}
                  onChange={(e) => {
                    handleChange(e);
                    setFormData(prev => ({ ...prev, estado: e.target.value, cidade: '' }));
                  }}
                  required
                >
                  <option value="">Selecione um Estado...</option>
                  {estados.map(uf => (
                    <option key={uf.id} value={uf.sigla}>
                      {uf.nome} ({uf.sigla})
                    </option>
                  ))}
                </select>
              </div>

              <div className="cadastro-field">
                <label>Cidade *</label>
                <select
                  name="cidade"
                  value={formData.cidade}
                  onChange={handleChange}
                  required
                  disabled={!formData.estado}
                >
                  <option value="">
                    {formData.estado ? 'Selecione uma Cidade...' : 'Selecione primeiro o Estado'}
                  </option>
                  {cidades.map(c => (
                    <option key={c.id} value={c.nome}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              </div>

              <fieldset className="cadastro-fieldset">
                <legend>Opcionais</legend>
                <div className="cadastro-field">
                  <label>Gênero (Opcional)</label>
                  <input name="genero" value={formData.genero} onChange={handleChange} placeholder="Ex: Cisgênero, Transgênero..." />
                </div>

                <div className="cadastro-field" style={{ marginBottom: 0 }}>
                  <label>Sexualidade (Opcional)</label>
                  <input name="sexualidade" value={formData.sexualidade} onChange={handleChange} placeholder="Ex: Heterossexual, Bissexual..." />
                </div>
              </fieldset>

              <label className="cadastro-checkbox-field">
                <input type="checkbox" name="aceitaTermos" checked={formData.aceitaTermos} onChange={handleChange} />
                Declaro que li e concordo com os TERMOS DE USO. *
              </label>

              <div className="cadastro-actions has-two">
                <button type="button" className="btn btn-secondary" onClick={voltarEtapa}>← Voltar</button>
                <button type="submit" className="btn btn-primary">Finalizar Cadastro</button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}