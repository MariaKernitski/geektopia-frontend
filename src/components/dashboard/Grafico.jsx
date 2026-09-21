import { useEffect, useRef } from 'react';
import {
  ArcElement, BarController, BarElement, CategoryScale, Chart, DoughnutController, Filler, Legend, LinearScale, LineController, LineElement, PointElement, Tooltip
} from 'chart.js';

Chart.register(ArcElement, BarController, BarElement, CategoryScale, DoughnutController, Filler, Legend, LinearScale, LineController, LineElement, PointElement, Tooltip);

// eslint-disable-next-line react-refresh/only-export-components
export const PALETA = ['#f5c22b', '#0e7c86', '#e4572e', '#6a4c93', '#2e933c', '#1982c4', '#8d99ae', '#c9184a', '#b8860b', '#3d405b'];

// Desenha um gráfico do Chart.js (biblioteca gratuita, MIT). Recria quando os dados mudam e limpa ao sair.
//   tipo     'bar' | 'barH' (barras horizontais) | 'line' | 'doughnut'
//   rotulos  nomes; series [{ nome, valores, cor? }]
export function Grafico({ tipo, rotulos, series, descricao, formatar = (v) => v }) {
  const canvas = useRef(null);
  const formatador = useRef(formatar);
  useEffect(() => { formatador.current = formatar; }, [formatar]);
  // Os dados chegam como objetos novos a cada desenho da tela; a assinatura evita recriar o gráfico sem necessidade.
  const assinatura = JSON.stringify([tipo, rotulos, series]);

  useEffect(() => {
    if (!canvas.current) return undefined;
    const rosca = tipo === 'doughnut';
    const linha = tipo === 'line';
    const config = {
      type: tipo === 'barH' ? 'bar' : tipo,
      data: {
        labels: rotulos,
        datasets: series.map((s, i) => ({
          label: s.nome,
          data: s.valores,
          backgroundColor: rosca ? rotulos.map((_, k) => PALETA[k % PALETA.length]) : linha ? `${s.cor || PALETA[i]}33` : s.cor || PALETA[i],
          borderColor: rosca ? '#ffffff' : s.cor || PALETA[i],
          borderWidth: rosca ? 2 : linha ? 2 : 0,
          borderRadius: rosca || linha ? 0 : 4,
          fill: linha,
          tension: 0.3,
          pointRadius: linha ? 2 : 0
        }))
      },
      options: {
        indexAxis: tipo === 'barH' ? 'y' : 'x',
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 250 },
        plugins: {
          legend: { display: rosca || series.length > 1, position: 'bottom' },
          tooltip: { callbacks: { label: (c) => `${c.dataset.label ? `${c.dataset.label}: ` : ''}${formatador.current(tipo === 'barH' ? c.parsed.x : tipo === 'doughnut' ? c.parsed : c.parsed.y)}` } }
        },
        scales: rosca ? {} : { x: { grid: { display: false }, ticks: { maxRotation: 45 } }, y: { beginAtZero: true, ticks: { precision: 0 } } }
      }
    };
    const grafico = new Chart(canvas.current, config);
    return () => grafico.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assinatura]);

  return <div className="dash-grafico"><canvas ref={canvas} role="img" aria-label={descricao} /></div>;
}
