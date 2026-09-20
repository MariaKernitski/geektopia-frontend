import { useEffect, useId, useMemo, useState } from 'react';

// Mesmos limites do backend (uploadMiddleware). Validar aqui poupa o envio de
// um arquivo que o servidor recusaria de qualquer jeito.
const TIPOS = ['image/jpeg', 'image/png', 'image/webp'];
const TAMANHO_MAXIMO = 4 * 1024 * 1024;

// Seletor de imagem com pré-visualização.
//   urlAtual  imagem já salva (mostrada até escolherem outra)
//   arquivo   arquivo novo escolhido, ainda não enviado (estado do pai)
//   onEscolher(file|null)  avisa o pai; quem envia é o pai
//   onRemover  opcional: mostra "Remover imagem" para a imagem já salva
export function ImagemUpload({ rotulo, urlAtual, arquivo, onEscolher, onRemover, ajuda, formato = 'paisagem' }) {
  const id = useId();
  const [erro, setErro] = useState('');
  const preview = useMemo(() => (arquivo ? URL.createObjectURL(arquivo) : null), [arquivo]);

  // Libera a memória da pré-visualização anterior quando o arquivo muda.
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const escolher = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // permite escolher o mesmo arquivo de novo depois
    if (!file) return;

    if (!TIPOS.includes(file.type)) {
      setErro('Use uma imagem JPEG, PNG ou WEBP.');
      return;
    }
    if (file.size > TAMANHO_MAXIMO) {
      setErro('A imagem passa de 4MB. Reduza o tamanho e tente de novo.');
      return;
    }
    setErro('');
    onEscolher(file);
  };

  const imagem = preview || urlAtual;

  return (
    <div className="ed-campo" role="group" aria-labelledby={`${id}-rotulo`}>
      <span className="ed-rotulo" id={`${id}-rotulo`}>{rotulo}</span>

      <div className={`ed-upload ed-upload-${formato}`}>
        {imagem ? (
          <img src={imagem} alt="Pré-visualização da imagem" />
        ) : (
          <span className="ed-upload-vazio">Nenhuma imagem</span>
        )}
      </div>

      <div className="ed-upload-acoes">
        <input id={id} type="file" accept={TIPOS.join(',')} className="ed-sr-only" onChange={escolher} />
        <label htmlFor={id} className="btn btn-secondary ed-btn-sm">
          {imagem ? 'Trocar imagem' : 'Escolher imagem'}
        </label>

        {arquivo && (
          <button type="button" className="btn btn-secondary ed-btn-sm" onClick={() => { setErro(''); onEscolher(null); }}>
            Descartar nova imagem
          </button>
        )}
        {onRemover && urlAtual && !arquivo && (
          <button type="button" className="btn btn-danger ed-btn-sm" onClick={onRemover}>
            Remover imagem
          </button>
        )}
      </div>

      {ajuda && <small className="ed-ajuda">{ajuda}</small>}
      {erro && <p className="ed-erro-campo" role="alert">{erro}</p>}
    </div>
  );
}
