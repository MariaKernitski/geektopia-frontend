import { describe, expect, it } from 'vitest';
import { artigoDaTela, semBotaoDeAjuda } from '../src/utils/ajudaContextual';

describe('ajuda contextual', () => {
  it('cada tela abre o artigo certo', () => {
    expect(artigoDaTela('/geektopia/12/comprar')).toBe('comprar-ingresso');
    expect(artigoDaTela('/geektopia/12')).toBe('comprar-ingresso');
    expect(artigoDaTela('/competicoes/3')).toBe('inscrever-competicao');
    expect(artigoDaTela('/expositor/solicitar')).toBe('solicitar-espaco');
    expect(artigoDaTela('/expositor/solicitacoes/9')).toBe('acompanhar-solicitacao');
    expect(artigoDaTela('/expositor')).toBe('virar-expositor');
    expect(artigoDaTela('/admin/dashboard')).toBe('admin-relatorios');
    expect(artigoDaTela('/admin/eventos/5/ingressos')).toBe('admin-criar-edicao');
    expect(artigoDaTela('/esqueci-senha')).toBe('esqueci-senha');
  });
  it('sem regra, abre a Central; e some nas páginas de ajuda', () => {
    expect(artigoDaTela('/')).toBeNull();
    expect(artigoDaTela('/termos')).toBeNull();
    expect(semBotaoDeAjuda('/ajuda')).toBe(true);
    expect(semBotaoDeAjuda('/ajuda/comprar-ingresso')).toBe(true);
    expect(semBotaoDeAjuda('/geektopia')).toBe(false);
  });
});
