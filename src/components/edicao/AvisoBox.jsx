// Faixa de retorno da tela (sucesso/erro).
//
// A região aria-live fica SEMPRE no DOM: leitores de tela só anunciam
// mudanças de uma região que já existia antes do texto aparecer. Vazia, ela
// não ocupa espaço; a faixa colorida só existe enquanto há mensagem.
export function AvisoBox({ aviso }) {
  return (
    <div role={aviso.tipo === 'erro' ? 'alert' : 'status'} aria-live="polite">
      {aviso.texto && <div className={`ed-aviso is-${aviso.tipo}`}>{aviso.texto}</div>}
    </div>
  );
}
