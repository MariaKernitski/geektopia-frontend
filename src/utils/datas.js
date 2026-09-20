// Datas e valores do painel de edições.
//
// O servidor guarda um instante absoluto (ISO com "Z"). Os campos
// <input type="date|time|datetime-local"> trabalham no horário LOCAL do
// navegador. Estas funções fazem a ida e a volta entre os dois. Enviar sempre
// ISO completo (localParaIso) evita que o servidor interprete "10:00" no fuso
// dele e a hora mude de um lado para o outro.

const dois = (n) => String(n).padStart(2, '0');

function paraData(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

// '2030-05-01T13:00:00.000Z' -> '2030-05-01' (dia local)
export function paraInputData(iso) {
  const d = paraData(iso);
  return d ? `${d.getFullYear()}-${dois(d.getMonth() + 1)}-${dois(d.getDate())}` : '';
}

// -> '10:00' (hora local)
export function paraInputHora(iso) {
  const d = paraData(iso);
  return d ? `${dois(d.getHours())}:${dois(d.getMinutes())}` : '';
}

// -> '2030-05-01T10:00' (para <input type="datetime-local">)
export function paraInputDataHora(iso) {
  const d = paraData(iso);
  return d ? `${paraInputData(iso)}T${paraInputHora(iso)}` : '';
}

// '2030-05-01T10:00' (ou só '2030-05-01') local -> ISO absoluto. null se inválido.
export function localParaIso(valor) {
  if (!valor) return null;
  const d = new Date(valor.length === 10 ? `${valor}T00:00` : valor);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function formatarData(iso) {
  const d = paraData(iso);
  return d ? d.toLocaleDateString('pt-BR') : '';
}

export function formatarHora(iso) {
  const d = paraData(iso);
  return d ? d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';
}

export function formatarDataHora(iso) {
  const d = paraData(iso);
  return d ? `${formatarData(iso)} às ${formatarHora(iso)}` : '';
}

// 'sexta-feira, 01 de maio' — cabeçalho de dia na programação.
export function tituloDoDia(iso) {
  const d = paraData(iso);
  return d ? d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }) : '';
}

export function formatarMoeda(valor) {
  if (valor === null || valor === undefined || valor === '') return '—';
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
