import { ImagemUpload } from './ImagemUpload';
import { ANGULOS, PRESETS, contrasteComBranco, cssDoFundo, fundoParaTexto, lerFundo } from '../../utils/fundo';

// Tudo sobre o topo da página da edição num lugar só: escolher entre IMAGEM DE CAPA
// (com o envio da foto) ou COR / GRADIENTE, com prévia.
//   fundo / onFundo   estado do editor (ver fundoInicial)
//   foto / onFoto     arquivo escolhido para envio (imagem)
export function BannerEditor({ evento, nome, fundo, onFundo, foto, onFoto }) {
  const texto = fundoParaTexto(fundo);
  const contraste = texto ? contrasteComBranco(texto) : null;
  const mudar = (parcial) => onFundo({ ...fundo, ...parcial });
  const escolherPreset = (valor) => {
    const f = lerFundo(valor);
    mudar({ modo: 'cor', cor1: f.cor1, cor2: f.cor2 || fundo.cor2, gradiente: Boolean(f.cor2), angulo: f.angulo });
  };

  return (
    <fieldset className="ed-fieldset">
      <legend>Fundo do topo da página</legend>
      <div className="fu-radios" role="radiogroup" aria-label="Tipo de fundo do topo da página">
        <label className="ed-check"><input type="radio" name="fundo-modo" checked={fundo.modo === 'imagem'} onChange={() => mudar({ modo: 'imagem' })} /> Imagem de capa</label>
        <label className="ed-check"><input type="radio" name="fundo-modo" checked={fundo.modo === 'cor'} onChange={() => mudar({ modo: 'cor' })} /> Cor ou gradiente</label>
      </div>

      {fundo.modo === 'imagem' ? (
        <ImagemUpload
          rotulo="Foto de capa"
          urlAtual={evento?.banner_url}
          arquivo={foto}
          onEscolher={onFoto}
          ajuda="Aparece no topo da página do evento. JPEG, PNG ou WEBP, até 4MB. Imagens largas (16:9) ficam melhores."
        />
      ) : (
        <>
          <div className="ed-fundo-presets" role="group" aria-label="Combinações prontas">
            {PRESETS.map((pr) => (
              <button key={pr.nome} type="button" className={`ed-fundo-preset ${texto === pr.valor ? 'is-ativo' : ''}`} style={{ background: cssDoFundo(pr.valor) }}
                aria-label={`Usar ${pr.nome}`} aria-pressed={texto === pr.valor} onClick={() => escolherPreset(pr.valor)}>
                <span>{pr.nome}</span>
              </button>
            ))}
          </div>

          <div className="ed-linha ed-linha-quebra">
            <div className="ed-campo">
              <label htmlFor="b-cor1">{fundo.gradiente ? 'Cor inicial' : 'Cor'}</label>
              <div className="ed-cor"><input id="b-cor1" type="color" value={fundo.cor1} onChange={(e) => mudar({ cor1: e.target.value.toUpperCase() })} /><span>{fundo.cor1}</span></div>
            </div>
            {fundo.gradiente && (
              <div className="ed-campo">
                <label htmlFor="b-cor2">Cor final</label>
                <div className="ed-cor"><input id="b-cor2" type="color" value={fundo.cor2} onChange={(e) => mudar({ cor2: e.target.value.toUpperCase() })} /><span>{fundo.cor2}</span></div>
              </div>
            )}
            {fundo.gradiente && (
              <div className="ed-campo">
                <label htmlFor="b-ang">Direção</label>
                <select id="b-ang" value={fundo.angulo} onChange={(e) => mudar({ angulo: Number(e.target.value) })}>
                  {ANGULOS.map((a) => <option key={a.valor} value={a.valor}>{a.rotulo}</option>)}
                </select>
              </div>
            )}
          </div>
          <label className="ed-check"><input type="checkbox" checked={fundo.gradiente} onChange={(e) => mudar({ gradiente: e.target.checked })} /> Usar gradiente (duas cores)</label>

          <div className="ed-fundo-previa" style={{ background: cssDoFundo(texto) }} role="img" aria-label="Prévia do topo da página">
            <span className="ed-fundo-previa-eyebrow">Próxima edição</span>
            <strong>{nome || 'Nome do evento'}</strong>
            <span>{evento?.tagline || 'Sua frase de destaque aparece aqui'}</span>
          </div>
          {contraste !== null && contraste < 3 && (
            <p className="ed-alerta" role="status">Estas cores são muito claras: o texto branco do topo pode ficar difícil de ler. Prefira tons mais escuros.</p>
          )}
          {evento?.banner_url && <p className="ed-ajuda">A foto de capa continua guardada, mas não aparece enquanto você usar cor ou gradiente.</p>}
        </>
      )}
    </fieldset>
  );
}
