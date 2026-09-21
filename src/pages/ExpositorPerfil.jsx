import { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AvisoBox } from '../components/edicao/AvisoBox';
import { ImagemUpload } from '../components/edicao/ImagemUpload';
import { avisoDaTela, useCarga } from '../hooks/useCarga';
import { useAviso, mensagemDeErro } from '../hooks/useAviso';
import '../style/AdminEdicao.css';
import '../style/Parceiro.css';

const TIPOS_SUGERIDOS = ['Loja', 'Artista independente', 'Artesanato', 'Editora / quadrinhos', 'Comunidade / grupo', 'Alimentação', 'Outro'];

export function ExpositorPerfil() {
  const buscar = useCallback(() => api.get('/parceiros/meu-perfil').then((r) => r.data.papeis?.expositor || null), []);
  const { dados, erro, carregando } = useCarga(buscar);

  if (carregando) return <div className="ed-pagina ed-pagina-estreita"><p className="ed-vazio">Carregando...</p></div>;

  // O formulário só monta depois de saber se já existe perfil: assim o estado
  // inicial dele nasce completo, sem sincronizar por efeito.
  return <FormularioPerfil expositor={dados} erroCarga={erro} />;
}

function FormularioPerfil({ expositor, erroCarga }) {
  const navigate = useNavigate();
  const { aviso, mostrar, limpar } = useAviso();
  const editando = Boolean(expositor);

  const [form, setForm] = useState({
    nome_loja_projeto: expositor?.nome_loja_projeto || '',
    tipo_expositor: expositor?.tipo_expositor || '',
    url_portfolio: expositor?.url_portfolio || ''
  });
  const [logo, setLogo] = useState(null);
  const [erros, setErros] = useState({});
  const [enviando, setEnviando] = useState(false);

  const alterar = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErros((er) => ({ ...er, [e.target.name]: undefined }));
  };

  const salvar = async (e) => {
    e.preventDefault();
    limpar();

    const novos = {};
    if (!form.nome_loja_projeto.trim()) novos.nome_loja_projeto = 'Informe o nome da sua loja ou projeto.';
    if (!form.url_portfolio.trim()) novos.url_portfolio = 'Informe o link do seu portfólio ou rede social: é com ele que a organização avalia a sua loja.';
    else if (!/^https?:\/\//i.test(form.url_portfolio.trim())) {
      novos.url_portfolio = 'O link deve começar com http:// ou https:// (ex.: https://instagram.com/sualoja).';
    }
    setErros(novos);
    if (Object.keys(novos).length) {
      document.getElementById(`p-${Object.keys(novos)[0]}`)?.focus();
      return;
    }

    const corpo = {
      nome_loja_projeto: form.nome_loja_projeto.trim(),
      tipo_expositor: form.tipo_expositor.trim() || null,
      url_portfolio: form.url_portfolio.trim()
    };

    setEnviando(true);
    try {
      const res = editando ? await api.put('/parceiros/expositor', corpo) : await api.post('/parceiros/expositor', corpo);

      let mensagem = res.data.message;
      if (logo) {
        try {
          const dados = new FormData();
          dados.append('logo', logo);
          await api.patch('/parceiros/expositor/logo', dados);
        } catch (err) {
          // O perfil já foi salvo: não perdemos isso por causa da imagem.
          mensagem = `${mensagem} Mas a logo não foi enviada: ${mensagemDeErro(err, 'tente de novo.')}`;
        }
      }
      navigate('/expositor', { state: { sucesso: mensagem } });
    } catch (err) {
      mostrar('erro', mensagemDeErro(err, 'Não foi possível salvar o perfil.'));
      setEnviando(false);
    }
  };

  const campoErro = (n) => erros[n] && <p className="ed-erro-campo" id={`erro-p-${n}`} role="alert">{erros[n]}</p>;
  const aria = (n) => (erros[n] ? { 'aria-invalid': true, 'aria-describedby': `erro-p-${n}` } : {});

  return (
    <div className="ed-pagina ed-pagina-estreita">
      <Link to="/expositor" className="btn btn-secondary ed-voltar">← Área do expositor</Link>

      <h1 className="ed-titulo-pagina">{editando ? 'Perfil de expositor' : 'Criar perfil de expositor'}</h1>
      <p className="ed-subtitulo" style={{ marginBottom: 20 }}>
        Estas informações (com a logo, o link de portfólio e o seu e-mail e telefone do cadastro) ajudam a diretoria a avaliar o seu pedido. Se você for confirmado, a logo e o link aparecem na página da edição.
      </p>

      <div className="ed-painel">
        <AvisoBox aviso={avisoDaTela(aviso, erroCarga)} />
        <form onSubmit={salvar} className="ed-form" noValidate>
          <div className="ed-campo">
            <label htmlFor="p-nome_loja_projeto">Nome da loja ou projeto *</label>
            <input id="p-nome_loja_projeto" name="nome_loja_projeto" value={form.nome_loja_projeto} onChange={alterar} maxLength={100} {...aria('nome_loja_projeto')} />
            {campoErro('nome_loja_projeto')}
          </div>

          <div className="ed-campo">
            <label htmlFor="p-tipo_expositor">Tipo de expositor</label>
            <input id="p-tipo_expositor" name="tipo_expositor" value={form.tipo_expositor} onChange={alterar} maxLength={50} list="tipos-expositor" placeholder="Escolha ou digite" />
            <datalist id="tipos-expositor">{TIPOS_SUGERIDOS.map((t) => <option key={t} value={t} />)}</datalist>
          </div>

          <div className="ed-campo">
            <label htmlFor="p-url_portfolio">Link do portfólio ou rede social *</label>
            <input id="p-url_portfolio" name="url_portfolio" type="url" value={form.url_portfolio} onChange={alterar} placeholder="https://..." {...aria('url_portfolio')} />
            {campoErro('url_portfolio')}
            <small className="ed-ajuda">Ajuda a diretoria a conhecer o seu trabalho. Se você for confirmado, este link aparece no site.</small>
          </div>

          <ImagemUpload
            rotulo="Logo"
            formato="quadrada"
            urlAtual={expositor?.url_logo}
            arquivo={logo}
            onEscolher={setLogo}
            ajuda="Aparece no carrossel de expositores. Fundo transparente ou claro funciona melhor. JPEG, PNG ou WEBP, até 15MB."
          />

          <div className="ed-acoes ed-acoes-esquerda">
            <button type="submit" className="btn btn-primary" disabled={enviando}>
              {enviando ? 'Salvando...' : editando ? 'Salvar perfil' : 'Criar perfil'}
            </button>
            <Link to="/expositor" className="btn btn-secondary">Cancelar</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
