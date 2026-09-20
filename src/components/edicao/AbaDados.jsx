import { useState } from 'react';
import api from '../../services/api';
import { useAviso, mensagemDeErro } from '../../hooks/useAviso';
import { AvisoBox } from './AvisoBox';
import { FormDados } from './FormDados';

export function AbaDados({ evento, recarregarEvento, marcarAlterado }) {
  const { aviso, mostrar, limpar } = useAviso();
  const [enviando, setEnviando] = useState(false);
  const [versao, setVersao] = useState(0); // troca a key do formulário depois de salvar

  const salvar = async ({ campos, foto }) => {
    limpar();
    setEnviando(true);
    try {
      await api.put(`/geektopia/${evento.id_geektopia}`, campos);

      if (foto) {
        const dados = new FormData();
        dados.append('banner', foto);
        await api.patch(`/geektopia/${evento.id_geektopia}/banner`, dados);
      }

      await recarregarEvento();
      marcarAlterado(false);
      setVersao((v) => v + 1);
      mostrar('sucesso', 'Dados salvos.');
    } catch (err) {
      mostrar('erro', mensagemDeErro(err, 'Não foi possível salvar os dados. Tente de novo.'));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <section className="ed-painel" aria-labelledby="t-dados">
      <h2 id="t-dados" className="ed-titulo">Dados do evento</h2>
      <AvisoBox aviso={aviso} />
      <FormDados
        key={versao}
        evento={evento}
        rotuloEnvio="Salvar alterações"
        onSubmit={salvar}
        onAlterado={marcarAlterado}
        enviando={enviando}
      />
    </section>
  );
}
