import { useCallback, useEffect, useState } from 'react';
import api from '../services/api';
import { useCarga } from '../hooks/useCarga';
import { eventoPassou } from '../utils/evento';

function calcularTempoRestante(dataAlvo) {
  const diferenca = dataAlvo - new Date();
  if (diferenca <= 0) return { dias: 0, horas: 0, minutos: 0, segundos: 0, encerrado: true };
  return {
    dias: Math.floor(diferenca / (1000 * 60 * 60 * 24)),
    horas: Math.floor((diferenca / (1000 * 60 * 60)) % 24),
    minutos: Math.floor((diferenca / (1000 * 60)) % 60),
    segundos: Math.floor((diferenca / 1000) % 60),
    encerrado: false
  };
}

const doisDigitos = (n) => String(n).padStart(2, '0');

function Contador({ dataAlvo }) {
  const [tempo, setTempo] = useState(() => calcularTempoRestante(dataAlvo));

  useEffect(() => {
    const intervalo = setInterval(() => setTempo(calcularTempoRestante(dataAlvo)), 1000);
    return () => clearInterval(intervalo);
  }, [dataAlvo]);

  if (tempo.encerrado) return <span className="cronometro">O evento já começou!</span>;

  return (
    <span className="cronometro">
      Faltam <strong>{tempo.dias}</strong>d <strong>{doisDigitos(tempo.horas)}</strong>h{' '}
      <strong>{doisDigitos(tempo.minutos)}</strong>m <strong>{doisDigitos(tempo.segundos)}</strong>s para a Geektopia!
    </span>
  );
}

// Contagem regressiva para a Geektopia Principal REAL (a data vem do cadastro da
// edição, não fica fixa no código). Sem edição vigente ou com a edição já
// encerrada, no lugar do cronômetro mostra o ano previsto da próxima.
export function Cronometro() {
  const buscar = useCallback(() => api.get('/geektopia/vitrine').then((r) => r.data), []);
  const { dados, carregando } = useCarga(buscar);

  if (carregando) return <span className="cronometro">&nbsp;</span>;

  const edicao = dados?.destaque;
  if (edicao?.data_inicio && !eventoPassou(edicao)) {
    return <Contador dataAlvo={new Date(edicao.data_inicio)} />;
  }

  // A Geektopia é anual: se este ano já teve (ou ainda não há edição futura), a próxima é no ano que vem.
  const ano = dados?.proxima_edicao_ano || new Date().getFullYear() + 1;
  return <span className="cronometro">A próxima Geektopia chega em <strong>{ano}</strong>. Data em breve!</span>;
}
