import { FiFileText, FiInfo } from 'react-icons/fi';

export const URL_TERMO_MENORES = '/documentos/termo-autorizacao-entrada-menores.pdf';

// Aviso permanente da Geektopia Principal sobre a entrada de menores de idade.
// Regra do evento (mais cautelosa que o mínimo da Portaria MJ 502/2021, que
// libera crianças a partir de 10 anos com termo): menores de 12 vão com um
// responsável; de 12 a 17 anos, quem vem sem responsável leva o termo assinado.
export function AvisoMenores({ escuro = false }) {
  return (
    <aside className={`pb-aviso-menores ${escuro ? 'is-escuro' : ''}`} aria-labelledby="aviso-menores-t">
      <FiInfo className="pb-aviso-menores-icone" aria-hidden="true" />
      <div className="pb-aviso-menores-texto">
        <strong id="aviso-menores-t">Menores de 18 anos: leve o termo de autorização</strong>
        <p>
          <b>Até 11 anos:</b> a entrada é somente com um responsável. <b>De 12 a 17 anos:</b> quem vier sem responsável
          precisa apresentar, na portaria, o <b>termo de autorização assinado</b> pelo pai, mãe ou responsável legal, junto com um documento com foto.
        </p>
      </div>
      <a className="btn btn-secondary pb-aviso-menores-acao" href={URL_TERMO_MENORES} target="_blank" rel="noopener noreferrer" download>
        <FiFileText aria-hidden="true" /> Baixar o termo (PDF)
      </a>
    </aside>
  );
}
