import { CONTATO_PRIVACIDADE, DATA_TERMOS, VERSAO_TERMOS } from '../../utils/termos';

// Texto dos Termos de Uso e da Política de Privacidade (LGPD, Lei 13.709/2018). Usado no pop-up do cadastro e na página /termos.
// Cada bloco tem um id para poder ser linkado de outros lugares (compras, expositor, competição...).
export function TextoTermos() {
  const c = CONTATO_PRIVACIDADE;
  return (
    <div className="tm-texto">
      <p className="tm-versao">Versão {VERSAO_TERMOS} · atualizada em {DATA_TERMOS}</p>

      <section id="termos" aria-labelledby="tm-h-termos">
        <h2 id="tm-h-termos">1. Termos de Uso</h2>
        <p>Este site é mantido pelo <strong>Conselho de Cultura POP de Ponta Grossa (CCPOP)</strong> para divulgar e organizar a Geektopia, os Pockets e outros eventos: venda de ingressos, inscrição em competições, solicitação de espaço para expositores e divulgação de eventos da comunidade. Ao criar a sua conta você concorda com estes termos e com a Política de Privacidade abaixo.</p>
        <ul>
          <li><strong>Conta:</strong> você deve informar dados verdadeiros e mantê-los atualizados. A senha é pessoal; não a compartilhe. Você responde pelo que for feito com a sua conta.</li>
          <li><strong>Idade:</strong> é preciso ter pelo menos 12 anos para criar uma conta. Menores de 18 anos podem precisar de autorização do responsável para entrar em cada evento, conforme a classificação indicativa, e o termo é apresentado na portaria.</li>
          <li><strong>Uso correto:</strong> não é permitido usar o site para fraudar compras, tentar acessar dados de outras pessoas, enviar conteúdo ilegal ou ofensivo ou atrapalhar o funcionamento da plataforma. Contas que descumprirem podem ser suspensas.</li>
          <li><strong>Disponibilidade:</strong> fazemos o possível para manter o site no ar, mas ele pode ficar indisponível por manutenção ou por falhas de serviços de terceiros.</li>
          <li><strong>Mudanças:</strong> podemos atualizar estes textos. Quando a mudança for relevante, você será avisado e poderá precisar aceitar a nova versão.</li>
        </ul>
      </section>

      <section id="privacidade" aria-labelledby="tm-h-priv">
        <h2 id="tm-h-priv">2. Política de Privacidade (LGPD)</h2>
        <h3>Quais dados coletamos</h3>
        <ul>
          <li><strong>Cadastro:</strong> nome, documento (CPF, CNPJ ou passaporte), data de nascimento, e-mail, telefone, estado e cidade, senha (guardada de forma protegida, nunca em texto aberto) e gênero.</li>
          <li><strong>Gênero:</strong> é pedido no cadastro para produzirmos estatísticas do público. Você pode escolher “Prefiro não informar”.</li>
          <li><strong>Sexualidade (opcional):</strong> só se você quiser informar, no seu perfil. É um dado pessoal sensível e o tratamos apenas com o seu consentimento. Você pode alterar ou apagar quando quiser.</li>
          <li><strong>Perfil:</strong> apelido e foto, se você enviar.</li>
          <li><strong>Ingressos:</strong> nome, documento e data de nascimento de quem vai usar cada ingresso, para conferir na entrada e a idade mínima do evento.</li>
          <li><strong>Participação:</strong> dados enviados em solicitações de espaço, inscrições em competições e eventos da comunidade, incluindo links de portfólio.</li>
          <li><strong>Pagamentos:</strong> quem processa o pagamento é o Mercado Pago. Nós <strong>não</strong> recebemos nem guardamos número de cartão; guardamos apenas o status e o valor do pagamento.</li>
        </ul>

        <h3>Para que usamos</h3>
        <ul>
          <li>Criar e manter a sua conta e permitir o login.</li>
          <li>Vender e entregar ingressos, validar a entrada (QR code) e conferir idade mínima.</li>
          <li>Analisar candidaturas de expositores, competidores e eventos da comunidade.</li>
          <li>Avisar você sobre compras, aprovações e mudanças, dentro do site e por e-mail.</li>
          <li>Segurança e prevenção a fraudes.</li>
          <li>Gerar <strong>relatórios estatísticos agregados</strong> (por exemplo, percentual do público por cidade, faixa etária e gênero) para prestação de contas e para apoiadores, como o turismo e o poder público. Esses relatórios <strong>não identificam pessoas</strong>.</li>
        </ul>
        <p>As bases legais são: execução do contrato (sua conta e suas compras), cumprimento de obrigação legal, legítimo interesse (segurança e estatísticas agregadas) e o seu consentimento, quando for o caso (como a sexualidade).</p>

        <h3>Quem pode ver os seus dados</h3>
        <ul>
          <li>Os dados pessoais ficam em sistema com acesso restrito. Só <strong>administradores da CCPOP</strong>, com login próprio, podem consultá-los, e apenas para as finalidades acima.</li>
          <li><strong>Não vendemos nem cedemos</strong> os seus dados para fins de publicidade.</li>
          <li>Compartilhamos só o necessário com quem nos presta serviço: <strong>Mercado Pago</strong> (pagamento), serviço de hospedagem e armazenamento do site e serviço de envio de e-mails. Eles só podem usar os dados para nos prestar o serviço.</li>
          <li>Podemos ser obrigados a fornecer dados por ordem judicial ou de autoridade competente.</li>
        </ul>

        <h3>Segurança</h3>
        <p>Usamos medidas técnicas como senhas protegidas, comunicação criptografada, controle de acesso por perfil e limites contra abusos. Nenhum sistema é totalmente imune a falhas; se houver um incidente que possa causar risco relevante a você, comunicaremos você e a Autoridade Nacional de Proteção de Dados (ANPD), como exige a lei.</p>

        <h3>Por quanto tempo guardamos</h3>
        <p>Enquanto a sua conta existir e pelo tempo necessário para cumprir obrigações legais e fiscais (por exemplo, registros de compras). Depois disso, os dados são apagados ou anonimizados.</p>

        <h3>Os seus direitos</h3>
        <p>Pela LGPD (art. 18) você pode: confirmar que tratamos seus dados; acessá-los; corrigir dados incompletos ou errados; pedir anonimização, bloqueio ou eliminação de dados desnecessários; pedir a portabilidade; saber com quem compartilhamos; e <strong>revogar o consentimento</strong> quando quiser. Dados como nome, apelido, telefone, cidade, gênero e sexualidade você mesmo altera em <strong>Meu Perfil</strong>. Para os demais pedidos, fale com a CCPOP: Instagram <a href={c.instagram} target="_blank" rel="noopener noreferrer">{c.instagramUsuario}</a>{c.email ? <> ou <a href={`mailto:${c.email}`}>{c.email}</a></> : null}. Responderemos no prazo legal.</p>
      </section>

      <section id="compras" aria-labelledby="tm-h-compras">
        <h2 id="tm-h-compras">3. Compras e ingressos</h2>
        <ul>
          <li>O pagamento é feito no ambiente do <strong>Mercado Pago</strong>. O ingresso só é emitido depois que o pagamento é aprovado e confere com o valor do pedido.</li>
          <li>Cada ingresso é <strong>nominal</strong>: você informa nome, documento e data de nascimento de quem vai usá-lo. Na entrada podem pedir documento com foto.</li>
          <li>Há limite de ingressos por compra e por pessoa em alguns lotes. A <strong>meia-entrada</strong> exige comprovação do direito na entrada; sem ela pode ser cobrada a diferença.</li>
          <li>Cada evento tem <strong>idade mínima ou classificação indicativa</strong>. Menores devem seguir a regra do evento e apresentar o termo de autorização quando exigido.</li>
          <li>Cancelamento e reembolso seguem o Código de Defesa do Consumidor e as regras divulgadas em cada evento. Em caso de dúvida ou de cobrança indevida, fale com a CCPOP informando o número do pedido.</li>
          <li>Guarde o QR code do seu ingresso: quem apresentar o código primeiro pode entrar. Não publique o QR code.</li>
        </ul>
      </section>

      <section id="participacao" aria-labelledby="tm-h-part">
        <h2 id="tm-h-part">4. Expositores, competidores e eventos da comunidade</h2>
        <ul>
          <li><strong>Portfólio obrigatório:</strong> para pedir espaço, se inscrever numa competição ou divulgar um evento, você informa um link (Instagram, site, Drive...) que a organização usa para avaliar o pedido. Você garante que o material é seu ou que tem autorização para usá-lo.</li>
          <li><strong>Análise:</strong> a organização aprova ou recusa cada pedido e pode informar o motivo. Aprovar um pedido não garante vaga se as regras do evento não forem cumpridas.</li>
          <li><strong>Taxas:</strong> quando houver taxa de espaço ou de inscrição, ela é cobrada depois da aprovação, pelo Mercado Pago.</li>
          <li><strong>Competições:</strong> valem o regulamento e as regras de cada competição, publicados na página dela.</li>
          <li><strong>Eventos da comunidade:</strong> a divulgação é gratuita e não implica que a CCPOP organiza o evento. A venda, as regras e a segurança são de responsabilidade de quem organiza. A CCPOP pode recusar ou retirar a divulgação.</li>
        </ul>
      </section>

      <section id="foro" aria-labelledby="tm-h-foro">
        <h2 id="tm-h-foro">5. Disposições finais</h2>
        <p>Estes termos seguem a legislação brasileira. Fica eleito o foro da comarca de Ponta Grossa, Paraná, ressalvado o direito do consumidor de propor ação no foro de seu domicílio.</p>
      </section>
    </div>
  );
}
