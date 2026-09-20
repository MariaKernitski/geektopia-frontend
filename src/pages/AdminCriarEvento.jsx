import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { ConfirmModal } from '../components/ConfirmModal';
import { AvisoBox } from '../components/edicao/AvisoBox';
import { FormDados } from '../components/edicao/FormDados';
import { PASSOS_GUIADOS } from '../components/edicao/abas';
import { useAviso, mensagemDeErro } from '../hooks/useAviso';
import '../style/AdminEdicao.css';

// Passo 1 do assistente: cria a edição como RASCUNHO. A partir daqui a edição
// já existe no banco, e cada passo seguinte (ingressos, programação...) salva
// na hora dentro do painel da edição (AdminEdicao, modo guiado). Não há mais
// "tudo na memória até o último botão", que deixava evento pela metade quando
// uma das chamadas falhava.
export function AdminCriarEvento() {
  const navigate = useNavigate();
  const { tipo } = useParams();
  // Qualquer valor que não seja "principal" cai em Pocket, por segurança.
  const ehPrincipal = tipo === 'principal';
  const passos = PASSOS_GUIADOS[ehPrincipal ? 'Principal' : 'Pocket'];

  const { aviso, mostrar, limpar } = useAviso();
  const [enviando, setEnviando] = useState(false);
  const [principalAtual, setPrincipalAtual] = useState(null);
  const [pendente, setPendente] = useState(null); // dados aguardando a confirmação da troca de Principal

  useEffect(() => {
    if (!ehPrincipal) return;
    api.get('/geektopia/admin/todas')
      .then((res) => setPrincipalAtual(res.data.find((ev) => ev.tipo_edicao === 'Principal') || null))
      .catch(() => {}); // só informativo: se falhar, o aviso de troca simplesmente não aparece
  }, [ehPrincipal]);

  const criar = async ({ campos, foto }) => {
    limpar();
    setEnviando(true);

    const dados = new FormData();
    Object.entries(campos).forEach(([chave, valor]) => {
      if (valor !== '' && valor !== null) dados.append(chave, valor);
    });
    dados.append('tornar_principal', ehPrincipal ? 'true' : 'false');
    if (foto) dados.append('banner', foto);

    try {
      const res = await api.post('/geektopia', dados);
      const id = res.data.geektopia.id_geektopia;
      navigate(`/admin/eventos/${id}/${passos[1]}?guiado=1`, { replace: true });
    } catch (err) {
      mostrar('erro', mensagemDeErro(err, 'Não foi possível criar o evento. Tente de novo.'));
      setEnviando(false);
    }
  };

  // Trocar o Principal arquiva o atual: pede confirmação antes de fazer.
  const aoEnviar = async (dados) => {
    if (ehPrincipal && principalAtual) {
      setPendente(dados);
      return;
    }
    await criar(dados);
  };

  return (
    <div className="ed-pagina ed-pagina-estreita">
      <button type="button" className="btn btn-secondary ed-voltar" onClick={() => navigate('/admin/eventos/criar')}>
        ← Voltar
      </button>

      <header className="ed-cabecalho">
        <span className={`ed-selo ${ehPrincipal ? 'is-destaque' : ''}`}>
          {ehPrincipal ? '★ Geektopia Principal' : 'Edição Pocket'}
        </span>
        <h1 className="ed-titulo-pagina">Nova edição</h1>
        <p className="ed-passo">Passo 1 de {passos.length} · Dados do evento</p>
        <p className="ed-subtitulo">
          A edição é criada como <strong>rascunho</strong>: ninguém vê nada no site até você publicar.
          Depois deste passo você cadastra o restante, e tudo fica salvo a cada etapa.
        </p>
      </header>

      {ehPrincipal && principalAtual && (
        <div className="ed-nota" role="note">
          Já existe uma Principal: <strong>{principalAtual.nome_edicao}</strong>. Ao criar esta, ela vira a
          <strong> Principal anterior</strong> (edição passada). Continua editável no painel.
        </div>
      )}

      <div className="ed-painel">
        <AvisoBox aviso={aviso} />
        <FormDados rotuloEnvio="Criar rascunho e continuar →" onSubmit={aoEnviar} enviando={enviando} />
      </div>

      <ConfirmModal
        isOpen={pendente !== null}
        title="Trocar a Geektopia Principal?"
        message={`"${principalAtual?.nome_edicao}" vai virar a edição passada (Principal anterior) e esta nova será a Principal. Você poderá continuar editando a antiga.`}
        confirmLabel="Criar e trocar"
        onConfirm={() => { const dados = pendente; setPendente(null); criar(dados); }}
        onCancel={() => setPendente(null)}
      />
    </div>
  );
}
