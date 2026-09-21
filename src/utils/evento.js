// Formatação de eventos para as páginas públicas (datas, horário, mapa, categorias).

export const CATEGORIAS = [
  { chave: 'Inteira', rotulo: 'Inteira', dica: '' },
  { chave: 'Meia', rotulo: 'Meia-entrada', dica: 'Os documentos que comprovam o direito à meia-entrada são conferidos na entrada do evento.' },
  { chave: 'MeetGreet', rotulo: 'Meet & Greet', dica: 'Encontro exclusivo com os convidados. Vagas limitadas.' },
  { chave: 'MeiaSolidaria', rotulo: 'Meia solidária', dica: '' },
  { chave: 'Outro', rotulo: 'Outros', dica: '' }
];

export const ROTULO_CATEGORIA = Object.fromEntries(CATEGORIAS.map((c) => [c.chave, c.rotulo]));

const paraData = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
};

const mesLongo = (d) => d.toLocaleDateString('pt-BR', { month: 'long' });
const mesmoDia = (a, b) => a.toDateString() === b.toDateString();

// "22 e 23 de agosto de 2027" | "31 de outubro de 2026" | "30 de outubro a 2 de novembro de 2026"
export function periodoEvento(inicio, fim) {
  const i = paraData(inicio);
  if (!i) return 'Data a definir';
  const f = paraData(fim);

  if (!f || mesmoDia(i, f)) return `${i.getDate()} de ${mesLongo(i)} de ${i.getFullYear()}`;
  if (i.getMonth() === f.getMonth() && i.getFullYear() === f.getFullYear()) {
    const consecutivos = f.getDate() - i.getDate() === 1;
    return `${i.getDate()}${consecutivos ? ' e ' : ' a '}${f.getDate()} de ${mesLongo(i)} de ${i.getFullYear()}`;
  }
  return `${i.getDate()} de ${mesLongo(i)} a ${f.getDate()} de ${mesLongo(f)} de ${f.getFullYear()}`;
}

// 10h | 10h30
export function horaCurta(iso) {
  const d = paraData(iso);
  if (!d) return '';
  const m = d.getMinutes();
  return `${d.getHours()}h${m ? String(m).padStart(2, '0') : ''}`;
}

// "das 10h às 20h" | "a partir das 10h" | ''
export function horarioEvento(inicio, fim) {
  const i = paraData(inicio);
  if (!i) return '';
  const f = paraData(fim);
  if (f && mesmoDia(i, f) && f > i) return `das ${horaCurta(inicio)} às ${horaCurta(fim)}`;
  return `a partir das ${horaCurta(inicio)}`;
}

// { dia: '31', mes: 'out' }: selo de calendário nos cartões
export function seloDeData(iso) {
  const d = paraData(iso);
  if (!d) return null;
  return { dia: String(d.getDate()).padStart(2, '0'), mes: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '') };
}

export function tituloDoDia(iso) {
  const d = paraData(iso);
  return d ? d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }) : '';
}

export const chaveDoDia = (iso) => {
  const d = paraData(iso);
  return d ? `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` : '';
};

// Busca o endereço no Google Maps (link comum, sem chave de API).
// O evento é sempre em Ponta Grossa/PR: acrescentamos a cidade à busca (quando o
// endereço não a menciona) para o mapa nunca cair em outra cidade de mesmo nome de rua.
export const linkMapa = (local) => {
  if (!local) return null;
  const jaTemCidade = /ponta\s+grossa/i.test(local);
  const consulta = jaTemCidade ? local : `${local}, Ponta Grossa, Paraná, Brasil`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(consulta)}`;
};

export const moeda = (v) => (v === null || v === undefined ? '' : Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));

// O evento já aconteceu (ou foi marcado como encerrado)?
export function eventoPassou(evento) {
  if (evento.status_evento === 'Encerrado') return true;
  const fim = paraData(evento.data_fim) || paraData(evento.data_inicio);
  return Boolean(fim && fim < new Date());
}
