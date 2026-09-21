import { Component } from 'react';

// Rede de segurança: se uma tela falhar ao desenhar, mostra um aviso com saída em vez de deixar a página em branco.
export class ErroTela extends Component {
  state = { erro: null };

  static getDerivedStateFromError(erro) {
    return { erro };
  }

  componentDidCatch(erro) {
    console.error('Erro ao desenhar a tela:', erro);
  }

  render() {
    if (!this.state.erro) return this.props.children;
    return (
      <div role="alert" style={{ maxWidth: 520, margin: '80px auto', padding: 24, textAlign: 'center' }}>
        <h1 style={{ fontSize: 22 }}>Algo deu errado nesta tela</h1>
        <p>Seus dados estão salvos. Tente recarregar a página; se continuar, avise a organização.</p>
        <p>
          <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>Recarregar</button>{' '}
          <a href="/" className="btn btn-secondary">Ir para o início</a>
        </p>
      </div>
    );
  }
}
