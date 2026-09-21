import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { FiAlertTriangle, FiArrowLeft, FiCamera, FiCheckCircle, FiClock, FiSearch, FiXCircle } from 'react-icons/fi';
import api from '../services/api';
import { useCarga } from '../hooks/useCarga';
import { formatarData, formatarDataHora } from '../utils/datas';
import { mascaraCpf } from '../utils/mascaras';
import { idadeEmAnos } from '../utils/validacao';
import '../style/Checkin.css';

const ID_LEITOR = 'leitor-qr';
// Para a câmera sem nunca lançar erro: a biblioteca pode recusar `stop()` (síncrono) se já parou, e um erro aqui derrubaria a tela toda.
const pararLeitor = async (l) => {
  try { await l.stop(); } catch { /* já estava parado */ }
  try { l.clear(); } catch { /* nada a limpar */ }
};
const docFormatado = (d) => (/^\d{11}$/.test(d || '') ? `CPF ${mascaraCpf(d)}` : d ? `Documento ${d}` : 'Sem documento informado');

// Portaria: lê o QR code do ingresso (câmera) ou aceita o código digitado, mostra quem é o
// titular e a situação, e só dá baixa quando a pessoa da portaria confirma.
export function AdminCheckin() {
  const buscarEdicoes = useCallback(() => api.get('/geektopia/admin/todas').then((r) => r.data.filter((e) => e.status_evento !== 'Bloqueado')), []);
  const { dados: edicoes } = useCarga(buscarEdicoes);

  const [edicao, setEdicao] = useState(''); // '' = qualquer edição
  const [camera, setCamera] = useState(false);
  const [erroCamera, setErroCamera] = useState('');
  const [codigo, setCodigo] = useState('');
  const [resultado, setResultado] = useState(null); // { tipo, ingresso?, texto }
  const [confirmando, setConfirmando] = useState(false);
  const [historico, setHistorico] = useState([]);
  const leitor = useRef(null);
  const ocupado = useRef(false);

  const consultar = useCallback(async (texto) => {
    const c = String(texto || '').trim();
    if (!c || ocupado.current) return;
    ocupado.current = true;
    try {
      const res = await api.get(`/ingressos/codigo/${encodeURIComponent(c)}`);
      const ing = res.data.ingresso;
      if (ing.status_ingresso === 'Utilizado') setResultado({ tipo: 'usado', ingresso: ing, texto: `Já utilizado em ${formatarDataHora(ing.data_checkin)}.` });
      else if (ing.status_ingresso === 'Cancelado') setResultado({ tipo: 'cancelado', ingresso: ing, texto: 'Ingresso cancelado. Não libere a entrada.' });
      else setResultado({ tipo: 'valido', ingresso: ing, texto: 'Ingresso válido.' });
    } catch (err) {
      setResultado({ tipo: 'invalido', texto: err.response?.status === 404 ? 'QR code inválido: este ingresso não existe.' : (err.response?.data?.error || 'Não foi possível consultar o ingresso.') });
    } finally {
      ocupado.current = false;
    }
  }, []);

  // Câmera: liga/desliga junto com o botão; ao ler um QR, para a câmera e mostra o resultado.
  useEffect(() => {
    if (!camera) return undefined;
    let ativo = true;
    let l = null;
    try {
      l = new Html5Qrcode(ID_LEITOR);
      leitor.current = l;
      l.start({ facingMode: 'environment' }, { fps: 10, qrbox: { width: 240, height: 240 } }, (texto) => {
        if (!ativo) return;
        ativo = false;
        pararLeitor(l).finally(() => { setCamera(false); consultar(texto); });
      }, () => {}).catch(() => { if (ativo) { setErroCamera('Não foi possível abrir a câmera. Permita o acesso ou digite o código.'); setCamera(false); } });
    } catch {
      Promise.resolve().then(() => { setErroCamera('Não foi possível abrir a câmera. Permita o acesso ou digite o código.'); setCamera(false); });
    }
    return () => { ativo = false; if (l) pararLeitor(l); };
  }, [camera, consultar]);

  const ligarCamera = () => { setErroCamera(''); setResultado(null); setCamera(true); };

  const confirmar = async () => {
    if (!resultado?.ingresso) return;
    setConfirmando(true);
    try {
      const res = await api.patch('/ingressos/checkin', { codigo_qr: resultado.ingresso.codigo_qr });
      const ing = res.data.ingresso;
      setResultado({ tipo: 'liberado', ingresso: ing, texto: 'Entrada liberada!' });
      setHistorico((h) => [{ id: ing.id_ingresso, nome: ing.nome_titular, hora: new Date() }, ...h].slice(0, 8));
    } catch (err) {
      const ing = err.response?.data?.ingresso;
      setResultado({ tipo: err.response?.status === 409 ? 'usado' : 'invalido', ingresso: ing, texto: err.response?.data?.error || 'Não foi possível liberar a entrada.' });
    } finally {
      setConfirmando(false);
    }
  };

  const proximo = () => { setResultado(null); setCodigo(''); };
  const outraEdicao = resultado?.ingresso && edicao && String(resultado.ingresso.geektopia.id_geektopia) !== edicao;

  const ing = resultado?.ingresso;
  const idade = ing?.data_nascimento_titular ? idadeEmAnos(String(ing.data_nascimento_titular).slice(0, 10)) : null;
  const ICONES = { valido: FiCheckCircle, liberado: FiCheckCircle, usado: FiClock, cancelado: FiXCircle, invalido: FiXCircle };
  const Icone = resultado ? ICONES[resultado.tipo] : null;

  return (
    <div className="ck-portaria">
      <Link to="/admin" className="btn btn-secondary ed-voltar"><FiArrowLeft aria-hidden="true" /> Painel</Link>
      <h1>Check-in de ingressos</h1>
      <p className="ck-p-sub">Leia o QR code do ingresso, confira o documento de quem chegou e confirme a entrada.</p>

      <div className="ck-p-campo">
        <label htmlFor="ck-edicao">Evento desta portaria</label>
        <select id="ck-edicao" value={edicao} onChange={(e) => setEdicao(e.target.value)}>
          <option value="">Qualquer edição</option>
          {(edicoes ?? []).map((e) => <option key={e.id_geektopia} value={e.id_geektopia}>{e.nome_edicao}</option>)}
        </select>
        <small>Se um ingresso de outra edição for lido, você é avisado.</small>
      </div>

      <div className="ck-p-leitor">
        <div id={ID_LEITOR} className={camera ? 'is-ativo' : ''} />
        {!camera && !resultado && <p className="ck-p-dica"><FiCamera aria-hidden="true" /> A câmera está desligada.</p>}
        {erroCamera && <p className="ck-p-erro" role="alert">{erroCamera}</p>}
        <div className="ck-p-botoes">
          {camera
            ? <button type="button" className="btn btn-secondary" onClick={() => setCamera(false)}>Desligar a câmera</button>
            : <button type="button" className="btn btn-primary" onClick={ligarCamera}><FiCamera aria-hidden="true" /> Ler QR code com a câmera</button>}
        </div>
      </div>

      <form className="ck-p-manual" onSubmit={(e) => { e.preventDefault(); setResultado(null); consultar(codigo); }}>
        <label htmlFor="ck-codigo">Ou digite o código do ingresso</label>
        <div>
          <input id="ck-codigo" value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="GT-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" autoComplete="off" spellCheck="false" />
          <button type="submit" className="btn btn-secondary" disabled={!codigo.trim()}><FiSearch aria-hidden="true" /> Consultar</button>
        </div>
      </form>

      {resultado && (
        <section className={`ck-p-resultado is-${resultado.tipo}`} aria-live="assertive">
          <header>
            <Icone aria-hidden="true" />
            <div>
              <strong>{{ valido: 'VÁLIDO', liberado: 'ENTRADA LIBERADA', usado: 'JÁ UTILIZADO', cancelado: 'CANCELADO', invalido: 'INVÁLIDO' }[resultado.tipo]}</strong>
              <span>{resultado.texto}</span>
            </div>
          </header>

          {outraEdicao && <p className="ck-p-alerta"><FiAlertTriangle aria-hidden="true" /> Este ingresso é de outra edição: <strong>{ing.geektopia.nome_edicao}</strong>.</p>}

          {ing && (
            <dl className="ck-p-dados">
              <div><dt>Titular</dt><dd>{ing.nome_titular}</dd></div>
              <div><dt>Documento</dt><dd>{docFormatado(ing.documento_titular)}</dd></div>
              <div><dt>Nascimento</dt><dd>{ing.data_nascimento_titular ? `${formatarData(ing.data_nascimento_titular)}${idade !== null ? ` (${idade} anos)` : ''}` : 'Não informado'}</dd></div>
              <div><dt>Ingresso</dt><dd>{ing.lote.nome_lote}</dd></div>
              <div><dt>Evento</dt><dd>{ing.geektopia.nome_edicao}</dd></div>
              {ing.idade_minima ? <div><dt>Classificação</dt><dd>{ing.idade_minima}+ anos</dd></div> : null}
            </dl>
          )}

          {ing && idade !== null && idade < 18 && <p className="ck-p-alerta"><FiAlertTriangle aria-hidden="true" /> Titular menor de 18 anos: {idade < 12 ? 'só entra com um responsável.' : 'sem responsável, exija o termo de autorização assinado.'}</p>}
          {ing && resultado.tipo === 'valido' && <p className="ck-p-lembrete">Confira o documento com foto e o nome acima antes de liberar.</p>}
          {ing && ing.lote.categoria === 'Meia' && resultado.tipo === 'valido' && <p className="ck-p-alerta"><FiAlertTriangle aria-hidden="true" /> Meia-entrada: peça a comprovação do direito (carteirinha ou documento).</p>}

          <div className="ck-p-botoes">
            {resultado.tipo === 'valido' && !outraEdicao && <button type="button" className="btn btn-primary ck-p-grande" disabled={confirmando} onClick={confirmar}>{confirmando ? 'Confirmando...' : 'Confirmar entrada'}</button>}
            <button type="button" className="btn btn-secondary ck-p-grande" onClick={() => { proximo(); ligarCamera(); }}>Ler próximo</button>
            <button type="button" className="btn btn-secondary" onClick={proximo}>Limpar</button>
          </div>
        </section>
      )}

      {historico.length > 0 && (
        <section className="ck-p-historico" aria-labelledby="ck-hist-t">
          <h2 id="ck-hist-t">Entradas liberadas nesta sessão ({historico.length})</h2>
          <ul>{historico.map((h) => <li key={`${h.id}-${h.hora.getTime()}`}><strong>{h.nome}</strong><span>{h.hora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span></li>)}</ul>
        </section>
      )}
    </div>
  );
}
