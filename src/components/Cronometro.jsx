import { useEffect, useState } from 'react';

const DATA_PROXIMO_EVENTO = new Date('2027-08-22T09:00:00-03:00');

function calcularTempoRestante(dataAlvo) {
  const diferenca = dataAlvo - new Date();

  if (diferenca <= 0) {
    return { dias: 0, horas: 0, minutos: 0, segundos: 0, encerrado: true };
  }

  return {
    dias: Math.floor(diferenca / (1000 * 60 * 60 * 24)),
    horas: Math.floor((diferenca / (1000 * 60 * 60)) % 24),
    minutos: Math.floor((diferenca / (1000 * 60)) % 60),
    segundos: Math.floor((diferenca / 1000) % 60),
    encerrado: false
  };
}

// dataAlvo é opcional — se não passar nada, usa DATA_PROXIMO_EVENTO por padrão
export function Cronometro({ dataAlvo = DATA_PROXIMO_EVENTO }) {
  const [tempo, setTempo] = useState(() => calcularTempoRestante(dataAlvo));

  useEffect(() => {
    const intervalo = setInterval(() => {
      setTempo(calcularTempoRestante(dataAlvo));
    }, 1000);

    return () => clearInterval(intervalo);
  }, [dataAlvo]);

  if (tempo.encerrado) {
    return <span className="cronometro">O evento já começou! 🎉</span>;
  }

  const doisDigitos = (n) => String(n).padStart(2, '0');

  return (
    <span className="cronometro">
      Faltam <strong>{tempo.dias}</strong>d{' '}
      <strong>{doisDigitos(tempo.horas)}</strong>h{' '}
      <strong>{doisDigitos(tempo.minutos)}</strong>m{' '}
      <strong>{doisDigitos(tempo.segundos)}</strong>s{' '}
      para o próximo evento Geektopia!
    </span>
  );
}