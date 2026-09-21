import { useEffect, useState } from 'react';

function restante(alvo) {
  const ms = alvo - new Date();
  if (ms <= 0) return null;
  return {
    dias: Math.floor(ms / 86400000),
    horas: Math.floor((ms / 3600000) % 24),
    minutos: Math.floor((ms / 60000) % 60),
    segundos: Math.floor((ms / 1000) % 60)
  };
}

// Contagem regressiva em blocos. Para leitores de tela, o texto completo só é
// anunciado a cada mudança de minuto (não a cada segundo).
export function Contagem({ dataAlvo }) {
  const alvo = new Date(dataAlvo);
  const [t, setT] = useState(() => restante(alvo));

  useEffect(() => {
    const id = setInterval(() => setT(restante(new Date(dataAlvo))), 1000);
    return () => clearInterval(id);
  }, [dataAlvo]);

  if (!t) return null;

  const blocos = [['dias', 'dias'], ['horas', 'horas'], ['minutos', 'min'], ['segundos', 'seg']];

  return (
    <div className="pb-contagem" role="timer" aria-label={`Faltam ${t.dias} dias, ${t.horas} horas e ${t.minutos} minutos`}>
      {blocos.map(([chave, rotulo]) => (
        <div className="pb-contagem-bloco" key={chave} aria-hidden="true">
          <strong>{String(t[chave]).padStart(2, '0')}</strong>
          <span>{rotulo}</span>
        </div>
      ))}
    </div>
  );
}
