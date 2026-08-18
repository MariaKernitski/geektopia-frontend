import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

// Aplica máscara (00) 00000-0000 ou (00) 0000-0000
const mascaraTelefone = (v) => {
  v = v.replace(/\D/g, '');
  if (v.length > 11) v = v.slice(0, 11);
  if (v.length > 10) return v.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
  if (v.length > 6) return v.replace(/^(\d{2})(\d{4})(\d{0,4})$/, '($1) $2-$3');
  if (v.length > 2) return v.replace(/^(\d{2})(\d{0,5})$/, '($1) $2');
  return v;
};

// Aplica máscara automática dependendo do tamanho (CPF ou CNPJ)
const mascaraDocumento = (v) => {
  const apenasDigitos = v.replace(/\D/g, '');
  
  if (apenasDigitos.length <= 11) {
    // CPF
    return apenasDigitos
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  } else {
    // CNPJ
    return apenasDigitos
      .slice(0, 14)
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
};

export function Cadastro() {
  const [tipoDocumento, setTipoDocumento] = useState('cpf'); // 'cpf' | 'cnpj' | 'passaporte'
  const navigate = useNavigate();
  const [etapa, setEtapa] = useState(1);
  const [mensagem, setMensagem] = useState('');

  const [estados, setEstados] = useState([]);
  const [cidades, setCidades] = useState([]);

  // Declarado antes dos useEffects
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

  // 1. Busca todos os Estados do Brasil ao abrir a tela
  useEffect(() => {
    fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome')
      .then(res => res.json())
      .then(data => setEstados(data))
      .catch(err => console.error('Erro ao buscar estados:', err));
  }, []);

  // 2. Busca as Cidades sempre que o usuário trocar de Estado
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

  // Verificação dinâmica de acordo com a opção selecionada nos radio buttons
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

  // 1. Remove os campos que não existem na tabela do banco
  const { aceitaTermos, confirmarSenha, ...dadosParaEnviar } = formData;

  // 2. Limpa os caracteres especiais
  const payload = {
    ...dadosParaEnviar,
    cpf: formData.cpf ? formData.cpf.replace(/\D/g, '') : null,
    cnpj: formData.cnpj ? formData.cnpj.replace(/\D/g, '') : null,
    telefone: formData.telefone ? formData.telefone.replace(/\D/g, '') : null,
  };

  try {
    const response = await api.post('/auth/register', payload);
    alert(response.data.message || 'Cadastro realizado com sucesso!');
    navigate('/');
  } catch (error) {
    setMensagem(error.response?.data?.error || 'Erro ao realizar cadastro.');
  }
};

  return (
    <div style={{ maxWidth: '500px', margin: '30px auto', padding: '20px', border: '1px solid #444', borderRadius: '8px' }}>
      
      {/* Indicador de Abas */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid #555', paddingBottom: '10px' }}>
        <span style={{ fontWeight: etapa === 1 ? 'bold' : 'normal', color: etapa === 1 ? '#ffd700' : '#ccc' }}>1. Dados Pessoais</span>
        <span style={{ fontWeight: etapa === 2 ? 'bold' : 'normal', color: etapa === 2 ? '#ffd700' : '#ccc' }}>2. Contato e Senha</span>
        <span style={{ fontWeight: etapa === 3 ? 'bold' : 'normal', color: etapa === 3 ? '#ffd700' : '#ccc' }}>3. Localização</span>
      </div>

      {mensagem && <p style={{ color: '#ff6b6b' }}><strong>{mensagem}</strong></p>}
        
      {/* ETAPA 1: DADOS PESSOAIS */}
      {etapa === 1 && (
        <form onSubmit={proximaEtapa}>
          <h3>1. Dados Pessoais</h3>
          <div>
            <label>Nome Completo *</label><br />
            <input name="nome_completo" value={formData.nome_completo} onChange={handleChange} required style={{ width: '100%' }} />
          </div><br />

        <div>
        <label>Tipo de Documento *</label>
        <div style={{ display: 'flex', gap: '15px', margin: '10px 0' }}>
            <label style={{ cursor: 'pointer' }}>
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

            <label style={{ cursor: 'pointer' }}>
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

            <label style={{ cursor: 'pointer' }}>
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

        {/* Input Dinâmico de acordo com a seleção */}
        {tipoDocumento === 'cpf' && (
            <input
            name="cpf"
            value={formData.cpf || ''}
            onChange={(e) => setFormData({ ...formData, cpf: mascaraDocumento(e.target.value) })}
            required
            placeholder="000.000.000-00"
            maxLength={14}
            style={{ width: '100%' }}
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
            style={{ width: '100%' }}
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
            style={{ width: '100%' }}
            />
        )}
        </div><br />

          <div>
            <label>Data de Nascimento *</label><br />
            <input type="date" name="data_nascimento" value={formData.data_nascimento} onChange={handleChange} required style={{ width: '100%' }} />
          </div><br />

          <button type="submit">Próximo &rarr;</button>
        </form>
      )}

      {/* ETAPA 2: CONTATO E SENHA */}
      {etapa === 2 && (
        <form onSubmit={proximaEtapa}>
          <h3>2. Contato e Senha</h3>
          <div>
            <label>E-mail *</label><br />
            <input type="email" name="email" value={formData.email} onChange={handleChange} required style={{ width: '100%' }} />
          </div><br />

          <div>
            <label>Telefone *</label><br />
            <input name="telefone" value={formData.telefone} onChange={(e) => setFormData({ ...formData, telefone: mascaraTelefone(e.target.value) })} required placeholder="(00) 00000-0000" maxLength={15} style={{ width: '100%' }} />
          </div><br />

          <div>
            <label>Senha *</label><br />
            <input type="password" name="senha" value={formData.senha} onChange={handleChange} required style={{ width: '100%' }} />
          </div><br />

          <div>
            <label>Confirme a Senha *</label><br />
            <input type="password" name="confirmarSenha" value={formData.confirmarSenha} onChange={handleChange} required style={{ width: '100%' }} />
          </div><br />

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={voltarEtapa}>&larr; Voltar</button>
            <button type="submit">Próximo &rarr;</button>
          </div>
        </form>
      )}

      {/* ETAPA 3: LOCALIZAÇÃO E ADICIONAIS */}
      {etapa === 3 && (
        <form onSubmit={handleSubmit}>
          <h3>3. Localização e Dados Adicionais</h3>

          <div>
            <label>Estado *</label><br />
            <select 
              name="estado" 
              value={formData.estado} 
              onChange={(e) => {
                handleChange(e);
                setFormData(prev => ({ ...prev, estado: e.target.value, cidade: '' }));
              }} 
              required 
              style={{ width: '100%', padding: '8px' }}
            >
              <option value="">Selecione um Estado...</option>
              {estados.map(uf => (
                <option key={uf.id} value={uf.sigla}>
                    {uf.nome} ({uf.sigla})
                </option>
              ))}
            </select>
          </div><br />

          <div>
            <label>Cidade *</label><br />
            <select 
              name="cidade" 
              value={formData.cidade} 
              onChange={handleChange} 
              required 
              disabled={!formData.estado}
              style={{ width: '100%', padding: '8px' }}
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
          </div><br />

          <fieldset style={{ padding: '10px', marginBottom: '15px' }}>
            <legend>Opcionais</legend>
            <div>
              <label>Gênero (Opcional)</label><br />
              <input name="genero" value={formData.genero} onChange={handleChange} placeholder="Ex: Cisgênero, Transgênero..." style={{ width: '100%' }} />
            </div><br />

            <div>
              <label>Sexualidade (Opcional)</label><br />
              <input name="sexualidade" value={formData.sexualidade} onChange={handleChange} placeholder="Ex: Heterossexual, Bissexual..." style={{ width: '100%' }} />
            </div>
          </fieldset>

          <div>
            <label>
              <input type="checkbox" name="aceitaTermos" checked={formData.aceitaTermos} onChange={handleChange} />
              {' '}Declaro que li e concordo com os TERMOS DE USO. *
            </label>
          </div><br />

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={voltarEtapa}>&larr; Voltar</button>
            <button type="submit" style={{ backgroundColor: '#ffd700', color: '#000', fontWeight: 'bold' }}>FINALIZAR CADASTRO</button>
          </div>
        </form>
      )}

    </div>
  );
}