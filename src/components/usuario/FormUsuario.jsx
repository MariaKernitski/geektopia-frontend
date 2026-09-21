import { useMemo, useState } from 'react';
import { FiAlertCircle, FiCheck, FiCircle } from 'react-icons/fi';
import * as v from '../../utils/validacao';
import { mascaraCnpj, mascaraCpf, mascaraTelefone } from '../../utils/mascaras';
import { useLocalidades } from '../../hooks/useLocalidades';
import '../../style/AdminEdicao.css';
import '../../style/FormUsuario.css';

// Formulário de usuário em etapas, usado em três lugares:
//   'cadastro'      cadastro público (senha, termos, telefone e cidade obrigatórios)
//   'admin-criar'   o administrador cadastra alguém (senha temporária, nível de acesso)
//   'admin-editar'  o administrador edita (sem senha; todas as abas liberadas)
//
// Navegação: as abas são clicáveis, mas uma etapa só libera quando as anteriores
// estão válidas. Os erros aparecem na hora, no próprio campo (ao sair dele e a
// cada tecla depois disso), e os erros que só o servidor sabe (e-mail já
// cadastrado, por exemplo) levam direto para a etapa e o campo certo.

const PASSOS = [
  { id: 'pessoais', rotulo: 'Dados pessoais', campos: ['nome_completo', 'documento', 'data_nascimento'] },
  { id: 'contato', rotulo: 'Contato e acesso', campos: ['email', 'telefone', 'senha', 'confirmarSenha'] },
  { id: 'local', rotulo: 'Localização e extras', campos: ['estado', 'cidade', 'genero', 'sexualidade', 'nivel_permissao', 'aceitaTermos'] }
];

// O servidor responde com o nome do campo do banco; a tela agrupa os três documentos.
const CAMPO_DO_SERVIDOR = { cpf: 'documento', cnpj: 'documento', passaporte: 'documento' };

const CAMPOS_POR_MODO = {
  cadastro: ['nome_completo', 'documento', 'data_nascimento', 'email', 'telefone', 'senha', 'confirmarSenha', 'estado', 'cidade', 'genero', 'sexualidade', 'aceitaTermos'],
  'admin-criar': ['nome_completo', 'documento', 'data_nascimento', 'email', 'telefone', 'senha', 'confirmarSenha', 'estado', 'cidade', 'genero', 'sexualidade', 'nivel_permissao'],
  'admin-editar': ['nome_completo', 'documento', 'data_nascimento', 'email', 'telefone', 'estado', 'cidade', 'genero', 'sexualidade']
};

const MASCARA_DOC = { cpf: mascaraCpf, cnpj: mascaraCnpj, passaporte: (x) => x.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20) };
const PLACEHOLDER_DOC = { cpf: '000.000.000-00', cnpj: '00.000.000/0001-00', passaporte: 'Ex: CS123456' };

function valoresIniciais(u) {
  const tipoDoc = u?.cnpj ? 'cnpj' : u?.passaporte ? 'passaporte' : 'cpf';
  const doc = u?.[tipoDoc] || '';
  return {
    nome_completo: u?.nome_completo || '',
    tipoDoc,
    documento: MASCARA_DOC[tipoDoc](doc),
    data_nascimento: u?.data_nascimento ? String(u.data_nascimento).slice(0, 10) : '',
    email: u?.email || '',
    telefone: mascaraTelefone(u?.telefone || ''),
    senha: '',
    confirmarSenha: '',
    estado: u?.estado || '',
    cidade: u?.cidade || '',
    genero: u?.genero || '',
    sexualidade: u?.sexualidade || '',
    nivel_permissao: '',
    aceitaTermos: false
  };
}

function calcularErros(val, modo) {
  const cadastro = modo === 'cadastro';
  const comSenha = modo !== 'admin-editar';
  const e = {
    nome_completo: v.nomeCompleto(val.nome_completo, { doisNomes: val.tipoDoc === 'cpf' }),
    documento: v.documento(val.tipoDoc, val.documento),
    data_nascimento: v.dataNascimento(val.data_nascimento),
    email: v.email(val.email),
    telefone: v.telefone(val.telefone, { obrigatorio: cadastro }),
    estado: cadastro ? v.obrigatorio(val.estado, 'Selecione o estado.') : '',
    cidade: cadastro ? v.obrigatorio(val.cidade, 'Selecione a cidade.') : ''
  };
  if (comSenha) {
    e.senha = v.senha(val.senha);
    e.confirmarSenha = v.confirmarSenha(val.confirmarSenha, val.senha);
  }
  if (cadastro) e.aceitaTermos = val.aceitaTermos ? '' : 'Aceite os Termos de Uso para concluir o cadastro.';
  return Object.fromEntries(Object.entries(e).filter(([, msg]) => msg));
}

function Campo({ id, rotulo, obrigatorio, erro, ajuda, children }) {
  return (
    <div className="ed-campo">
      <label htmlFor={`u-${id}`}>{rotulo}{obrigatorio && ' *'}</label>
      {children}
      {ajuda && !erro && <small className="ed-ajuda">{ajuda}</small>}
      {erro && <p className="ed-erro-campo" id={`erro-u-${id}`} role="alert">{erro}</p>}
    </div>
  );
}

export function FormUsuario({ modo, inicial, onSubmit, rotuloEnvio, onCancelar }) {
  const [val, setVal] = useState(() => valoresIniciais(inicial));
  const [passo, setPasso] = useState(0);
  const [tocados, setTocados] = useState({});
  const [tentou, setTentou] = useState(false);
  const [errosServidor, setErrosServidor] = useState({});
  const [aviso, setAviso] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [verSenha, setVerSenha] = useState(false);
  const [visitados, setVisitados] = useState([0]);

  const { estados, cidades, carregandoCidades } = useLocalidades(val.estado);

  const editando = modo === 'admin-editar';
  const camposDoModo = CAMPOS_POR_MODO[modo];
  const passos = useMemo(
    () => PASSOS.map((p) => ({ ...p, campos: p.campos.filter((c) => camposDoModo.includes(c) || (c === 'nivel_permissao' && modo === 'admin-criar')) })),
    [camposDoModo, modo]
  );
  const erros = useMemo(() => calcularErros(val, modo), [val, modo]);
  const ultimo = passos.length - 1;

  const erroVisivel = (campo) => errosServidor[campo] || ((tocados[campo] || tentou) ? erros[campo] || '' : '');
  const temErro = (campo) => Boolean(errosServidor[campo] || erros[campo]);
  const passoValido = (i) => passos[i].campos.every((c) => !temErro(c));
  const passoLiberado = (i) => editando || passos.slice(0, i).every((_, j) => passoValido(j));

  const focar = (campo) => setTimeout(() => document.getElementById(`u-${campo}`)?.focus(), 0);
  const marcarTocados = (campos) => setTocados((t) => ({ ...t, ...Object.fromEntries(campos.map((c) => [c, true])) }));
  const primeiroInvalido = (i) => passos[i].campos.find((c) => temErro(c));

  const mudarPasso = (i) => {
    marcarTocados(passos[passo].campos); // ao sair, os erros da etapa passam a aparecer
    setPasso(i);
    setVisitados((vs) => (vs.includes(i) ? vs : [...vs, i]));
    setAviso('');
  };

  const clicarAba = (i) => {
    if (i === passo) return;
    // Bloqueado: leva a pessoa até o primeiro problema, em vez de só recusar.
    for (let j = 0; j < i; j += 1) {
      if (!editando && !passoValido(j)) {
        marcarTocados(passos[j].campos);
        setAviso(`Complete a etapa "${passos[j].rotulo}" antes de seguir.`);
        setPasso(j);
        focar(primeiroInvalido(j));
        return;
      }
    }
    mudarPasso(i);
  };

  const proximo = () => {
    const problema = primeiroInvalido(passo);
    if (problema) {
      marcarTocados(passos[passo].campos);
      setAviso('Corrija os campos destacados para continuar.');
      focar(problema);
      return;
    }
    mudarPasso(passo + 1);
  };

  const alterar = (campo, valor) => {
    setVal((x) => ({ ...x, [campo]: valor }));
    setErrosServidor((s) => (s[campo] ? { ...s, [campo]: undefined } : s));
    setAviso('');
  };
  const aoSair = (campo) => marcarTocados([campo]);

  const montarPayload = () => {
    const doc = val.tipoDoc === 'passaporte' ? val.documento.trim().toUpperCase() : val.documento.replace(/\D/g, '');
    const payload = {
      nome_completo: val.nome_completo.trim(),
      cpf: val.tipoDoc === 'cpf' ? doc : null,
      cnpj: val.tipoDoc === 'cnpj' ? doc : null,
      passaporte: val.tipoDoc === 'passaporte' ? doc : null,
      data_nascimento: val.data_nascimento,
      email: val.email.trim(),
      telefone: val.telefone.replace(/\D/g, '') || null,
      estado: val.estado || null,
      cidade: val.cidade || null,
      genero: val.genero.trim() || null,
      sexualidade: val.sexualidade.trim() || null
    };
    if (modo !== 'admin-editar') payload.senha = val.senha;
    if (modo === 'admin-criar' && val.nivel_permissao) payload.nivel_permissao = val.nivel_permissao;
    return payload;
  };

  const enviar = async (e) => {
    e.preventDefault();
    if (enviando) return;
    setTentou(true);

    // Antes de enviar: acha a primeira etapa com problema e leva até ele.
    for (let i = 0; i < passos.length; i += 1) {
      const problema = primeiroInvalido(i);
      if (problema) {
        setPasso(i);
        setVisitados((vs) => (vs.includes(i) ? vs : [...vs, i]));
        setAviso('Há campos com problema. Corrija os destacados para continuar.');
        focar(problema);
        return;
      }
    }

    setEnviando(true);
    setAviso('');
    try {
      await onSubmit(montarPayload());
    } catch (err) {
      const resposta = err.response?.data;
      const campo = resposta?.campo && (CAMPO_DO_SERVIDOR[resposta.campo] || resposta.campo);
      if (campo) {
        const i = passos.findIndex((p) => p.campos.includes(campo));
        setErrosServidor((s) => ({ ...s, [campo]: resposta.error }));
        if (i >= 0) { setPasso(i); focar(campo); }
      }
      setAviso(resposta?.error || 'Não foi possível concluir. Tente de novo.');
      setEnviando(false);
    }
  };

  const idade = v.dataNascimento(val.data_nascimento) ? null : v.idadeEmAnos(val.data_nascimento);
  const aria = (campo) => (erroVisivel(campo) ? { 'aria-invalid': true, 'aria-describedby': `erro-u-${campo}` } : {});
  const requisitos = v.requisitosSenha(val.senha);
  const tipoSenha = verSenha ? 'text' : 'password';

  return (
    <form onSubmit={enviar} noValidate className="fu">
      <nav className="fu-abas" aria-label="Etapas do formulário">
        {passos.map((p, i) => {
          const atual = i === passo;
          const bloqueada = !passoLiberado(i);
          const comErro = p.campos.some((c) => erroVisivel(c));
          const feita = !comErro && !bloqueada && visitados.includes(i) && passoValido(i) && !atual;
          return (
            <button
              key={p.id} type="button"
              className={`fu-aba ${atual ? 'is-atual' : ''} ${comErro ? 'is-erro' : ''} ${bloqueada ? 'is-bloqueada' : ''}`}
              aria-current={atual ? 'step' : undefined}
              aria-disabled={bloqueada || undefined}
              title={bloqueada ? 'Complete as etapas anteriores para liberar' : undefined}
              onClick={() => clicarAba(i)}
            >
              <span className="fu-aba-marca" aria-hidden="true">
                {comErro ? <FiAlertCircle /> : feita ? <FiCheck /> : i + 1}
              </span>
              <span>{p.rotulo}</span>
              {comErro && <span className="ed-sr-only"> (com erro)</span>}
              {feita && <span className="ed-sr-only"> (concluída)</span>}
            </button>
          );
        })}
      </nav>

      {aviso && <div className="fu-aviso" role="alert">{aviso}</div>}

      {passos[passo].id === 'pessoais' && (
        <section aria-labelledby="fu-t0">
          <h2 id="fu-t0" className="ed-subtitulo-secao">Dados pessoais</h2>

          <Campo id="nome_completo" rotulo="Nome completo" obrigatorio erro={erroVisivel('nome_completo')}>
            <input
              id="u-nome_completo" value={val.nome_completo} maxLength={150} autoComplete="name"
              onChange={(e) => alterar('nome_completo', e.target.value)} onBlur={() => aoSair('nome_completo')}
              {...aria('nome_completo')}
            />
          </Campo>

          <fieldset className="ed-fieldset fu-doc">
            <legend>Documento *</legend>
            <div className="fu-radios" role="radiogroup" aria-label="Tipo de documento">
              {[['cpf', 'CPF'], ['cnpj', 'CNPJ'], ['passaporte', 'Passaporte']].map(([tipo, rotulo]) => (
                <label key={tipo} className="ed-check">
                  <input
                    type="radio" name="tipoDoc" value={tipo} checked={val.tipoDoc === tipo}
                    onChange={() => {
                      setVal((x) => ({ ...x, tipoDoc: tipo, documento: '' }));
                      setTocados((t) => ({ ...t, documento: false }));
                      setErrosServidor((s) => ({ ...s, documento: undefined }));
                    }}
                  />
                  {rotulo}
                </label>
              ))}
            </div>
            <Campo id="documento" rotulo={val.tipoDoc === 'cpf' ? 'Número do CPF' : val.tipoDoc === 'cnpj' ? 'Número do CNPJ' : 'Número do passaporte'} obrigatorio erro={erroVisivel('documento')}>
              <input
                id="u-documento" value={val.documento} inputMode={val.tipoDoc === 'passaporte' ? 'text' : 'numeric'}
                placeholder={PLACEHOLDER_DOC[val.tipoDoc]}
                onChange={(e) => alterar('documento', MASCARA_DOC[val.tipoDoc](e.target.value))} onBlur={() => aoSair('documento')}
                {...aria('documento')}
              />
            </Campo>
          </fieldset>

          <Campo id="data_nascimento" rotulo="Data de nascimento" obrigatorio erro={erroVisivel('data_nascimento')} ajuda={idade !== null ? `${idade} ano${idade === 1 ? '' : 's'} de idade` : undefined}>
            <input
              id="u-data_nascimento" type="date" value={val.data_nascimento} max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => alterar('data_nascimento', e.target.value)} onBlur={() => aoSair('data_nascimento')}
              {...aria('data_nascimento')}
            />
          </Campo>
        </section>
      )}

      {passos[passo].id === 'contato' && (
        <section aria-labelledby="fu-t1">
          <h2 id="fu-t1" className="ed-subtitulo-secao">{editando ? 'Contato' : 'Contato e acesso'}</h2>

          <Campo id="email" rotulo="E-mail" obrigatorio erro={erroVisivel('email')}>
            <input
              id="u-email" type="email" value={val.email} maxLength={100} autoComplete="email" placeholder="nome@dominio.com"
              onChange={(e) => alterar('email', e.target.value)} onBlur={() => aoSair('email')}
              {...aria('email')}
            />
          </Campo>

          <Campo id="telefone" rotulo="Telefone" obrigatorio={modo === 'cadastro'} erro={erroVisivel('telefone')}>
            <input
              id="u-telefone" type="tel" value={val.telefone} inputMode="tel" autoComplete="tel" placeholder="(00) 00000-0000"
              onChange={(e) => alterar('telefone', mascaraTelefone(e.target.value))} onBlur={() => aoSair('telefone')}
              {...aria('telefone')}
            />
          </Campo>

          {!editando && (
            <>
              <Campo id="senha" rotulo={modo === 'admin-criar' ? 'Senha temporária' : 'Senha'} obrigatorio erro={erroVisivel('senha')}>
                <input
                  id="u-senha" type={tipoSenha} value={val.senha} autoComplete="new-password"
                  onChange={(e) => alterar('senha', e.target.value)} onBlur={() => aoSair('senha')}
                  {...aria('senha')}
                />
                <ul className="fu-checklist" aria-label="Requisitos da senha">
                  {[
                    ['tamanho', 'Mínimo de 8 caracteres'],
                    ['maiuscula', 'Uma letra maiúscula'],
                    ['minuscula', 'Uma letra minúscula'],
                    ['numero', 'Um número'],
                    ['especial', 'Um caractere especial (!@#$%...)']
                  ].map(([chave, texto]) => (
                    <li key={chave} className={requisitos[chave] ? 'is-valido' : ''}>
                      {requisitos[chave] ? <FiCheck aria-hidden="true" /> : <FiCircle aria-hidden="true" />} {texto}
                      <span className="ed-sr-only">{requisitos[chave] ? ' (atendido)' : ' (pendente)'}</span>
                    </li>
                  ))}
                </ul>
              </Campo>

              <Campo id="confirmarSenha" rotulo="Confirme a senha" obrigatorio erro={erroVisivel('confirmarSenha')}>
                <input
                  id="u-confirmarSenha" type={tipoSenha} value={val.confirmarSenha} autoComplete="new-password"
                  onChange={(e) => alterar('confirmarSenha', e.target.value)} onBlur={() => aoSair('confirmarSenha')}
                  {...aria('confirmarSenha')}
                />
              </Campo>

              <label className="ed-check">
                <input type="checkbox" checked={verSenha} onChange={(e) => setVerSenha(e.target.checked)} />
                Mostrar a senha
              </label>
              {modo === 'admin-criar' && <p className="ed-ajuda">A pessoa deve trocar esta senha no primeiro acesso.</p>}
            </>
          )}
        </section>
      )}

      {passos[passo].id === 'local' && (
        <section aria-labelledby="fu-t2">
          <h2 id="fu-t2" className="ed-subtitulo-secao">Localização e dados adicionais</h2>

          <div className="ed-linha">
            <Campo id="estado" rotulo="Estado" obrigatorio={modo === 'cadastro'} erro={erroVisivel('estado')}>
              <select
                id="u-estado" value={val.estado}
                onChange={(e) => { setVal((x) => ({ ...x, estado: e.target.value, cidade: '' })); setErrosServidor((s) => ({ ...s, estado: undefined, cidade: undefined })); }}
                onBlur={() => aoSair('estado')} {...aria('estado')}
              >
                <option value="">Selecione o estado...</option>
                {estados.map((uf) => <option key={uf.id} value={uf.sigla}>{uf.nome} ({uf.sigla})</option>)}
                {/* Sem IBGE (offline) ou UF já salva: mantém o valor selecionável. */}
                {val.estado && !estados.some((uf) => uf.sigla === val.estado) && <option value={val.estado}>{val.estado}</option>}
              </select>
            </Campo>

            <Campo id="cidade" rotulo="Cidade" obrigatorio={modo === 'cadastro'} erro={erroVisivel('cidade')}>
              <select
                id="u-cidade" value={val.cidade} disabled={!val.estado}
                onChange={(e) => alterar('cidade', e.target.value)} onBlur={() => aoSair('cidade')} {...aria('cidade')}
              >
                <option value="">{!val.estado ? 'Selecione primeiro o estado' : carregandoCidades ? 'Carregando cidades...' : 'Selecione a cidade...'}</option>
                {cidades.map((c) => <option key={c.id} value={c.nome}>{c.nome}</option>)}
                {val.cidade && !cidades.some((c) => c.nome === val.cidade) && <option value={val.cidade}>{val.cidade}</option>}
              </select>
            </Campo>
          </div>

          <fieldset className="ed-fieldset">
            <legend>Opcionais</legend>
            <div className="ed-linha">
              <Campo id="genero" rotulo="Gênero" erro={erroVisivel('genero')}>
                <input id="u-genero" value={val.genero} maxLength={50} placeholder="Ex: Mulher cis, Homem trans..." onChange={(e) => alterar('genero', e.target.value)} />
              </Campo>
              <Campo id="sexualidade" rotulo="Sexualidade" erro={erroVisivel('sexualidade')}>
                <input id="u-sexualidade" value={val.sexualidade} maxLength={50} placeholder="Ex: Heterossexual, Bissexual..." onChange={(e) => alterar('sexualidade', e.target.value)} />
              </Campo>
            </div>
          </fieldset>

          {modo === 'admin-criar' && (
            <Campo id="nivel_permissao" rotulo="Nível de acesso" ajuda="Um administrador pode ser criado já com permissão. Depois dá para promover ou rebaixar.">
              <select id="u-nivel_permissao" value={val.nivel_permissao} onChange={(e) => alterar('nivel_permissao', e.target.value)}>
                <option value="">Cliente (sem acesso administrativo)</option>
                <option value="ADMIN_CONTEUDO">Admin de Conteúdo</option>
                <option value="ADMIN_GERAL">Admin Geral</option>
              </select>
            </Campo>
          )}

          {modo === 'cadastro' && (
            <div className="ed-campo">
              <label className="ed-check">
                <input
                  id="u-aceitaTermos" type="checkbox" checked={val.aceitaTermos}
                  onChange={(e) => { alterar('aceitaTermos', e.target.checked); aoSair('aceitaTermos'); }}
                  {...aria('aceitaTermos')}
                />
                Declaro que li e concordo com os Termos de Uso. *
              </label>
              {erroVisivel('aceitaTermos') && <p className="ed-erro-campo" id="erro-u-aceitaTermos" role="alert">{erroVisivel('aceitaTermos')}</p>}
            </div>
          )}
        </section>
      )}

      <div className="fu-rodape">
        <div>
          {passo > 0 && <button type="button" className="btn btn-secondary" onClick={() => mudarPasso(passo - 1)}>← Voltar</button>}
          {onCancelar && passo === 0 && <button type="button" className="btn btn-secondary" onClick={onCancelar}>Cancelar</button>}
        </div>
        <div className="fu-rodape-dir">
          {passo < ultimo && <button type="button" className={`btn ${editando ? 'btn-secondary' : 'btn-primary'}`} onClick={proximo}>Próximo →</button>}
          {(passo === ultimo || editando) && (
            <button type="submit" className="btn btn-primary" disabled={enviando}>{enviando ? 'Salvando...' : rotuloEnvio}</button>
          )}
        </div>
      </div>
    </form>
  );
}
