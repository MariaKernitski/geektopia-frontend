import { useEffect, useState } from 'react';

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

// props: dataAlvo (obrigatório) — instância de Date do momento que o cronômetro deve atingir
export function Cronometro({ dataAlvo }) {
  const [tempo, setTempo] = useState(() => calcularTempoRestante(dataAlvo));

  useEffect(() => {
    const intervalo = setInterval(() => {
      setTempo(calcularTempoRestante(dataAlvo));
    }, 1000);

    // limpa o intervalo quando o componente sai da tela,
    // senão ele continua rodando escondido e vaza memória
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